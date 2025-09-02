import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/middleware';
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
    const file = formData.get('media') as File;
    const type = formData.get('type') as string || 'message'; // message, avatar, etc.

    if (!file) {
      return createErrorResponse('No file uploaded', 400);
    }

    // Validate file type based on type
    let allowedTypes: string[] = [];
    let maxSize = 0;
    let subfolder = '';

    switch (type) {
      case 'avatar':
        allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        maxSize = 5 * 1024 * 1024; // 5MB
        subfolder = 'avatars';
        break;
      case 'message':
        allowedTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
          'video/mp4', 'video/webm', 'video/ogg',
          'audio/mp3', 'audio/wav', 'audio/ogg',
          'application/pdf', 'text/plain',
          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        maxSize = 50 * 1024 * 1024; // 50MB
        subfolder = 'messages';
        break;
      default:
        return createErrorResponse('Invalid upload type', 400);
    }

    if (!allowedTypes.includes(file.type)) {
      return createErrorResponse(`Invalid file type for ${type} upload`, 400);
    }

    if (file.size > maxSize) {
      return createErrorResponse(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`, 400);
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', subfolder);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${type}_${userId}_${timestamp}_${randomString}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate public URL
    const mediaUrl = `/uploads/${subfolder}/${fileName}`;

    return createSuccessResponse({
      message: 'File uploaded successfully',
      mediaUrl,
      fileName,
      fileSize: file.size,
      fileType: file.type
    }, 201);

  } catch (error) {
    console.error('Media upload error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}
