import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, style, ...props }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            {label && (
                <label style={{
                    fontSize: '14px',
                    color: 'var(--muted)',
                    fontWeight: 500
                }}>
                    {label}
                </label>
            )}
            <input
                style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--accent-secondary)', // Using secondary bg for inputs
                    border: error ? '1px solid var(--brand-red)' : '1px solid var(--card-border)',
                    color: 'var(--foreground)',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    ...style
                }}
                {...props}
            />
            {error && (
                <span style={{ fontSize: '12px', color: 'var(--brand-red)' }}>
                    {error}
                </span>
            )}
        </div>
    );
};
