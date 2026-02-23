import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Create response early
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // Skip middleware for public routes
    const { pathname } = request.nextUrl;
    const publicRoutes = ['/signup', '/login', '/auth/callback'];

    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return response;
    }

    // Skip for API routes and static files
    if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
        return response;
    }

    // Check if Supabase env vars are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        // If env vars missing, allow access (dev mode without auth)
        return response;
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value)
                );
                response = NextResponse.next({
                    request: {
                        headers: request.headers,
                    },
                });
                cookiesToSet.forEach(({ name, value, options }) =>
                    response.cookies.set(name, value, options)
                );
            },
        },
    });

    // Refresh session if exists
    const { data: { user } } = await supabase.auth.getUser();

    // Redirect to signup if not authenticated
    if (!user) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/signup';
        return NextResponse.redirect(redirectUrl);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all paths except:
         * - _next/static, _next/image
         * - favicon.ico
         * - public files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
};
