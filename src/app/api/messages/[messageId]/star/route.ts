import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

// POST - Star a message
export async function POST(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;
    const messageId = parseInt(params.messageId);

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Check if message exists and user has access
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversation: {
          members: {
            some: {
              user_id: parseInt(userId)
            }
          }
        }
      }
    });

    if (!message) {
      return createErrorResponse('Message not found or access denied', 404);
    }

    // Check if already starred
    const existingStar = await prisma.starredMessage.findUnique({
      where: {
        message_id_user_id: {
          message_id: messageId,
          user_id: parseInt(userId)
        }
      }
    });

    if (existingStar) {
      return createErrorResponse('Message is already starred', 400);
    }

    // Star the message
    const starredMessage = await prisma.starredMessage.create({
      data: {
        message_id: messageId,
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
      message: 'Message starred successfully',
      starredMessage
    }, 201);

  } catch (error) {
    console.error('Star message error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// DELETE - Unstar a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;
    const messageId = parseInt(params.messageId);

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Remove star
    await prisma.starredMessage.delete({
      where: {
        message_id_user_id: {
          message_id: messageId,
          user_id: parseInt(userId)
        }
      }
    });

    return createSuccessResponse({
      message: 'Message unstarred successfully'
    });

  } catch (error) {
    console.error('Unstar message error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}
