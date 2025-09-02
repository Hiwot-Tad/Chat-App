import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
  };
}

export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedRequest> {
  const token = extractTokenFromHeader(request.headers.get('authorization'));
  
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const payload = verifyToken(token);
    (request as AuthenticatedRequest).user = payload;
    return request as AuthenticatedRequest;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

export function createSuccessResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}
