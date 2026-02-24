'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isGuest: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithApple: () => Promise<void>;
    signInWithEmail: (email: string) => Promise<{ error?: string }>;
    signInAsGuest: () => void;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    // Initialize Supabase client on mount (client-side only)
    useEffect(() => {
        try {
            const client = createSupabaseBrowserClient();
            setSupabase(client);
        } catch {
            console.error('Failed to initialize Supabase client');
            setLoading(false);
        }

        // Check if guest mode was previously set
        if (typeof window !== 'undefined' && localStorage.getItem('guest_mode') === 'true') {
            setIsGuest(true);
            setLoading(false);
        }
    }, []);

    // Set up auth listener when supabase is ready
    useEffect(() => {
        if (!supabase) return;

        // Get initial session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);

            // Store token for API calls
            if (session?.access_token) {
                localStorage.setItem('auth_token', session.access_token);
            }

            setLoading(false);
        };

        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);

                // Update stored token
                if (session?.access_token) {
                    localStorage.setItem('auth_token', session.access_token);
                } else {
                    localStorage.removeItem('auth_token');
                }

                setLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    const signInWithGoogle = useCallback(async () => {
        if (!supabase) throw new Error('Supabase not initialized');

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });

        if (error) {
            console.error('Google sign in error:', error);
            throw error;
        }
    }, [supabase]);

    const signInWithApple = useCallback(async () => {
        if (!supabase) throw new Error('Supabase not initialized');

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error('Apple sign in error:', error);
            throw error;
        }
    }, [supabase]);

    const signInWithEmail = useCallback(async (email: string) => {
        if (!supabase) return { error: 'Supabase not initialized' };

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error('Email sign in error:', error);
            return { error: error.message };
        }

        return {};
    }, [supabase]);

    const signInAsGuest = useCallback(() => {
        setIsGuest(true);
        localStorage.setItem('guest_mode', 'true');
        setLoading(false);
    }, []);

    const signOut = useCallback(async () => {
        // Clear guest mode
        if (isGuest) {
            setIsGuest(false);
            localStorage.removeItem('guest_mode');
            return;
        }

        if (!supabase) throw new Error('Supabase not initialized');

        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Sign out error:', error);
            throw error;
        }
        localStorage.removeItem('auth_token');
    }, [supabase, isGuest]);

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                loading,
                isGuest,
                signInWithGoogle,
                signInWithApple,
                signInWithEmail,
                signInAsGuest,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
