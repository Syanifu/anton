'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useProfile } from '@/context/ProfileContext';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
    const router = useRouter();
    const { profilePicture, userName, userEmail, updateProfilePicture, updateUserName, updateUserEmail } = useProfile();
    const { signOut } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(userName);
    const [editEmail, setEditEmail] = useState(userEmail);
    const [showNotificationPopup, setShowNotificationPopup] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('notifications_enabled');
        if (saved !== null) setNotificationsEnabled(saved === 'true');
    }, []);

    const toggleNotifications = () => {
        const newValue = !notificationsEnabled;
        setNotificationsEnabled(newValue);
        localStorage.setItem('notifications_enabled', String(newValue));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                updateProfilePicture(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditClick = () => {
        setEditName(userName);
        setEditEmail(userEmail);
        setIsEditing(true);
    };

    const handleSave = () => {
        updateUserName(editName);
        updateUserEmail(editEmail);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    return (
        <main className="container animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center" style={{ padding: '24px 20px 12px' }}>
                <h1 className="text-h1">Settings</h1>
                <Avatar src={profilePicture} size={40} />
            </div>

            {/* Profile Section */}
            <div style={{ padding: '0 20px 24px' }}>
                <div className="flex items-center gap-lg" style={{ marginBottom: '24px' }}>
                    <div style={{ position: 'relative' }}>
                        <Avatar src={profilePicture} size={80} />
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: 'var(--brand-blue)',
                                border: '2px solid var(--background)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            📷
                        </button>
                    </div>
                    <div style={{ flex: 1 }}>
                        {isEditing ? (
                            <div className="flex-col gap-sm">
                                <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Name"
                                    style={{ background: 'var(--card-bg)', color: 'var(--foreground)' }}
                                />
                                <Input
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    placeholder="Email"
                                    style={{ background: 'var(--card-bg)', color: 'var(--foreground)' }}
                                />
                                <div className="flex gap-sm">
                                    <Button variant="primary" size="sm" onClick={handleSave}>
                                        Save
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-h3">{userName}</h2>
                                <p className="text-body" style={{ color: 'var(--muted)' }}>{userEmail}</p>
                                <Button variant="ghost" size="sm" onClick={handleEditClick} style={{ padding: 0, color: 'var(--brand-blue)', marginTop: '4px' }}>
                                    Edit profile
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-col gap-lg">
                    {/* General Settings */}
                    <section>
                        <h3 className="text-subheading" style={{ marginBottom: '12px', color: 'var(--muted)' }}>GENERAL</h3>
                        <Card style={{ padding: 0, overflow: 'hidden' }}>
                            <SettingsItem
                                icon="🔔"
                                label="Notifications"
                                value={notificationsEnabled ? "On" : "Off"}
                                onClick={() => setShowNotificationPopup(true)}
                            />
                            <SettingsItem icon="🌐" label="Language" value="English" isLast />
                        </Card>
                    </section>

                    {/* Integrations */}
                    <section>
                        <h3 className="text-subheading" style={{ marginBottom: '12px', color: 'var(--muted)' }}>INTEGRATIONS</h3>
                        <Card style={{ padding: 0, overflow: 'hidden' }}>
                            <SettingsItem icon="💬" label="WhatsApp" value="Connected" valueColor="var(--brand-green)" />
                            <SettingsItem icon="📧" label="Gmail" value="Connected" valueColor="var(--brand-green)" />
                            <SettingsItem icon="📅" label="Calendar" value="Not connected" valueColor="var(--muted)" />
                            <SettingsItem icon="💼" label="Upwork" value="Connected" valueColor="var(--brand-green)" />
                            <SettingsItem icon="🎯" label="Fiverr" value="Not connected" valueColor="var(--muted)" />
                            <SettingsItem icon="💻" label="Freelancer" value="Not connected" valueColor="var(--muted)" />
                            <SettingsItem icon="🔗" label="LinkedIn" value="Connected" valueColor="var(--brand-green)" isLast />
                        </Card>
                    </section>

                    {/* Subscription */}
                    <section>
                        <h3 className="text-subheading" style={{ marginBottom: '12px', color: 'var(--muted)' }}>SUBSCRIPTION</h3>
                        <Card style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(75, 107, 251, 0.1) 0%, rgba(54, 80, 201, 0.1) 100%)', border: '1px solid var(--brand-blue)' }}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="text-h3" style={{ color: 'var(--brand-blue)', marginBottom: '4px' }}>Pro Plan</h4>
                                    <p className="text-caption" style={{ color: 'var(--muted)' }}>Renews on Mar 1, 2024</p>
                                </div>
                                <Badge variant="blue">ACTIVE</Badge>
                            </div>
                        </Card>
                    </section>

                    <Button
                        variant="outline"
                        fullWidth
                        onClick={async () => {
                            await signOut();
                            router.push('/signup');
                        }}
                        style={{ borderColor: 'var(--brand-red)', color: 'var(--brand-red)' }}
                    >
                        Log out
                    </Button>

                    <div style={{ height: '80px' }}></div>
                </div>
            </div>

            {/* Notification Popup */}
            {showNotificationPopup && (
                <div
                    onClick={() => setShowNotificationPopup(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--card-bg)',
                            borderRadius: '16px',
                            padding: '24px',
                            width: '280px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                        }}
                    >
                        <h3 className="text-h3" style={{ marginBottom: '20px', color: 'var(--foreground)' }}>
                            Notifications
                        </h3>
                        <div className="flex justify-between items-center">
                            <span className="text-body" style={{ color: 'var(--foreground)' }}>
                                Push Notifications
                            </span>
                            <button
                                onClick={toggleNotifications}
                                style={{
                                    width: '50px',
                                    height: '28px',
                                    borderRadius: '14px',
                                    background: notificationsEnabled ? 'var(--brand-green)' : 'var(--muted)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    position: 'absolute',
                                    top: '2px',
                                    left: notificationsEnabled ? '24px' : '2px',
                                    transition: 'left 0.2s'
                                }} />
                            </button>
                        </div>
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={() => setShowNotificationPopup(false)}
                            style={{ marginTop: '24px' }}
                        >
                            Done
                        </Button>
                    </div>
                </div>
            )}
        </main>
    );
}

function SettingsItem({ icon, label, value, valueColor, isLast, onClick }: { icon: string, label: string, value?: string, valueColor?: string, isLast?: boolean, onClick?: () => void }) {
    return (
        <div className="flex justify-between items-center" onClick={onClick} style={{
            padding: '16px 20px',
            borderBottom: isLast ? 'none' : '1px solid var(--card-border)',
            cursor: 'pointer'
        }}>
            <div className="flex items-center gap-md">
                <span style={{ fontSize: '20px' }}>{icon}</span>
                <span className="text-body" style={{ color: 'var(--foreground)' }}>{label}</span>
            </div>
            <div className="flex items-center gap-sm">
                {value && (
                    <span className="text-body" style={{ color: valueColor || 'var(--muted)' }}>{value}</span>
                )}
                <span style={{ color: 'var(--muted)', fontSize: '14px' }}>›</span>
            </div>
        </div>
    );
}
