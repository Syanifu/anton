'use client';

import { usePathname, useRouter } from 'next/navigation';

interface NavItem {
    label: string;
    path: string;
    icon: string;
}

const navItems: NavItem[] = [
    { label: 'Today', path: '/', icon: '🏠' },
    { label: 'Inbox', path: '/inbox', icon: '💬' },
    { label: 'Drafts', path: '/drafts', icon: '📝' },
    { label: 'Money', path: '/money', icon: '💰' },
    { label: 'Profile', path: '/profile', icon: '👤' },
];

export function BottomNav() {
    const router = useRouter();
    const pathname = usePathname();

    // Don't show on signup page
    if (pathname === '/signup') return null;

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                    <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="bottom-nav-icon">{item.icon}</span>
                        <span className="bottom-nav-label">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
