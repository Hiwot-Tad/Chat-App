import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

// PUT - Edit message
export async function PUT(
  request: NextRequest,
  { params }: { params: { conversationId: string; messageId: string } }
) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;
    const conversationId = parseInt(params.conversationId);
    const messageId = parseInt(params.messageId);

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { content, media_url } = await request.json();

    // Check if user is the sender of the message
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        sender_id: parseInt(userId),
        conversation_id: conversationId
      }
    });

    if (!message) {
      return createErrorResponse('Message not found or access denied', 404);
    }

    // Update message
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: content || message.content,
        media_url: media_url !== undefined ? media_url : message.media_url,
        updated_at: new Date(),
        isEdited: true
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

    return createSuccessResponse({
      message: 'Message updated successfully',
      data: updatedMessage
    });

  } catch (error) {
    console.error('Edit message error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// DELETE - Delete message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { conversationId: string; messageId: string } }
) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;
    const conversationId = parseInt(params.conversationId);
    const messageId = parseInt(params.messageId);

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { deleteForAll } = await request.json();

    // Check if user is the sender of the message
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        sender_id: parseInt(userId),
        conversation_id: conversationId
      }
    });

    if (!message) {
      return createErrorResponse('Message not found or access denied', 404);
    }

    if (deleteForAll) {
      // Delete for all participants
      await prisma.message.update({
        where: { id: messageId },
        data: { deletedForAll: true }
      });
    } else {
      // Delete for sender only
      await prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true }
      });
    }

    return createSuccessResponse({
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// POST - Forward message
export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string; messageId: string } }
) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;
    const conversationId = parseInt(params.conversationId);
    const messageId = parseInt(params.messageId);

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { targetConversationId } = await request.json();

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

    // Get original message
    const originalMessage = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!originalMessage) {
      return createErrorResponse('Original message not found', 404);
    }

    // Create forwarded message
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

    // Create message status for target conversation members
    const targetMembers = await prisma.conversationMember.findMany({
      where: { conversation_id: parseInt(targetConversationId) }
    });

    const messageStatuses = targetMembers.map((member: any) => ({
      message_id: forwardedMessage.id,
      user_id: member.user_id,
      status: 'sent'
    }));

    await prisma.messageStatus.createMany({
      data: messageStatuses
    });

    return createSuccessResponse({
      message: 'Message forwarded successfully',
      data: forwardedMessage
    }, 201);

  } catch (error) {
    console.error('Forward message error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}
