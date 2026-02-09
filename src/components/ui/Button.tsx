import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    ...props
}) => {
    const baseClass = `btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''}`;
    return (
        <button className={`${baseClass} ${className}`} {...props}>
            {children}
        </button>
    );
};
