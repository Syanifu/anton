import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

export interface AuthResult {
    supabase: ReturnType<typeof createServerClient>;
    userId: string;
}

export interface AuthError {
    error: string;
    status: number;
}

/**
 * Creates an authenticated Supabase client from the request's Authorization header.
 * Returns the client and user ID if authenticated, or an error response if not.
 */
export async function getAuthenticatedClient(
    request: NextRequest
): Promise<AuthResult | AuthError> {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
        return { error: 'Missing or invalid Authorization header', status: 401 };
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with the user's JWT
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookies: {
            // We're using header-based auth, not cookies
            getAll: () => [],
            setAll: () => {},
        },
        global: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    });

    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return { error: 'Invalid or expired token', status: 401 };
    }

    return { supabase, userId: user.id };
}

/**
 * Helper to return JSON error response
 */
export function errorResponse(message: string, status: number): NextResponse {
    return NextResponse.json({ error: message }, { status });
}

/**
 * Type guard to check if result is an error
 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
    return 'error' in result;
}
