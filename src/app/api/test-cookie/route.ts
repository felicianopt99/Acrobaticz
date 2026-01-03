import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const allCookies = request.cookies.getAll();
  const authToken = request.cookies.get('auth-token');

  return NextResponse.json({
    allCookies: allCookies.map(c => c.name),
    authToken: authToken ? { name: authToken.name, value: authToken.value.substring(0, 20) + '...' } : null,
    headers: {
      'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
      'host': request.headers.get('host'),
    }
  });
}
