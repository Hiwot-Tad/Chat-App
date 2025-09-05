import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all'; // all, users, messages
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const senderId = searchParams.get('senderId');
    const conversationId = searchParams.get('conversationId');
    const messageType = searchParams.get('messageType');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!query || query.trim().length < 2) {
      return createErrorResponse('Search query must be at least 2 characters long');
    }

    const offset = (page - 1) * limit;
    const searchTerm = `%${query.trim()}%`;

    let results: any = {};

    // Search users
    if (type === 'all' || type === 'users') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query.trim(), mode: 'insensitive' } },
            { email: { contains: query.trim(), mode: 'insensitive' } }
          ],
          NOT: {
            id: parseInt(userId) // Exclude current user
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar_url: true,
          bio: true,
          last_seen: true
        },
        skip: offset,
        take: limit
      });

      results.users = users;
    }

    // Search messages
    if (type === 'all' || type === 'messages') {
      // Build message search filters
      const messageFilters: any = {
        OR: [
          { content: { contains: query.trim(), mode: 'insensitive' } }
        ],
        conversation: {
          members: {
            some: {
              user_id: parseInt(userId)
            }
          }
        }
      };

      // Add optional filters
      if (senderId) {
        messageFilters.sender_id = parseInt(senderId);
      }

      if (conversationId) {
        messageFilters.conversation_id = parseInt(conversationId);
      }

      if (messageType) {
        messageFilters.message_type = messageType;
      }

      if (dateFrom || dateTo) {
        messageFilters.created_at = {};
        if (dateFrom) {
          messageFilters.created_at.gte = new Date(dateFrom);
        }
        if (dateTo) {
          messageFilters.created_at.lte = new Date(dateTo);
        }
      }

      const messages = await prisma.message.findMany({
        where: messageFilters,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar_url: true
            }
          },
          conversation: {
            select: {
              id: true,
              title: true,
              is_group: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        skip: offset,
        take: limit
      });

      results.messages = messages;
    }

    // Get total counts for pagination
    if (type === 'all' || type === 'users') {
      const userCount = await prisma.user.count({
        where: {
          OR: [
            { name: { contains: query.trim(), mode: 'insensitive' } },
            { email: { contains: query.trim(), mode: 'insensitive' } }
          ],
          NOT: {
            id: parseInt(userId)
          }
        }
      });
      results.userCount = userCount;
    }

    if (type === 'all' || type === 'messages') {
      // Build message count filters (same as search filters)
      const messageCountFilters: any = {
        OR: [
          { content: { contains: query.trim(), mode: 'insensitive' } }
        ],
        conversation: {
          members: {
            some: {
              user_id: parseInt(userId)
            }
          }
        }
      };

      // Add optional filters
      if (senderId) {
        messageCountFilters.sender_id = parseInt(senderId);
      }

      if (conversationId) {
        messageCountFilters.conversation_id = parseInt(conversationId);
      }

      if (messageType) {
        messageCountFilters.message_type = messageType;
      }

      if (dateFrom || dateTo) {
        messageCountFilters.created_at = {};
        if (dateFrom) {
          messageCountFilters.created_at.gte = new Date(dateFrom);
        }
        if (dateTo) {
          messageCountFilters.created_at.lte = new Date(dateTo);
        }
      }

      const messageCount = await prisma.message.count({
        where: messageCountFilters
      });
      results.messageCount = messageCount;
    }

    return createSuccessResponse({
      query: query.trim(),
      type,
      results,
      pagination: {
        page,
        limit,
        total: (results.userCount || 0) + (results.messageCount || 0)
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

