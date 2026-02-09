import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'red' | 'blue' | 'green' | 'gray';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'gray', className = '' }) => {
    return (
        <span className={`badge badge-${variant} ${className}`}>
            {children}
        </span>
    );
};
