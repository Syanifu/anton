import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    style?: React.CSSProperties;
    noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    onClick,
    style,
    noPadding = false
}) => {
    const baseStyle: React.CSSProperties = {
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius-lg)',
        padding: noPadding ? '0' : 'var(--spacing-md)',
        overflow: 'hidden',
        ...style
    };

    return (
        <div
            className={className}
            onClick={onClick}
            style={{
                ...baseStyle,
                cursor: onClick ? 'pointer' : 'default',
            }}
        >
            {children}
        </div>
    );
};
