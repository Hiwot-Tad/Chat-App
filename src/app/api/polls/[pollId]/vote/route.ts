import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

// POST - Vote on a poll
export async function POST(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;
    const pollId = params.pollId;

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { option } = await request.json();

    if (option === undefined || option === null) {
      return createErrorResponse('Poll option is required');
    }

    // Get poll and check if user has access
    const poll = await prisma.poll.findFirst({
      where: {
        id: pollId,
        is_active: true,
        conversation: {
          members: {
            some: {
              user_id: parseInt(userId)
            }
          }
        }
      },
      include: {
        votes: true
      }
    });

    if (!poll) {
      return createErrorResponse('Poll not found or access denied', 404);
    }

    // Check if poll has expired
    if (poll.expires_at && poll.expires_at < new Date()) {
      return createErrorResponse('This poll has expired', 400);
    }

    // Check if option is valid
    if (option < 0 || option >= poll.options.length) {
      return createErrorResponse('Invalid poll option', 400);
    }

    // Check if user has already voted
    const existingVote = poll.votes.find((vote: any) => vote.user_id === parseInt(userId));
    if (existingVote) {
      return createErrorResponse('You have already voted on this poll', 400);
    }

    // Create vote
    const vote = await prisma.pollVote.create({
      data: {
        poll_id: pollId,
        user_id: parseInt(userId),
        option
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return createSuccessResponse({
      message: 'Vote recorded successfully',
      vote
    }, 201);

  } catch (error) {
    console.error('Vote on poll error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// PUT - Change vote
export async function PUT(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;
    const pollId = params.pollId;

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { option } = await request.json();

    if (option === undefined || option === null) {
      return createErrorResponse('Poll option is required');
    }

    // Get poll and check if user has access
    const poll = await prisma.poll.findFirst({
      where: {
        id: pollId,
        is_active: true,
        conversation: {
          members: {
            some: {
              user_id: parseInt(userId)
            }
          }
        }
      }
    });

    if (!poll) {
      return createErrorResponse('Poll not found or access denied', 404);
    }

    // Check if poll has expired
    if (poll.expires_at && poll.expires_at < new Date()) {
      return createErrorResponse('This poll has expired', 400);
    }

    // Check if option is valid
    if (option < 0 || option >= poll.options.length) {
      return createErrorResponse('Invalid poll option', 400);
    }

    // Update existing vote
    const updatedVote = await prisma.pollVote.update({
      where: {
        poll_id_user_id: {
          poll_id: pollId,
          user_id: parseInt(userId)
        }
      },
      data: { option },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return createSuccessResponse({
      message: 'Vote updated successfully',
      vote: updatedVote
    });

  } catch (error) {
    console.error('Update vote error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// DELETE - Remove vote
export async function DELETE(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;
    const pollId = params.pollId;

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Remove vote
    await prisma.pollVote.delete({
      where: {
        poll_id_user_id: {
          poll_id: pollId,
          user_id: parseInt(userId)
        }
      }
    });

    return createSuccessResponse({
      message: 'Vote removed successfully'
    });

  } catch (error) {
    console.error('Remove vote error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}
