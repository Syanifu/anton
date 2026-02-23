'use client';

import { usePathname, useRouter } from 'next/navigation';

interface NavItem {
    label: string;
    path: string;
    icon: string;
}

const navItems: NavItem[] = [
    { label: 'Today', path: '/', icon: '📅' },
    { label: 'Inbox', path: '/inbox', icon: '📥' },
    { label: 'Clients', path: '/clients', icon: '👥' },
    { label: 'Leads', path: '/leads', icon: '📈' },
    { label: 'Projects', path: '/projects', icon: '📁' },
    { label: 'Money', path: '/money', icon: '💰' },
];

export function BottomNav() {
    const router = useRouter();
    const pathname = usePathname();

    // Don't show on signup or login pages
    if (pathname === '/signup' || pathname === '/login') return null;

    return (
        <nav style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '9999px',
            padding: '12px 24px',
            display: 'flex',
            gap: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            zIndex: 100
        }}>
            {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                    <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px',
                            opacity: isActive ? 1 : 0.5,
                            color: isActive ? '#4B6BFB' : 'inherit',
                            transition: 'all 0.2s ease',
                            padding: 0
                        }}
                        aria-label={item.label}
                    >
                        {item.icon}
                    </button>
                );
            })}
        </nav>
    );
}
