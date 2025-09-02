import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

// POST - Join group using invite code
export async function POST(
  request: NextRequest,
  { params }: { params: { inviteCode: string } }
) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;
    const inviteCode = params.inviteCode;

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Find the invite
    const invite = await prisma.groupInvite.findUnique({
      where: { invite_code: inviteCode },
      include: {
        conversation: {
          include: {
            members: true
          }
        }
      }
    });

    if (!invite) {
      return createErrorResponse('Invalid invite code', 404);
    }

    if (invite.is_used) {
      return createErrorResponse('This invite has already been used', 400);
    }

    if (invite.expires_at < new Date()) {
      return createErrorResponse('This invite has expired', 400);
    }

    // Check if user is already a member
    const existingMember = invite.conversation.members.find(
      member => member.user_id === parseInt(userId)
    );

    if (existingMember) {
      return createErrorResponse('You are already a member of this group', 400);
    }

    // Check if invite is for a specific user
    if (invite.invited_user && invite.invited_user !== parseInt(userId)) {
      return createErrorResponse('This invite is not for you', 403);
    }

    // Add user to the conversation
    const newMember = await prisma.conversationMember.create({
      data: {
        conversation_id: invite.conversation_id,
        user_id: parseInt(userId),
        role: 'member'
      },
      include: {
        conversation: {
          select: {
            id: true,
            title: true,
            is_group: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar_url: true
          }
        }
      }
    });

    // Mark invite as used
    await prisma.groupInvite.update({
      where: { id: invite.id },
      data: { 
        is_used: true,
        invited_user: parseInt(userId)
      }
    });

    return createSuccessResponse({
      message: 'Successfully joined the group',
      member: newMember
    }, 201);

  } catch (error) {
    console.error('Join group error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}
