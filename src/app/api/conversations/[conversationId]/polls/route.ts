import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

// GET - Get polls for a conversation
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

    const polls = await prisma.poll.findMany({
      where: { 
        conversation_id: conversationId,
        is_active: true
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            avatar_url: true
          }
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Add vote counts and user's vote for each poll
    const pollsWithResults = polls.map((poll: any) => {
      const voteCounts = poll.options.map((_: any, index: number) => 
        poll.votes.filter((vote: any) => vote.option === index).length
      );
      
      const userVote = poll.votes.find((vote: any) => vote.user_id === parseInt(userId));
      
      return {
        ...poll,
        voteCounts,
        totalVotes: poll.votes.length,
        userVote: userVote ? userVote.option : null
      };
    });

    return createSuccessResponse({ polls: pollsWithResults });

  } catch (error) {
    console.error('Get polls error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// POST - Create a new poll
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

    const { question, options, expiresInDays } = await request.json();

    if (!question || !options || options.length < 2) {
      return createErrorResponse('Question and at least 2 options are required');
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

    // Check if conversation is a group
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation?.is_group) {
      return createErrorResponse('Polls can only be created in group conversations', 400);
    }

    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

    const poll = await prisma.poll.create({
      data: {
        conversation_id: conversationId,
        question,
        options,
        created_by: parseInt(userId),
        expires_at: expiresAt
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            avatar_url: true
          }
        }
      }
    });

    return createSuccessResponse({
      message: 'Poll created successfully',
      poll
    }, 201);

  } catch (error) {
    console.error('Create poll error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}
