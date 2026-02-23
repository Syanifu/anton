import React from 'react';

interface AvatarProps {
    src?: string | null;
    initials?: string;
    size?: number;
    alt?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, initials, size = 40, alt = 'Avatar' }) => {
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: 'var(--accent-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
                border: '1px solid var(--card-border)',
            }}
        >
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            ) : (
                <span style={{
                    fontSize: size * 0.4,
                    fontWeight: 600,
                    color: 'var(--foreground)'
                }}>
                    {initials?.substring(0, 2).toUpperCase()}
                </span>
            )}
        </div>
    );
};
