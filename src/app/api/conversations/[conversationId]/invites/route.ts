import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/middleware';
import { randomBytes } from 'crypto';

// GET - Get active invites for a conversation
export async function GET(
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

    const invites = await prisma.groupInvite.findMany({
      where: { 
        conversation_id: conversationId,
        expires_at: { gt: new Date() }
      },
      include: {
        conversation: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return createSuccessResponse({ invites });

  } catch (error) {
    console.error('Get invites error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// POST - Create new invite link
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

    const { expiresInDays = 7, specificUser } = await request.json();

    // Check if user is admin/owner of the conversation
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: parseInt(userId)
        }
      }
    });

    if (!membership || !membership.role || !['admin', 'owner'].includes(membership.role)) {
      return createErrorResponse('Only admins can create invite links', 403);
    }

    // Check if conversation is a group
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation?.is_group) {
      return createErrorResponse('Can only create invites for group conversations', 400);
    }

    // Generate unique invite code
    const inviteCode = randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create invite
    const invite = await prisma.groupInvite.create({
      data: {
        conversation_id: conversationId,
        created_by: parseInt(userId),
        invite_code: inviteCode,
        expires_at: expiresAt
      },
      include: {
        conversation: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return createSuccessResponse({
      message: 'Invite link created successfully',
      invite: {
        ...invite,
        inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/join/${inviteCode}`
      }
    }, 201);

  } catch (error) {
    console.error('Create invite error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// DELETE - Revoke invite
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

    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get('inviteId');

    if (!inviteId) {
      return createErrorResponse('Invite ID is required');
    }

    // Check if user is admin/owner of the conversation
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: parseInt(userId)
        }
      }
    });

    if (!membership || !membership.role || !['admin', 'owner'].includes(membership.role)) {
      return createErrorResponse('Only admins can revoke invite links', 403);
    }

    // Delete invite
    await prisma.groupInvite.delete({
      where: { id: parseInt(inviteId) }
    });

    return createSuccessResponse({
      message: 'Invite link revoked successfully'
    });

  } catch (error) {
    console.error('Revoke invite error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}
