import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, style }) => {
    return (
        <div
            className={`card ${className} ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
            style={{ ...(onClick ? { cursor: 'pointer' } : {}), ...style }}
        >
            {children}
        </div>
    );
};
