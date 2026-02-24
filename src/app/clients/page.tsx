'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { guestClients } from '@/lib/guest-data';

interface Client {
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    channels: string[];
    total_revenue: number;
    active_projects_count: number;
    last_interaction_at: string;
}

const channelIcons: Record<string, string> = {
    whatsapp: '💬',
    email: '📧',
    phone: '📞',
    instagram: '📸',
    telegram: '✈️',
    sms: '💌',
};

export default function ClientsPage() {
    const router = useRouter();
    const { session, isGuest } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        async function fetchClients() {
            if (isGuest) {
                setClients(guestClients.map((c) => ({
                    id: c.id,
                    name: c.name,
                    company: c.company || '',
                    email: c.email,
                    phone: c.phone || '',
                    channels: c.channels.map((ch) => ch.type),
                    total_revenue: c.total_revenue,
                    active_projects_count: c.active_projects_count,
                    last_interaction_at: c.last_interaction_at,
                })));
                setLoading(false);
                return;
            }

            try {
                const token = session?.access_token || localStorage.getItem('auth_token');
                const res = await fetch('/api/clients', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    setClients(data.clients || data || []);
                }
            } catch (err) {
                console.error('Failed to fetch clients:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchClients();
    }, [session, isGuest]);

    const filteredClients = clients.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.company?.toLowerCase().includes(search.toLowerCase())
    );

    function formatDate(dateStr: string) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return `${Math.floor(diffDays / 30)}mo ago`;
    }

    return (
        <main className="container animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center" style={{ padding: '24px 20px 12px' }}>
                <h1 className="text-h1">Clients</h1>
                <Badge variant="blue">{clients.length}</Badge>
            </div>

            {/* Guest Mode Banner */}
            {isGuest && (
                <div style={{
                    margin: '12px 20px 0',
                    padding: '10px 16px',
                    background: 'rgba(75, 107, 251, 0.1)',
                    border: '1px solid rgba(75, 107, 251, 0.3)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <span className="text-small" style={{ color: 'var(--brand-blue)' }}>
                        Viewing sample data
                    </span>
                    <button
                        onClick={() => router.push('/signup')}
                        style={{
                            background: 'var(--brand-blue)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Sign Up
                    </button>
                </div>
            )}

            {/* Search Bar */}
            <div style={{ padding: '0 20px 20px' }}>
                <div style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <span style={{ fontSize: '16px', opacity: 0.5 }}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--foreground)',
                            fontSize: '15px',
                            width: '100%',
                        }}
                    />
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <p className="text-body" style={{ color: 'var(--muted)' }}>Loading clients...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredClients.length === 0 && (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '48px', marginBottom: '12px' }}>👥</p>
                    <p className="text-body" style={{ color: 'var(--muted)' }}>
                        {search ? 'No clients match your search' : 'No clients yet'}
                    </p>
                </div>
            )}

            {/* Client List */}
            <div className="flex-col gap-sm" style={{ padding: '0 20px' }}>
                {filteredClients.map((client) => (
                    <Card
                        key={client.id}
                        onClick={() => router.push(`/clients/${client.id}`)}
                        style={{
                            padding: '16px',
                            background: 'var(--card-bg)',
                            cursor: 'pointer'
                        }}
                    >
                        <div className="flex justify-between items-start" style={{ marginBottom: '10px' }}>
                            <div className="flex items-center gap-md">
                                <Avatar
                                    src={`https://i.pravatar.cc/150?u=${client.id}`}
                                    initials={client.name.substring(0, 2)}
                                    size={44}
                                />
                                <div>
                                    <p className="text-body font-bold" style={{ color: 'var(--foreground)', marginBottom: '2px' }}>
                                        {client.name}
                                    </p>
                                    {client.company && (
                                        <p className="text-caption" style={{ color: 'var(--muted)' }}>
                                            {client.company}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', fontSize: '14px' }}>
                                {(client.channels || []).map((ch) => (
                                    <span key={ch} title={ch}>
                                        {channelIcons[ch] || '📱'}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex gap-lg items-center">
                                <div>
                                    <p className="text-caption" style={{ color: 'var(--muted)', marginBottom: '2px' }}>Revenue</p>
                                    <p className="text-body font-bold" style={{ color: 'var(--brand-green)' }}>
                                        ${(client.total_revenue || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-caption" style={{ color: 'var(--muted)', marginBottom: '2px' }}>Projects</p>
                                    <p className="text-body font-bold" style={{ color: 'var(--foreground)' }}>
                                        {client.active_projects_count || 0}
                                    </p>
                                </div>
                            </div>
                            <p className="text-caption" style={{ color: 'var(--muted)' }}>
                                {formatDate(client.last_interaction_at)}
                            </p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Bottom spacing for nav */}
            <div style={{ height: '100px' }} />
        </main>
    );
}
