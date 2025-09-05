import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

// POST - Leave conversation or delete group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;
    const { conversationId: conversationIdParam } = await params;
    const conversationId = parseInt(conversationIdParam);

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { action = 'leave' } = await request.json(); // 'leave' or 'delete'

    // Check if user is a member of the conversation
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: parseInt(userId)
        }
      }
    });

    if (!membership) {
      return createErrorResponse('Access denied', 403);
    }

    // Get conversation details
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return createErrorResponse('Conversation not found', 404);
    }

    if (action === 'delete') {
      // Only owners can delete groups
      if (membership.role !== 'owner') {
        return createErrorResponse('Only owners can delete conversations', 403);
      }

      // Delete the entire conversation (cascades to messages, members, etc.)
      await prisma.conversation.delete({
        where: { id: conversationId }
      });

      return createSuccessResponse({
        message: 'Conversation deleted successfully'
      });
    } else {
      // Leave the conversation
      if (conversation.is_group && membership.role === 'owner') {
        // If owner is leaving a group, transfer ownership or delete group
        const otherAdmins = await prisma.conversationMember.findMany({
          where: {
            conversation_id: conversationId,
            user_id: { not: parseInt(userId) },
            role: 'admin'
          }
        });

        if (otherAdmins.length > 0) {
          // Transfer ownership to first admin
          await prisma.conversationMember.update({
            where: { id: otherAdmins[0].id },
            data: { role: 'owner' }
          });
        } else {
          // No other admins, delete the group
          await prisma.conversation.delete({
            where: { id: conversationId }
          });
          return createSuccessResponse({
            message: 'Group deleted (no other admins)'
          });
        }
      }

      // Remove user from conversation
      await prisma.conversationMember.delete({
        where: {
          conversation_id_user_id: {
            conversation_id: conversationId,
            user_id: parseInt(userId)
          }
        }
      });

      return createSuccessResponse({
        message: 'Left conversation successfully'
      });
    }

  } catch (error) {
    console.error('Leave/delete conversation error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}
