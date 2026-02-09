'use client';

import React, { useEffect, useState } from 'react';

interface ThemeProviderProps {
    children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Check localStorage and apply theme
        const savedTheme = localStorage.getItem('anton-theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
            // Default to light mode
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }, []);

    // Prevent flash of wrong theme
    if (!mounted) {
        return (
            <div style={{ visibility: 'hidden' }}>
                {children}
            </div>
        );
    }

    return <>{children}</>;
}
