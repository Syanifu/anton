'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

export default function SignUpPage() {
    const router = useRouter();
    const { user, loading: authLoading, isGuest, signInWithGoogle, signInWithApple, signInWithEmail, signInAsGuest } = useAuth();

    // State
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Redirect if already logged in or guest
    useEffect(() => {
        if ((user || isGuest) && !authLoading) {
            router.push('/');
        }
    }, [user, isGuest, authLoading, router]);

    // Handlers
    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await signInWithGoogle();
        } catch (err) {
            setError('Failed to sign in with Google. Please try again.');
            setLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await signInWithApple();
        } catch (err) {
            setError('Failed to sign in with Apple. Please try again.');
            setLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError('');
        setMessage('');

        const result = await signInWithEmail(email);

        if (result.error) {
            setError(result.error);
        } else {
            setMessage('Check your email for a login link!');
        }

        setLoading(false);
    };

    return (
        <div className="container" style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            minHeight: '100vh',
            padding: 0,
            background: '#0F121C'
        }}>

            {/* Logo/Icon Area */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '60px 24px 48px',
                animation: 'fadeIn 0.5s ease-out'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '24px',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    boxShadow: '0 20px 40px -10px rgba(255,255,255,0.2)'
                }}>
                    {/* Placeholder for Logo */}
                    <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #0F121C' }} />
                </div>

                <h1 className="text-h1 text-center" style={{ marginBottom: '12px', color: 'white' }}>
                    Join Anton
                </h1>

                <p className="text-body text-center" style={{ color: 'rgba(255,255,255,0.8)', maxWidth: '280px', fontWeight: 500 }}>
                    Build your freelance empire with an AI co-founder.
                </p>
            </div>

            {/* Buttons and Form */}
            <div style={{
                flex: 1,
                padding: '32px 24px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Social Auth Buttons */}
                <div className="flex-col gap-md" style={{ marginBottom: '32px' }}>
                    <Button
                        variant="outline"
                        size="lg"
                        fullWidth
                        onClick={handleAppleLogin}
                        disabled={loading}
                        icon={<span style={{ fontSize: '20px' }}></span>}
                        style={{
                            background: 'transparent',
                            borderColor: 'rgba(255,255,255,0.3)',
                            color: 'white',
                            justifyContent: 'center'
                        }}
                    >
                        Continue with Apple
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        fullWidth
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        icon={<span style={{ fontSize: '18px' }}>G</span>}
                        style={{
                            background: 'transparent',
                            borderColor: 'rgba(255,255,255,0.3)',
                            color: 'white',
                            justifyContent: 'center'
                        }}
                    >
                        Continue with Google
                    </Button>
                </div>

                {/* Divider */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '32px'
                }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
                    <span className="text-caption" style={{ color: 'rgba(255,255,255,0.6)' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailLogin} className="flex-col gap-lg">
                    <div className="flex-col gap-xs">
                        <label className="text-small" style={{ marginLeft: '4px', color: 'white' }}>Work Email</label>
                        <Input
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                borderColor: 'rgba(255,255,255,0.2)',
                                color: 'white'
                            }}
                        />
                    </div>

                    {error && (
                        <p style={{ color: '#ff6b6b', fontSize: '14px', margin: 0 }}>{error}</p>
                    )}

                    {message && (
                        <p style={{ color: '#4ade80', fontSize: '14px', margin: 0 }}>{message}</p>
                    )}

                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        type="submit"
                        disabled={loading || !email}
                        style={{
                            background: 'white',
                            color: 'black',
                            marginTop: '8px'
                        }}
                    >
                        {loading ? 'Creating account...' : 'Create account'}
                    </Button>
                </form>

                {/* Guest Mode */}
                <div style={{ marginTop: '24px' }}>
                    <button
                        onClick={() => { signInAsGuest(); router.push('/'); }}
                        style={{
                            width: '100%',
                            height: '56px',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'rgba(255,255,255,0.8)',
                            border: '1px dashed rgba(255,255,255,0.3)',
                            borderRadius: '12px',
                            fontSize: '17px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        Open as Guest
                    </button>
                    <p className="text-caption text-center" style={{ color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
                        Explore the app with sample data — no account needed
                    </p>
                </div>

                {/* Footer */}
                <div style={{ marginTop: 'auto', paddingTop: '40px' }} className="text-center">
                    <p className="text-small" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        Already have an account? <a href="#" onClick={() => router.push('/login')} style={{ color: 'white', fontWeight: 600 }}>Log In</a>
                    </p>

                    <p className="text-caption" style={{ marginTop: '24px', color: 'rgba(255,255,255,0.5)' }}>
                        By signing up, you agree to our <a href="#" style={{ textDecoration: 'underline', color: 'white' }}>Terms of Service</a> and <a href="#" style={{ textDecoration: 'underline', color: 'white' }}>Privacy Policy</a>. Anton uses advanced AI to process your business data securely.
                    </p>
                </div>
            </div>
        </div>
    );
}
