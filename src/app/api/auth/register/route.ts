import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validation
    if (!email || !password || !name) {
      return createErrorResponse('Email, password, and name are required');
    }

    if (password.length < 6) {
      return createErrorResponse('Password must be at least 6 characters long');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return createErrorResponse('User with this email already exists', 409);
    }

    // Hash password and create user
    const password_hash = await hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        name
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
      message: 'User registered successfully',
      user
    }, 201);

  } catch (error) {
    console.error('Registration error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

