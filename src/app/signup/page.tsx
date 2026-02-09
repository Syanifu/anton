'use client';

import React, { useState } from 'react';

type AuthView = 'main' | 'email';

export default function SignUpPage() {
    const [view, setView] = useState<AuthView>('main');
    const [loading, setLoading] = useState(false);
    const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Email form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [useMagicLink, setUseMagicLink] = useState(true);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const validateEmail = (value: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
            setEmailError('Email is required');
            return false;
        }
        if (!emailRegex.test(value)) {
            setEmailError('Please enter a valid email');
            return false;
        }
        setEmailError('');
        return true;
    };

    const validatePassword = (value: string): boolean => {
        if (useMagicLink) return true;
        if (!value) {
            setPasswordError('Password is required');
            return false;
        }
        if (value.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);

        if (!isEmailValid || !isPasswordValid) return;

        setLoading(true);
        try {
            // TODO: Integrate with Supabase Auth
            // if (useMagicLink) {
            //     const { error } = await supabase.auth.signInWithOtp({ email });
            //     if (error) throw error;
            // } else {
            //     const { data, error } = await supabase.auth.signUp({ email, password });
            //     if (error) throw error;
            // }

            if (useMagicLink) {
                setSuccessMessage(`Magic link sent to ${email}. Check your inbox!`);
            } else {
                setShowOnboarding(true);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Sign up failed';
            setEmailError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoadingProvider('google');
        try {
            // TODO: Integrate with Supabase OAuth
            // const { error } = await supabase.auth.signInWithOAuth({
            //     provider: 'google',
            //     options: { redirectTo: window.location.origin + '/auth/callback' },
            // });
            // if (error) throw error;

            setTimeout(() => {
                setLoadingProvider(null);
                setShowOnboarding(true);
            }, 1500);
        } catch (error) {
            console.error('Google sign in failed:', error);
            setLoadingProvider(null);
        }
    };

    const handleAppleSignIn = async () => {
        setLoadingProvider('apple');
        try {
            // TODO: Integrate with Supabase OAuth
            // const { error } = await supabase.auth.signInWithOAuth({
            //     provider: 'apple',
            //     options: { redirectTo: window.location.origin + '/auth/callback' },
            // });
            // if (error) throw error;

            setTimeout(() => {
                setLoadingProvider(null);
                setShowOnboarding(true);
            }, 1500);
        } catch (error) {
            console.error('Apple sign in failed:', error);
            setLoadingProvider(null);
        }
    };

    const handleConnect = (type: 'whatsapp' | 'gmail') => {
        setShowOnboarding(false);
        // TODO: Navigate to connection flow
        window.location.href = '/';
    };

    const handleSkip = () => {
        setShowOnboarding(false);
        window.location.href = '/';
    };

    // Onboarding Modal
    if (showOnboarding) {
        return (
            <div className="modal-overlay">
                <div className="modal">
                    <div className="modal-emoji">🚀</div>
                    <h2 className="modal-title">Connect Your First Account</h2>
                    <p className="modal-subtitle">
                        Start receiving and managing client messages in one place.
                    </p>

                    <div className="connect-options">
                        <button className="connect-card" onClick={() => handleConnect('whatsapp')}>
                            <span className="connect-icon">💬</span>
                            <div className="connect-content">
                                <span className="connect-title">WhatsApp Business</span>
                                <span className="connect-desc">Receive and reply to client messages</span>
                            </div>
                            <span className="connect-arrow">→</span>
                        </button>

                        <button className="connect-card" onClick={() => handleConnect('gmail')}>
                            <span className="connect-icon">📧</span>
                            <div className="connect-content">
                                <span className="connect-title">Gmail</span>
                                <span className="connect-desc">Sync email conversations with clients</span>
                            </div>
                            <span className="connect-arrow">→</span>
                        </button>
                    </div>

                    <button className="skip-btn" onClick={handleSkip}>
                        Skip for now
                    </button>
                    <p className="modal-footnote">
                        You can always connect more accounts later in Settings.
                    </p>
                </div>

                <style jsx>{`
                    .modal-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: flex-end;
                        justify-content: center;
                        padding: 20px;
                    }
                    .modal {
                        background: white;
                        border-radius: 24px 24px 0 0;
                        padding: 32px 24px 40px;
                        width: 100%;
                        max-width: 480px;
                        text-align: center;
                    }
                    .modal-emoji {
                        font-size: 48px;
                        margin-bottom: 16px;
                    }
                    .modal-title {
                        font-size: 24px;
                        font-weight: 700;
                        color: #111827;
                        margin-bottom: 8px;
                    }
                    .modal-subtitle {
                        font-size: 15px;
                        color: #6B7280;
                        margin-bottom: 32px;
                        line-height: 1.5;
                    }
                    .connect-options {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        margin-bottom: 24px;
                    }
                    .connect-card {
                        display: flex;
                        align-items: center;
                        gap: 14px;
                        background: #F9FAFB;
                        border: 1px solid #E5E7EB;
                        border-radius: 16px;
                        padding: 16px;
                        cursor: pointer;
                        text-align: left;
                        transition: background 0.2s;
                    }
                    .connect-card:hover {
                        background: #F3F4F6;
                    }
                    .connect-icon {
                        font-size: 28px;
                    }
                    .connect-content {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                    }
                    .connect-title {
                        font-size: 16px;
                        font-weight: 600;
                        color: #111827;
                    }
                    .connect-desc {
                        font-size: 13px;
                        color: #6B7280;
                    }
                    .connect-arrow {
                        font-size: 18px;
                        color: #9CA3AF;
                    }
                    .skip-btn {
                        background: none;
                        border: none;
                        color: #6B7280;
                        font-size: 15px;
                        font-weight: 500;
                        cursor: pointer;
                        padding: 12px;
                    }
                    .modal-footnote {
                        font-size: 12px;
                        color: #9CA3AF;
                        margin-top: 8px;
                    }
                `}</style>
            </div>
        );
    }

    // Email Form View
    if (view === 'email') {
        return (
            <div className="container">
                <button className="back-btn" onClick={() => setView('main')}>
                    ← Back
                </button>

                <h1 className="form-title">Sign up with Email</h1>

                {successMessage ? (
                    <div className="success-message">
                        <span className="success-icon">✓</span>
                        <p>{successMessage}</p>
                    </div>
                ) : (
                    <form onSubmit={handleEmailSignUp}>
                        <div className="input-group">
                            <label>Email</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (emailError) validateEmail(e.target.value);
                                }}
                                onBlur={() => validateEmail(email)}
                                disabled={loading}
                                className={emailError ? 'error' : ''}
                            />
                            {emailError && <span className="error-text">{emailError}</span>}
                        </div>

                        <div className="toggle-group">
                            <span>Use magic link (passwordless)</span>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={useMagicLink}
                                    onChange={(e) => setUseMagicLink(e.target.checked)}
                                    disabled={loading}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        {!useMagicLink && (
                            <div className="input-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    placeholder="Min. 8 characters"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (passwordError) validatePassword(e.target.value);
                                    }}
                                    onBlur={() => validatePassword(password)}
                                    disabled={loading}
                                    className={passwordError ? 'error' : ''}
                                />
                                {passwordError && <span className="error-text">{passwordError}</span>}
                            </div>
                        )}

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? (
                                <span className="spinner"></span>
                            ) : useMagicLink ? (
                                'Send Magic Link'
                            ) : (
                                'Create Account'
                            )}
                        </button>

                        {useMagicLink && (
                            <p className="hint">
                                We&apos;ll send you a secure link to sign in instantly.
                            </p>
                        )}
                    </form>
                )}

                <style jsx>{`
                    .container {
                        min-height: 100vh;
                        padding: 24px;
                        max-width: 400px;
                        margin: 0 auto;
                    }
                    .back-btn {
                        background: none;
                        border: none;
                        color: #6366F1;
                        font-size: 16px;
                        font-weight: 500;
                        cursor: pointer;
                        padding: 0;
                        margin-bottom: 24px;
                    }
                    .form-title {
                        font-size: 24px;
                        font-weight: 700;
                        color: #111827;
                        margin-bottom: 32px;
                    }
                    .input-group {
                        margin-bottom: 20px;
                    }
                    .input-group label {
                        display: block;
                        font-size: 14px;
                        font-weight: 500;
                        color: #374151;
                        margin-bottom: 8px;
                    }
                    .input-group input {
                        width: 100%;
                        background: #F9FAFB;
                        border: 1px solid #E5E7EB;
                        border-radius: 12px;
                        padding: 14px 16px;
                        font-size: 16px;
                        color: #111827;
                        outline: none;
                        transition: border-color 0.2s;
                    }
                    .input-group input:focus {
                        border-color: #6366F1;
                    }
                    .input-group input.error {
                        border-color: #EF4444;
                    }
                    .error-text {
                        display: block;
                        font-size: 12px;
                        color: #EF4444;
                        margin-top: 4px;
                    }
                    .toggle-group {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 20px;
                        padding: 8px 0;
                    }
                    .toggle-group span {
                        font-size: 14px;
                        color: #374151;
                    }
                    .toggle {
                        position: relative;
                        width: 48px;
                        height: 28px;
                    }
                    .toggle input {
                        opacity: 0;
                        width: 0;
                        height: 0;
                    }
                    .toggle-slider {
                        position: absolute;
                        cursor: pointer;
                        inset: 0;
                        background: #D1D5DB;
                        border-radius: 28px;
                        transition: 0.3s;
                    }
                    .toggle-slider:before {
                        content: '';
                        position: absolute;
                        height: 22px;
                        width: 22px;
                        left: 3px;
                        bottom: 3px;
                        background: white;
                        border-radius: 50%;
                        transition: 0.3s;
                    }
                    .toggle input:checked + .toggle-slider {
                        background: #6366F1;
                    }
                    .toggle input:checked + .toggle-slider:before {
                        transform: translateX(20px);
                    }
                    .submit-btn {
                        width: 100%;
                        background: #6366F1;
                        color: white;
                        border: none;
                        border-radius: 12px;
                        padding: 16px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        margin-top: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: opacity 0.2s;
                    }
                    .submit-btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                    .submit-btn:hover:not(:disabled) {
                        opacity: 0.9;
                    }
                    .hint {
                        font-size: 13px;
                        color: #6B7280;
                        text-align: center;
                        margin-top: 16px;
                    }
                    .success-message {
                        background: #ECFDF5;
                        border: 1px solid #10B981;
                        border-radius: 12px;
                        padding: 20px;
                        text-align: center;
                    }
                    .success-icon {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: 40px;
                        height: 40px;
                        background: #10B981;
                        color: white;
                        border-radius: 50%;
                        font-size: 20px;
                        margin-bottom: 12px;
                    }
                    .success-message p {
                        color: #065F46;
                        font-size: 15px;
                    }
                    .spinner {
                        width: 20px;
                        height: 20px;
                        border: 2px solid rgba(255,255,255,0.3);
                        border-top-color: white;
                        border-radius: 50%;
                        animation: spin 0.8s linear infinite;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    // Main Auth View
    return (
        <div className="container">
            <div className="header">
                <h1 className="logo">Anton</h1>
                <h2 className="title">Create your Anton account</h2>
                <p className="subtitle">Your AI-powered assistant for freelance business</p>
            </div>

            <div className="buttons">
                <button
                    className="auth-btn email"
                    onClick={() => setView('email')}
                    disabled={!!loadingProvider}
                >
                    <span className="btn-icon">✉️</span>
                    Continue with Email
                </button>

                <button
                    className="auth-btn google"
                    onClick={handleGoogleSignIn}
                    disabled={!!loadingProvider}
                >
                    {loadingProvider === 'google' ? (
                        <span className="spinner dark"></span>
                    ) : (
                        <>
                            <span className="btn-icon">G</span>
                            Continue with Google
                        </>
                    )}
                </button>

                <button
                    className="auth-btn apple"
                    onClick={handleAppleSignIn}
                    disabled={!!loadingProvider}
                >
                    {loadingProvider === 'apple' ? (
                        <span className="spinner"></span>
                    ) : (
                        <>
                            <span className="btn-icon"></span>
                            Continue with Apple
                        </>
                    )}
                </button>
            </div>

            <div className="footer">
                <p className="legal">
                    By continuing, you agree to our{' '}
                    <a href="/terms">Terms</a> &{' '}
                    <a href="/privacy">Privacy</a>.
                </p>
            </div>

            <style jsx>{`
                .container {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    padding: 60px 24px 40px;
                    max-width: 400px;
                    margin: 0 auto;
                }
                .header {
                    text-align: center;
                    margin-bottom: 48px;
                }
                .logo {
                    font-size: 32px;
                    font-weight: 800;
                    color: #6366F1;
                    margin-bottom: 24px;
                }
                .title {
                    font-size: 28px;
                    font-weight: 700;
                    color: #111827;
                    margin-bottom: 8px;
                }
                .subtitle {
                    font-size: 16px;
                    color: #6B7280;
                }
                .buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .auth-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 14px 24px;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    transition: opacity 0.2s;
                }
                .auth-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .auth-btn:hover:not(:disabled) {
                    opacity: 0.9;
                }
                .auth-btn.email {
                    background: #6366F1;
                    color: white;
                }
                .auth-btn.google {
                    background: white;
                    color: #1F2937;
                    border: 1px solid #E5E7EB;
                }
                .auth-btn.apple {
                    background: #000;
                    color: white;
                }
                .btn-icon {
                    font-size: 20px;
                }
                .footer {
                    margin-top: auto;
                    padding-top: 32px;
                }
                .legal {
                    font-size: 13px;
                    color: #9CA3AF;
                    text-align: center;
                    line-height: 1.5;
                }
                .legal a {
                    color: #6366F1;
                    font-weight: 500;
                    text-decoration: none;
                }
                .legal a:hover {
                    text-decoration: underline;
                }
                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                .spinner.dark {
                    border-color: rgba(0,0,0,0.1);
                    border-top-color: #1F2937;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
