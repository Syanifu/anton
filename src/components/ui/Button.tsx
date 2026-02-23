import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    icon,
    style,
    ...props
}) => {
    // Base styles
    const baseStyles: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: 'var(--radius-md)',
        fontWeight: 600,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        width: fullWidth ? '100%' : 'auto',
        opacity: props.disabled ? 0.6 : 1,
    };

    // Variant styles
    const variantStyles: Record<string, React.CSSProperties> = {
        primary: {
            background: 'var(--accent-primary)',
            color: 'var(--background)',
        },
        secondary: {
            background: 'var(--accent-secondary)',
            color: 'var(--foreground)',
        },
        outline: {
            background: 'transparent',
            border: '1px solid var(--card-border)',
            color: 'var(--foreground)',
        },
        ghost: {
            background: 'transparent',
            color: 'var(--muted)',
        },
        danger: {
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--brand-red)',
        }
    };

    // Size styles
    const sizeStyles: Record<string, React.CSSProperties> = {
        sm: {
            height: '32px',
            padding: '0 12px',
            fontSize: '13px',
        },
        md: {
            height: '48px',
            padding: '0 20px',
            fontSize: '15px',
        },
        lg: {
            height: '56px',
            padding: '0 24px',
            fontSize: '17px',
        },
    };

    return (
        <button
            style={{ ...baseStyles, ...variantStyles[variant], ...sizeStyles[size], ...style }}
            className={className}
            {...props}
        >
            {icon && <span style={{ display: 'flex' }}>{icon}</span>}
            {children}
        </button>
    );
};
