import { NextResponse } from 'next/server';

export async function GET() {
	return NextResponse.json({
		status: 'ok',
		service: 'chat-app-backend',
		message: 'API is running. See /api for endpoints.'
	});
}


