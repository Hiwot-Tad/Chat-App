import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

// GET - Get conversation members
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

    const members = await prisma.conversationMember.findMany({
      where: { conversation_id: conversationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
            last_seen: true
          }
        }
      },
      orderBy: { joined_at: 'asc' }
    });

    return createSuccessResponse({ members });

  } catch (error) {
    console.error('Get members error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// POST - Add member to group
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

    const { memberId, role = 'member' } = await request.json();

    if (!memberId) {
      return createErrorResponse('Member ID is required');
    }

    // Check if user is admin/owner of the conversation
    const userMembership = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: parseInt(userId)
        }
      }
    });

    if (!userMembership || !userMembership.role || !['admin', 'owner'].includes(userMembership.role)) {
      return createErrorResponse('Only admins can add members', 403);
    }

    // Check if conversation is a group
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation?.is_group) {
      return createErrorResponse('Can only add members to group conversations', 400);
    }

    // Check if user to be added exists
    const userToAdd = await prisma.user.findUnique({
      where: { id: parseInt(memberId) }
    });

    if (!userToAdd) {
      return createErrorResponse('User not found', 404);
    }

    // Check if user is already a member
    const existingMember = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: parseInt(memberId)
        }
      }
    });

    if (existingMember) {
      return createErrorResponse('User is already a member of this conversation', 409);
    }

    // Add member
    const newMember = await prisma.conversationMember.create({
      data: {
        conversation_id: conversationId,
        user_id: parseInt(memberId),
        role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true
          }
        }
      }
    });

    return createSuccessResponse({
      message: 'Member added successfully',
      member: newMember
    }, 201);

  } catch (error) {
    console.error('Add member error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// PUT - Update member role
export async function PUT(
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

    const { memberId, role } = await request.json();

    if (!memberId || !role) {
      return createErrorResponse('Member ID and role are required');
    }

    if (!['member', 'admin'].includes(role)) {
      return createErrorResponse('Invalid role. Must be "member" or "admin"');
    }

    // Check if user is owner of the conversation
    const userMembership = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: parseInt(userId)
        }
      }
    });

    if (!userMembership || userMembership.role !== 'owner') {
      return createErrorResponse('Only owners can change member roles', 403);
    }

    // Update member role
    const updatedMember = await prisma.conversationMember.update({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: parseInt(memberId)
        }
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true
          }
        }
      }
    });

    return createSuccessResponse({
      message: 'Member role updated successfully',
      member: updatedMember
    });

  } catch (error) {
    console.error('Update member role error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// DELETE - Remove member from group
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
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return createErrorResponse('Member ID is required');
    }

    // Check if user is admin/owner of the conversation
    const userMembership = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: parseInt(userId)
        }
      }
    });

    if (!userMembership || !userMembership.role || !['admin', 'owner'].includes(userMembership.role)) {
      return createErrorResponse('Only admins can remove members', 403);
    }

    // Prevent removing the owner
    const memberToRemove = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: parseInt(memberId)
        }
      }
    });

    if (memberToRemove?.role === 'owner') {
      return createErrorResponse('Cannot remove the owner from the conversation', 400);
    }

    // Remove member
    await prisma.conversationMember.delete({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: parseInt(memberId)
        }
      }
    });

    return createSuccessResponse({
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Remove member error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}
