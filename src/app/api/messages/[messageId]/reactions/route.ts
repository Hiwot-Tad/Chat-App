import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

// GET - Get reactions for a message
export async function GET(
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

    const reactions = await prisma.messageReaction.findMany({
      where: { message_id: messageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar_url: true
          }
        }
      }
    });

    return createSuccessResponse({ reactions });

  } catch (error) {
    console.error('Get reactions error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// POST - Add reaction to message
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

    const { emoji } = await request.json();

    if (!emoji) {
      return createErrorResponse('Emoji is required');
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

    // Add or update reaction
    const reaction = await prisma.messageReaction.upsert({
      where: {
        message_id_user_id_emoji: {
          message_id: messageId,
          user_id: parseInt(userId),
          emoji
        }
      },
      update: {},
      create: {
        message_id: messageId,
        user_id: parseInt(userId),
        emoji
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar_url: true
          }
        }
      }
    });

    return createSuccessResponse({
      message: 'Reaction added successfully',
      reaction
    }, 201);

  } catch (error) {
    console.error('Add reaction error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// DELETE - Remove reaction from message
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

    const { searchParams } = new URL(request.url);
    const emoji = searchParams.get('emoji');

    if (!emoji) {
      return createErrorResponse('Emoji parameter is required');
    }

    // Remove reaction
    await prisma.messageReaction.delete({
      where: {
        message_id_user_id_emoji: {
          message_id: messageId,
          user_id: parseInt(userId),
          emoji
        }
      }
    });

    return createSuccessResponse({
      message: 'Reaction removed successfully'
    });

  } catch (error) {
    console.error('Remove reaction error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}
