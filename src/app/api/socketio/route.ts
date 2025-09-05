import { NextRequest, NextResponse } from 'next/server';
import { initSocket } from '@/lib/socket';

export async function GET(request: NextRequest) {
  // This endpoint is for Socket.IO connections
  // The actual WebSocket handling is done in the socket.ts file
  return NextResponse.json({ message: 'Socket.IO endpoint' });
}

export async function POST(request: NextRequest) {
  // This endpoint is for Socket.IO connections
  // The actual WebSocket handling is done in the socket.ts file
  return NextResponse.json({ message: 'Socket.IO endpoint' });
}

