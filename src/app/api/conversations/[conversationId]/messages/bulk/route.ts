import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

// DELETE - Bulk delete messages
export async function DELETE(
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

    const { messageIds, deleteForAll = false } = await request.json();

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return createErrorResponse('Message IDs array is required');
    }

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

    // Get messages to check ownership
    const messages = await prisma.message.findMany({
      where: {
        id: { in: messageIds },
        conversation_id: conversationId
      }
    });

    if (messages.length === 0) {
      return createErrorResponse('No valid messages found', 404);
    }

    // Check if user owns all messages (for delete for all)
    if (deleteForAll) {
      const unauthorizedMessages = messages.filter(msg => msg.sender_id !== parseInt(userId));
      if (unauthorizedMessages.length > 0) {
        return createErrorResponse('You can only delete your own messages for all participants', 403);
      }
    }

    // Update messages
    if (deleteForAll) {
      await prisma.message.updateMany({
        where: {
          id: { in: messageIds },
          conversation_id: conversationId,
          sender_id: parseInt(userId)
        },
        data: { deletedForAll: true }
      });
    } else {
      await prisma.message.updateMany({
        where: {
          id: { in: messageIds },
          conversation_id: conversationId,
          sender_id: parseInt(userId)
        },
        data: { isDeleted: true }
      });
    }

    return createSuccessResponse({
      message: `Successfully deleted ${messages.length} message(s)`,
      deletedCount: messages.length,
      deleteForAll
    });

  } catch (error) {
    console.error('Bulk delete messages error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// POST - Bulk forward messages
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

    const { messageIds, targetConversationId } = await request.json();

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return createErrorResponse('Message IDs array is required');
    }

    if (!targetConversationId) {
      return createErrorResponse('Target conversation ID is required');
    }

    // Check if user is member of both conversations
    const [sourceMembership, targetMembership] = await Promise.all([
      prisma.conversationMember.findUnique({
        where: {
          conversation_id_user_id: {
            conversation_id: conversationId,
            user_id: parseInt(userId)
          }
        }
      }),
      prisma.conversationMember.findUnique({
        where: {
          conversation_id_user_id: {
            conversation_id: parseInt(targetConversationId),
            user_id: parseInt(userId)
          }
        }
      })
    ]);

    if (!sourceMembership || !targetMembership) {
      return createErrorResponse('Access denied to one or both conversations', 403);
    }

    // Get original messages
    const originalMessages = await prisma.message.findMany({
      where: {
        id: { in: messageIds },
        conversation_id: conversationId
      }
    });

    if (originalMessages.length === 0) {
      return createErrorResponse('No valid messages found', 404);
    }

    // Create forwarded messages
    const forwardedMessages = [];
    for (const originalMessage of originalMessages) {
      const forwardedMessage = await prisma.message.create({
        data: {
          conversation_id: parseInt(targetConversationId),
          sender_id: parseInt(userId),
          content: `Forwarded: ${originalMessage.content}`,
          media_url: originalMessage.media_url,
          message_type: originalMessage.message_type,
          reply_to: null
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar_url: true
            }
          }
        }
      });

      forwardedMessages.push(forwardedMessage);
    }

    // Create message statuses for target conversation members
    const targetMembers = await prisma.conversationMember.findMany({
      where: { conversation_id: parseInt(targetConversationId) }
    });

    const messageStatuses = [];
    for (const message of forwardedMessages) {
      for (const member of targetMembers) {
        messageStatuses.push({
          message_id: message.id,
          user_id: member.user_id,
          status: 'sent'
        });
      }
    }

    if (messageStatuses.length > 0) {
      await prisma.messageStatus.createMany({
        data: messageStatuses
      });
    }

    return createSuccessResponse({
      message: `Successfully forwarded ${forwardedMessages.length} message(s)`,
      forwardedMessages
    }, 201);

  } catch (error) {
    console.error('Bulk forward messages error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}
