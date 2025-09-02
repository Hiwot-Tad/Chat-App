import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

// GET user profile
export async function GET(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        email: true,
        name: true,
        avatar_url: true,
        bio: true,
        status_message: true,
        last_seen: true,
        created_at: true
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    return createSuccessResponse({ user });

  } catch (error) {
    console.error('Get profile error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// PUT update user profile
export async function PUT(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { name, avatar_url, bio, status_message } = await request.json();

    // Validation
    if (name && name.length > 100) {
      return createErrorResponse('Name must be less than 100 characters');
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        ...(name && { name }),
        ...(avatar_url !== undefined && { avatar_url }),
        ...(bio !== undefined && { bio }),
        ...(status_message !== undefined && { status_message })
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar_url: true,
        bio: true,
        status_message: true,
        last_seen: true,
        created_at: true
      }
    });

    return createSuccessResponse({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}
