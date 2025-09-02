import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

// GET user's contacts
export async function GET(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const contacts = await prisma.contact.findMany({
      where: {
        user_id: parseInt(userId)
      },
      include: {
        target: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
            bio: true,
            status_message: true,
            last_seen: true
          }
        }
      }
    });

    return createSuccessResponse({ contacts });

  } catch (error) {
    console.error('Get contacts error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// POST add a new contact
export async function POST(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { contactId } = await request.json();

    if (!contactId) {
      return createErrorResponse('Contact ID is required');
    }

    // Check if contact exists
    const contactUser = await prisma.user.findUnique({
      where: { id: parseInt(contactId) }
    });

    if (!contactUser) {
      return createErrorResponse('User not found', 404);
    }

    // Check if already a contact
    const existingContact = await prisma.contact.findUnique({
      where: {
        user_id_contact_id: {
          user_id: parseInt(userId),
          contact_id: parseInt(contactId)
        }
      }
    });

    if (existingContact) {
      return createErrorResponse('Contact already exists', 409);
    }

    // Create contact
    const contact = await prisma.contact.create({
      data: {
        user_id: parseInt(userId),
        contact_id: parseInt(contactId)
      },
      include: {
        target: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
            bio: true,
            status_message: true,
            last_seen: true
          }
        }
      }
    });

    return createSuccessResponse({
      message: 'Contact added successfully',
      contact
    }, 201);

  } catch (error) {
    console.error('Add contact error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// PUT update contact (block/unblock)
export async function PUT(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { contactId, isBlocked } = await request.json();

    if (!contactId || typeof isBlocked !== 'boolean') {
      return createErrorResponse('Contact ID and isBlocked status are required');
    }

    // Update contact
    const contact = await prisma.contact.update({
      where: {
        user_id_contact_id: {
          user_id: parseInt(userId),
          contact_id: parseInt(contactId)
        }
      },
      data: {
        is_blocked: isBlocked
      },
      include: {
        target: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
            bio: true,
            status_message: true,
            last_seen: true
          }
        }
      }
    });

    return createSuccessResponse({
      message: `Contact ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      contact
    });

  } catch (error) {
    console.error('Update contact error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

// DELETE remove a contact
export async function DELETE(request: NextRequest) {
  try {
    const authenticatedRequest = await authenticateRequest(request);
    const userId = authenticatedRequest.user?.userId;

    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return createErrorResponse('Contact ID is required');
    }

    // Delete contact
    await prisma.contact.delete({
      where: {
        user_id_contact_id: {
          user_id: parseInt(userId),
          contact_id: parseInt(contactId)
        }
      }
    });

    return createSuccessResponse({
      message: 'Contact removed successfully'
    });

  } catch (error) {
    console.error('Remove contact error:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Internal server error', 500);
  }
}
