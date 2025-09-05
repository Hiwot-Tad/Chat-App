import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

// GET conversations for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            user_id: parseInt(userId)
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar_url: true,
                last_seen: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            created_at: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        updated_at: 'desc'
      }
    });

    return createSuccessResponse({ conversations });

  } catch (error) {
    console.error('Get conversations error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// POST create new conversation
export async function POST(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { type, title, participantIds } = await request.json();

    // Validation
    if (!type || !participantIds || !Array.isArray(participantIds)) {
      return createErrorResponse('Type and participant IDs are required');
    }

    if (type === 'direct' && participantIds.length !== 1) {
      return createErrorResponse('Direct conversations must have exactly one participant');
    }

    if (type === 'group' && participantIds.length < 2) {
      return createErrorResponse('Group conversations must have at least 2 participants');
    }

    // Check if direct conversation already exists
    if (type === 'direct') {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          is_group: false,
          members: {
            every: {
              user_id: {
                in: [parseInt(userId), ...participantIds.map((id: string) => parseInt(id))]
              }
            }
          }
        },
        include: {
          members: true
        }
      });

      if (existingConversation && existingConversation.members.length === 2) {
        return createSuccessResponse({
          message: 'Direct conversation already exists',
          conversation: existingConversation
        });
      }
    }

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        is_group: type === 'group',
        title: type === 'group' ? title : null,
        created_by: parseInt(userId),
        members: {
          create: [
            {
              user_id: parseInt(userId),
              role: 'admin'
            },
            ...participantIds.map((id: string) => ({
              user_id: parseInt(id),
              role: 'member'
            }))
          ]
        }
      },
      include: {
        members: {
          include: {
            user: {
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
      message: 'Conversation created successfully',
      conversation
    }, 201);

  } catch (error) {
    console.error('Create conversation error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

