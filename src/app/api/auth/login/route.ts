import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return createErrorResponse('Email and password are required');
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return createErrorResponse('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return createErrorResponse('Invalid credentials', 401);
    }

    // Update last seen
    await prisma.user.update({
      where: { id: user.id },
      data: {
        last_seen: new Date()
      }
    });

    // Generate token
    const token = generateToken({
      userId: user.id.toString(),
      email: user.email
    });

    // Return user data (excluding password) and token
    const { password_hash: _, ...userData } = user;

    return createSuccessResponse({
      message: 'Login successful',
      user: userData,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

