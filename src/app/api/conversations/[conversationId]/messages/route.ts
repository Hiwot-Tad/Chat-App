import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

// GET messages for a conversation
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

    // Get messages with pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const messages = await prisma.message.findMany({
      where: {
        conversation_id: conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar_url: true
          }
        },
        messageStatus: {
          where: {
            user_id: parseInt(userId)
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip: offset,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.message.count({
      where: {
        conversation_id: conversationId
      }
    });

    return createSuccessResponse({
      messages: messages.reverse(), // Reverse to get chronological order
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// POST send a new message
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

    const { content, media_url, message_type, reply_to } = await request.json();

    // Validation
    if (!content && !media_url) {
      return createErrorResponse('Message content or media is required');
    }

    if (message_type && !['text', 'image', 'video', 'file', 'gif', 'sticker'].includes(message_type)) {
      return createErrorResponse('Invalid message type');
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

    // Create message
    const message = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_id: parseInt(userId),
        content: content || null,
        media_url: media_url || null,
        message_type: message_type || 'text',
        reply_to: reply_to ? parseInt(reply_to) : null
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar_url: true
          }
        }
      }
    });

    // Create message status for all conversation members
    const conversationMembers = await prisma.conversationMember.findMany({
      where: {
        conversation_id: conversationId
      }
    });

    const messageStatuses = conversationMembers.map(member => ({
      message_id: message.id,
      user_id: member.user_id,
      status: member.user_id === parseInt(userId) ? 'sent' : 'sent'
    }));

    await prisma.messageStatus.createMany({
      data: messageStatuses
    });

    return createSuccessResponse({
      message: 'Message sent successfully',
      message
    }, 201);

  } catch (error) {
    console.error('Send message error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}
