import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

// GET - Get user's saved messages
export async function GET(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const savedMessages = await prisma.savedMessage.findMany({
      where: { user_id: parseInt(userId) },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit
    });

    const totalCount = await prisma.savedMessage.count({
      where: { user_id: parseInt(userId) }
    });

    return createSuccessResponse({
      savedMessages,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Get saved messages error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// POST - Save a new message
export async function POST(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { content, message_type = 'text', media_url } = await request.json();

    if (!content) {
      return createErrorResponse('Message content is required');
    }

    const savedMessage = await prisma.savedMessage.create({
      data: {
        user_id: parseInt(userId),
        content,
        message_type,
        media_url
      }
    });

    return createSuccessResponse({
      message: 'Message saved successfully',
      savedMessage
    }, 201);

  } catch (error) {
    console.error('Save message error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

