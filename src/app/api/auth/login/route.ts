import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
// @ts-ignore
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Login attempt:', { username: body.username });
    const { username, password } = loginSchema.parse(body);

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    console.log('User found:', user ? { id: user.id, username: user.username, isActive: user.isActive } : 'Not found');

    if (!user || !user.isActive) {
      console.log('User not found or inactive');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Debug password comparison
    console.log('Received password:', password);
    console.log('Stored hash:', user.password);
    try {
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('Password valid:', isValidPassword);
      if (!isValidPassword) {
        console.log('Invalid password');
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    } catch (err) {
      console.error('Bcrypt compare error:', err);
      return NextResponse.json(
        { error: 'Password comparison failed' },
        { status: 500 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    
    const response = NextResponse.json({
      user: userWithoutPassword,
      token,
    });

    // Check if request is secure - trust X-Forwarded-Proto header from reverse proxy
    // In production, we're behind nginx which handles HTTPS termination
    const xForwardedProto = request.headers.get('x-forwarded-proto');
    const isSecure = process.env.NODE_ENV === 'production' && (xForwardedProto === 'https' || request.nextUrl.protocol === 'https:');

    // Set token in HTTP-only cookie
    // Use 'Lax' sameSite to allow cookie to be sent on top-level navigation (like window.location.href)
    // while still providing protection against CSRF attacks
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    // Also set a non-HttpOnly version for client-side detection
    response.cookies.set('auth-cookie', 'true', {
      httpOnly: false,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    console.log('Auth token set in cookie', {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      path: '/',
      xForwardedProto: xForwardedProto,
      nodeEnv: process.env.NODE_ENV,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}