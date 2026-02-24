'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function GuestBanner() {
    const router = useRouter();
    const { isGuest } = useAuth();

    if (!isGuest) return null;

    return (
        <div style={{
            margin: '12px 20px 0',
            padding: '10px 16px',
            background: 'rgba(75, 107, 251, 0.1)',
            border: '1px solid rgba(75, 107, 251, 0.3)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
        }}>
            <span className="text-small" style={{ color: 'var(--brand-blue)' }}>
                Viewing sample data
            </span>
            <button
                onClick={() => router.push('/signup')}
                style={{
                    background: 'var(--brand-blue)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                }}
            >
                Sign Up
            </button>
        </div>
    );
}
