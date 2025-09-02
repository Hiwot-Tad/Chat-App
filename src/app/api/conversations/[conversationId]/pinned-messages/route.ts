import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

// GET - Get pinned messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;
    const conversationId = parseInt(params.conversationId);

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
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

    const pinnedMessages = await prisma.pinnedMessage.findMany({
      where: { conversation_id: conversationId },
      include: {
        message: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar_url: true
              }
            }
          }
        }
      },
      orderBy: { pinned_at: 'desc' }
    });

    return createSuccessResponse({ pinnedMessages });

  } catch (error) {
    console.error('Get pinned messages error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// POST - Pin a message
export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;
    const conversationId = parseInt(params.conversationId);

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { messageId } = await request.json();

    if (!messageId) {
      return createErrorResponse('Message ID is required');
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

    // Check if message exists in the conversation
    const message = await prisma.message.findFirst({
      where: {
        id: parseInt(messageId),
        conversation_id: conversationId
      }
    });

    if (!message) {
      return createErrorResponse('Message not found in this conversation', 404);
    }

    // Pin the message
    const pinnedMessage = await prisma.pinnedMessage.create({
      data: {
        message_id: parseInt(messageId),
        conversation_id: conversationId,
        user_id: parseInt(userId)
      },
      include: {
        message: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar_url: true
              }
            }
          }
        }
      }
    });

    return createSuccessResponse({
      message: 'Message pinned successfully',
      pinnedMessage
    }, 201);

  } catch (error) {
    console.error('Pin message error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// DELETE - Unpin a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;
    const conversationId = parseInt(params.conversationId);

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return createErrorResponse('Message ID is required');
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

    // Unpin the message
    await prisma.pinnedMessage.delete({
      where: {
        message_id_conversation_id: {
          message_id: parseInt(messageId),
          conversation_id: conversationId
        }
      }
    });

    return createSuccessResponse({
      message: 'Message unpinned successfully'
    });

  } catch (error) {
    console.error('Unpin message error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}
