import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return createErrorResponse('No file uploaded', 400);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return createErrorResponse('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed', 400);
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return createErrorResponse('File too large. Maximum size is 5MB', 400);
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `avatar_${userId}_${timestamp}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate public URL
    const avatarUrl = `/uploads/avatars/${fileName}`;

    // Update user's avatar in database
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { avatar_url: avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
        bio: true,
        status_message: true,
        last_seen: true,
        created_at: true
      }
    });

    return createSuccessResponse({
      message: 'Avatar uploaded successfully',
      avatarUrl,
      user: updatedUser
    }, 201);

  } catch (error) {
    console.error('Avatar upload error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// DELETE - Remove avatar
export async function DELETE(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { avatar_url: true }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    // Remove avatar from database
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { avatar_url: null },
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
        bio: true,
        status_message: true,
        last_seen: true,
        created_at: true
      }
    });

    // TODO: Optionally delete the actual file from server
    // const filePath = join(process.cwd(), 'public', user.avatar_url);
    // if (existsSync(filePath)) {
    //   await unlink(filePath);
    // }

    return createSuccessResponse({
      message: 'Avatar removed successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Avatar removal error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

