import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
	// If user hits root path, rewrite to API health endpoint
	if (request.nextUrl.pathname === '/') {
		return NextResponse.rewrite(new URL('/api/health', request.url));
	}
	return NextResponse.next();
}

export const config = {
	matcher: ['/'],
};


