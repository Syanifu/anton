'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

type Platform = 'whatsapp' | 'telegram' | 'slack' | 'gmail' | 'upwork' | 'fiverr' | 'stripe';
type ConnectionStatus = 'connected' | 'disconnected' | 'needs_reauth';

interface ConnectedAccount {
    platform: Platform;
    identifier: string;
    lastSyncedAt: Date | null;
    status: ConnectionStatus;
    isSyncing?: boolean;
}

const platformIcons: Record<Platform, string> = {
    whatsapp: '💬',
    telegram: '✈️',
    slack: '💼',
    gmail: '📧',
    upwork: '🟢',
    fiverr: '🎯',
    stripe: '💳',
};

const platformNames: Record<Platform, string> = {
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    slack: 'Slack',
    gmail: 'Gmail',
    upwork: 'Upwork',
    fiverr: 'Fiverr',
    stripe: 'Stripe',
};

// Mock user data
const mockUser = {
    name: 'Anton User',
    email: 'anton@example.com',
    avatar: null as string | null,
};

// Mock connected accounts
const initialAccounts: ConnectedAccount[] = [
    { platform: 'whatsapp', identifier: '+1 234 567 8900', lastSyncedAt: new Date(Date.now() - 1000 * 60 * 5), status: 'connected' },
    { platform: 'gmail', identifier: 'anton@gmail.com', lastSyncedAt: new Date(Date.now() - 1000 * 60 * 30), status: 'connected' },
    { platform: 'slack', identifier: 'Anton Workspace', lastSyncedAt: null, status: 'needs_reauth' },
    { platform: 'stripe', identifier: 'acct_1234...', lastSyncedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), status: 'connected' },
];

const availablePlatforms: Platform[] = ['telegram', 'upwork', 'fiverr'];

function formatLastSynced(date: Date | null): string {
    if (!date) return 'Never synced';
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

export default function ProfilePage() {
    const [user, setUser] = useState(mockUser);
    const [accounts, setAccounts] = useState<ConnectedAccount[]>(initialAccounts);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(user.name);
    const [quietHours, setQuietHours] = useState(false);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [emailDigest, setEmailDigest] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleSaveProfile = () => {
        setUser({ ...user, name: editName });
        setIsEditing(false);
    };

    const handleSync = (platform: Platform) => {
        setAccounts(accounts.map(acc =>
            acc.platform === platform ? { ...acc, isSyncing: true } : acc
        ));

        // Simulate sync
        setTimeout(() => {
            setAccounts(accounts.map(acc =>
                acc.platform === platform
                    ? { ...acc, isSyncing: false, lastSyncedAt: new Date(), status: 'connected' as ConnectionStatus }
                    : acc
            ));
        }, 2000);
    };

    const handleDisconnect = (platform: Platform) => {
        setAccounts(accounts.filter(acc => acc.platform !== platform));
    };

    const handleConnect = (platform: Platform) => {
        // Simulate OAuth flow
        const newAccount: ConnectedAccount = {
            platform,
            identifier: `${platformNames[platform]} Account`,
            lastSyncedAt: new Date(),
            status: 'connected',
        };
        setAccounts([...accounts, newAccount]);
    };

    const handleExportData = () => {
        alert('Data export will be emailed to you within 24 hours.');
    };

    const handleDeleteAccount = () => {
        alert('Account deletion request submitted. You will receive a confirmation email.');
        setShowDeleteConfirm(false);
    };

    const connectedPlatforms = accounts.map(a => a.platform);
    const unconnectedPlatforms = availablePlatforms.filter(p => !connectedPlatforms.includes(p));

    return (
        <main className="container animate-slide-in">
            <header style={{ padding: 'var(--spacing-lg) var(--spacing-md)' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Profile</h1>
                <p className="text-muted">Manage your account settings</p>
            </header>

            {/* 1. PROFILE INFO */}
            <section className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
                <div className="flex-between" style={{ padding: '0 var(--spacing-md) var(--spacing-sm)' }}>
                    <h2 className="text-lg" style={{ color: 'var(--accent-primary)' }}>PROFILE INFO</h2>
                </div>
                <div style={{ padding: '0 var(--spacing-md)' }}>
                    <Card className="shadow-sm">
                        <div className="flex-between" style={{ marginBottom: 'var(--spacing-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                <div style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: '50%',
                                    background: 'var(--accent-primary-bg)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    color: 'var(--accent-primary)',
                                }}>
                                    {user.avatar ? (
                                        <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        user.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            style={{
                                                fontSize: '1.25rem',
                                                fontWeight: 600,
                                                border: '1px solid var(--card-border)',
                                                borderRadius: 'var(--radius)',
                                                padding: '0.5rem',
                                                background: 'var(--background)',
                                                color: 'var(--foreground)',
                                            }}
                                        />
                                    ) : (
                                        <p style={{ fontWeight: 600, fontSize: '1.25rem' }}>{user.name}</p>
                                    )}
                                    <p className="text-sm text-muted">{user.email}</p>
                                </div>
                            </div>
                            {isEditing ? (
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button variant="primary" size="sm" onClick={handleSaveProfile}>Save</Button>
                                </div>
                            ) : (
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
                            )}
                        </div>
                    </Card>
                </div>
            </section>

            {/* 2. CONNECTED ACCOUNTS */}
            <section className="animate-slide-in" style={{ animationDelay: '0.2s', marginTop: 'var(--spacing-lg)' }}>
                <div className="flex-between" style={{ padding: '0 var(--spacing-md) var(--spacing-sm)' }}>
                    <h2 className="text-lg" style={{ color: 'var(--accent-blue)' }}>CONNECTED ACCOUNTS</h2>
                    <Badge variant="blue">{accounts.length}</Badge>
                </div>
                <div className="flex-col" style={{ padding: '0 var(--spacing-md)', gap: 'var(--spacing-md)' }}>
                    {accounts.map((account) => (
                        <Card key={account.platform} className="shadow-sm">
                            <div className="flex-between" style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{platformIcons[account.platform]}</span>
                                    <div>
                                        <p style={{ fontWeight: 600 }}>{platformNames[account.platform]}</p>
                                        <p className="text-sm text-muted">{account.identifier}</p>
                                    </div>
                                </div>
                                <Badge variant={
                                    account.status === 'connected' ? 'green' :
                                    account.status === 'needs_reauth' ? 'red' : 'gray'
                                }>
                                    {account.status === 'connected' ? 'Connected' :
                                     account.status === 'needs_reauth' ? 'Needs Reauth' : 'Disconnected'}
                                </Badge>
                            </div>
                            <div className="flex-between" style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <p className="text-sm text-muted">
                                    {account.isSyncing ? (
                                        <span style={{ color: 'var(--accent-blue)' }}>Syncing...</span>
                                    ) : (
                                        <>Last synced: {formatLastSynced(account.lastSyncedAt)}</>
                                    )}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleSync(account.platform)}
                                    disabled={account.isSyncing}
                                >
                                    {account.isSyncing ? 'Syncing...' : 'Sync Now'}
                                </Button>
                                <Button variant="ghost" size="sm">View Details</Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDisconnect(account.platform)}
                                    style={{ color: 'var(--accent-red)' }}
                                >
                                    Disconnect
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* 3. CONNECT MORE PLATFORMS */}
            {unconnectedPlatforms.length > 0 && (
                <section className="animate-slide-in" style={{ animationDelay: '0.3s', marginTop: 'var(--spacing-lg)' }}>
                    <div className="flex-between" style={{ padding: '0 var(--spacing-md) var(--spacing-sm)' }}>
                        <h2 className="text-lg" style={{ color: 'var(--accent-green)' }}>CONNECT MORE</h2>
                    </div>
                    <div className="flex-col" style={{ padding: '0 var(--spacing-md)', gap: 'var(--spacing-md)' }}>
                        {unconnectedPlatforms.map((platform) => (
                            <Card key={platform} className="shadow-sm">
                                <div className="flex-between">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                        <span style={{ fontSize: '1.5rem' }}>{platformIcons[platform]}</span>
                                        <p style={{ fontWeight: 600 }}>{platformNames[platform]}</p>
                                    </div>
                                    <Button variant="primary" size="sm" onClick={() => handleConnect(platform)}>
                                        Connect
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* 4. SECURITY & PREFERENCES */}
            <section className="animate-slide-in" style={{ animationDelay: '0.4s', marginTop: 'var(--spacing-lg)' }}>
                <div className="flex-between" style={{ padding: '0 var(--spacing-md) var(--spacing-sm)' }}>
                    <h2 className="text-lg" style={{ color: 'var(--muted)' }}>SECURITY & PREFERENCES</h2>
                </div>
                <div style={{ padding: '0 var(--spacing-md)' }}>
                    <Card className="shadow-sm">
                        <div className="flex-col" style={{ gap: 'var(--spacing-md)' }}>
                            {/* Quiet Hours */}
                            <div className="flex-between">
                                <div>
                                    <p style={{ fontWeight: 600 }}>Quiet Hours</p>
                                    <p className="text-sm text-muted">Disable notifications 10pm - 8am</p>
                                </div>
                                <label style={{
                                    position: 'relative',
                                    width: 50,
                                    height: 28,
                                    cursor: 'pointer',
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={quietHours}
                                        onChange={() => setQuietHours(!quietHours)}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: quietHours ? 'var(--accent-primary)' : 'var(--card-border)',
                                        borderRadius: 14,
                                        transition: 'all 0.3s ease',
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            top: 2,
                                            left: quietHours ? 24 : 2,
                                            width: 24,
                                            height: 24,
                                            background: 'var(--background)',
                                            borderRadius: '50%',
                                            transition: 'left 0.3s ease',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                        }} />
                                    </span>
                                </label>
                            </div>

                            {/* Push Notifications */}
                            <div className="flex-between">
                                <div>
                                    <p style={{ fontWeight: 600 }}>Push Notifications</p>
                                    <p className="text-sm text-muted">Receive push notifications</p>
                                </div>
                                <label style={{
                                    position: 'relative',
                                    width: 50,
                                    height: 28,
                                    cursor: 'pointer',
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={pushNotifications}
                                        onChange={() => setPushNotifications(!pushNotifications)}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: pushNotifications ? 'var(--accent-primary)' : 'var(--card-border)',
                                        borderRadius: 14,
                                        transition: 'all 0.3s ease',
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            top: 2,
                                            left: pushNotifications ? 24 : 2,
                                            width: 24,
                                            height: 24,
                                            background: 'var(--background)',
                                            borderRadius: '50%',
                                            transition: 'left 0.3s ease',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                        }} />
                                    </span>
                                </label>
                            </div>

                            {/* Email Digest */}
                            <div className="flex-between">
                                <div>
                                    <p style={{ fontWeight: 600 }}>Daily Email Digest</p>
                                    <p className="text-sm text-muted">Receive daily summary</p>
                                </div>
                                <label style={{
                                    position: 'relative',
                                    width: 50,
                                    height: 28,
                                    cursor: 'pointer',
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={emailDigest}
                                        onChange={() => setEmailDigest(!emailDigest)}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: emailDigest ? 'var(--accent-primary)' : 'var(--card-border)',
                                        borderRadius: 14,
                                        transition: 'all 0.3s ease',
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            top: 2,
                                            left: emailDigest ? 24 : 2,
                                            width: 24,
                                            height: 24,
                                            background: 'var(--background)',
                                            borderRadius: '50%',
                                            transition: 'left 0.3s ease',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                        }} />
                                    </span>
                                </label>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--card-border)', margin: 'var(--spacing-sm) 0' }} />

                            {/* Data Export */}
                            <div className="flex-between">
                                <div>
                                    <p style={{ fontWeight: 600 }}>Export My Data</p>
                                    <p className="text-sm text-muted">Download all your data</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleExportData}>
                                    Export
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </section>

            {/* 5. DANGER ZONE */}
            <section className="animate-slide-in" style={{ animationDelay: '0.5s', marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
                <div className="flex-between" style={{ padding: '0 var(--spacing-md) var(--spacing-sm)' }}>
                    <h2 className="text-lg" style={{ color: 'var(--accent-red)' }}>DANGER ZONE</h2>
                </div>
                <div style={{ padding: '0 var(--spacing-md)' }}>
                    <Card className="shadow-sm" style={{ borderColor: 'var(--accent-red)', background: 'var(--accent-red-bg)' }}>
                        {showDeleteConfirm ? (
                            <div className="flex-col gap-md">
                                <p style={{ fontWeight: 600 }}>Are you sure you want to delete your account?</p>
                                <p className="text-sm text-muted">
                                    This action is irreversible. All your data including conversations, invoices,
                                    and connected accounts will be permanently deleted.
                                </p>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleDeleteAccount}
                                        style={{ background: 'var(--accent-red)', color: 'white' }}
                                    >
                                        Yes, Delete My Account
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-between">
                                <div>
                                    <p style={{ fontWeight: 600 }}>Delete Account</p>
                                    <p className="text-sm text-muted">Permanently delete your account and all data</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}
                                >
                                    Delete
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>
            </section>
        </main>
    );
}
