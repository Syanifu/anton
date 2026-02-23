'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

interface Message {
    id: string;
    text: string;
    sender: string;
    timestamp: string;
}

interface Conversation {
    id: string;
    client_name: string;
    sender: string;
    channel: string;
    last_message: Message;
    unread_count: number;
    ai_summary: string;
    status: string;
    lead_score?: number;
}

type FilterType = 'all' | 'unread' | 'leads';

const FILTERS: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Unread', value: 'unread' },
    { label: 'Leads', value: 'leads' },
];

const channelIcons: Record<string, string> = {
    whatsapp: '\uD83D\uDCF1',
    email: '\uD83D\uDCE7',
    slack: '\uD83D\uDCAC',
    telegram: '\u2708\uFE0F',
    sms: '\uD83D\uDCCC',
    phone: '\uD83D\uDCDE',
};

export default function InboxPage() {
    const router = useRouter();
    const { session, user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');

    useEffect(() => {
        async function fetchConversations() {
            try {
                const token = session?.access_token || localStorage.getItem('auth_token');
                const res = await fetch('/api/conversations', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    setConversations(data.conversations || data || []);
                }
            } catch (err) {
                console.error('Failed to fetch conversations:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchConversations();
    }, [session]);

    const filteredConversations = conversations.filter((c) => {
        if (activeFilter === 'unread') return c.unread_count > 0;
        if (activeFilter === 'leads') return c.status === 'lead' || (c.lead_score && c.lead_score >= 0.5);
        return true;
    });

    const unreadCount = conversations.filter((c) => c.unread_count > 0).length;

    function formatTime(timestamp: string) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffMins < 1) return 'Now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function getChannelIcon(channel: string) {
        return channelIcons[channel?.toLowerCase()] || '\uD83D\uDCE8';
    }

    async function handleQuickAction(action: string, conversationId: string) {
        try {
            const token = session?.access_token || localStorage.getItem('auth_token');
            const headers = {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            };

            switch (action) {
                case 'create_lead':
                    await fetch('/api/leads', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ conversation_id: conversationId }),
                    });
                    break;
                case 'draft_proposal':
                    router.push(`/proposals/new?conversation=${conversationId}`);
                    break;
                case 'mark_done':
                    await fetch(`/api/conversations/${conversationId}/mark-done`, {
                        method: 'POST',
                        headers,
                    });
                    setConversations((prev) =>
                        prev.map((c) =>
                            c.id === conversationId ? { ...c, unread_count: 0 } : c
                        )
                    );
                    break;
            }
        } catch (err) {
            console.error('Quick action failed:', err);
        }
    }

    return (
        <main className="container animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center" style={{ padding: '24px 20px 12px' }}>
                <div className="flex items-center gap-sm">
                    <h1 className="text-h1">Inbox</h1>
                    {unreadCount > 0 && <Badge variant="red">{unreadCount}</Badge>}
                </div>
                <div onClick={() => router.push('/profile')} style={{ cursor: 'pointer' }}>
                    <Avatar src={user?.user_metadata?.avatar_url} size={40} />
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ padding: '0 20px 24px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                {FILTERS.map((filter) => (
                    <Button
                        key={filter.value}
                        size="md"
                        variant={activeFilter === filter.value ? 'primary' : 'secondary'}
                        onClick={() => setActiveFilter(filter.value)}
                        style={{
                            borderRadius: '9999px',
                            padding: '0 20px',
                            whiteSpace: 'nowrap',
                            height: '40px',
                            background: activeFilter === filter.value ? 'white' : 'var(--card-bg)',
                            color: activeFilter === filter.value ? 'black' : 'var(--muted)',
                            border: '1px solid var(--card-border)'
                        }}
                    >
                        {filter.label}
                        {filter.value === 'unread' && unreadCount > 0 && (
                            <span style={{
                                width: '6px',
                                height: '6px',
                                background: 'var(--brand-blue)',
                                borderRadius: '50%',
                                marginLeft: '6px',
                                display: 'inline-block',
                            }} />
                        )}
                    </Button>
                ))}
            </div>

            {/* Loading State */}
            {loading && (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <p className="text-body" style={{ color: 'var(--muted)' }}>Loading conversations...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredConversations.length === 0 && (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '48px', marginBottom: '12px' }}>📬</p>
                    <p className="text-body" style={{ color: 'var(--muted)' }}>
                        {activeFilter === 'unread' ? 'No unread messages' :
                         activeFilter === 'leads' ? 'No lead conversations' :
                         'No conversations yet'}
                    </p>
                </div>
            )}

            {/* Conversation List */}
            {!loading && (
                <div className="flex-col gap-md" style={{ padding: '0 20px' }}>
                    {filteredConversations.map((conversation) => (
                        <Card
                            key={conversation.id}
                            style={{
                                background: 'var(--card-bg)',
                                border: '1px solid var(--card-border)',
                                padding: '16px',
                                position: 'relative',
                            }}
                        >
                            {/* Unread Indicator */}
                            {conversation.unread_count > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '18px',
                                    left: '8px',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: 'var(--brand-blue)',
                                }} />
                            )}

                            {/* Top Row: Avatar + Name + Channel + Time */}
                            <div
                                className="flex justify-between items-start"
                                style={{ marginBottom: '8px', cursor: 'pointer' }}
                                onClick={() => router.push(`/conversation/${conversation.id}`)}
                            >
                                <div className="flex gap-md items-center">
                                    <div style={{ position: 'relative' }}>
                                        <Avatar
                                            src={`https://i.pravatar.cc/150?u=${conversation.client_name}`}
                                            size={48}
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            bottom: -2,
                                            right: -2,
                                            width: 20,
                                            height: 20,
                                            background: 'var(--card-bg)',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '11px',
                                            border: '2px solid var(--card-bg)'
                                        }}>
                                            {getChannelIcon(conversation.channel)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-sm">
                                            <span className="text-body font-bold" style={{
                                                color: 'var(--foreground)',
                                                fontWeight: conversation.unread_count > 0 ? 700 : 500,
                                            }}>
                                                {conversation.client_name}
                                            </span>
                                            <span className="text-caption" style={{ color: 'var(--brand-blue)' }}>
                                                {formatTime(conversation.last_message?.timestamp)}
                                            </span>
                                        </div>
                                        <p className="text-caption" style={{ color: 'var(--muted)', marginTop: '1px' }}>
                                            {conversation.sender}
                                        </p>
                                    </div>
                                </div>

                                {conversation.unread_count > 0 && (
                                    <div style={{
                                        background: 'white',
                                        color: 'black',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {conversation.unread_count}
                                    </div>
                                )}
                            </div>

                            {/* Message Preview */}
                            <p
                                className="text-small"
                                style={{
                                    color: 'var(--muted)',
                                    lineHeight: '1.5',
                                    marginBottom: '8px',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                }}
                                onClick={() => router.push(`/conversation/${conversation.id}`)}
                            >
                                {conversation.last_message?.text}
                            </p>

                            {/* AI Insight Line */}
                            {conversation.ai_summary && (
                                <div style={{
                                    background: 'rgba(75, 107, 251, 0.1)',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: 'var(--brand-blue)',
                                        letterSpacing: '0.05em',
                                        flexShrink: 0,
                                    }}>
                                        AI INSIGHT
                                    </span>
                                    <span className="text-caption" style={{
                                        color: 'var(--muted-light)',
                                        fontStyle: 'italic',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {conversation.ai_summary}
                                    </span>
                                </div>
                            )}

                            {/* Quick Actions */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    style={{
                                        borderRadius: '9999px',
                                        fontSize: '12px',
                                        height: '28px',
                                        padding: '0 10px',
                                        flex: 1,
                                    }}
                                    onClick={() => handleQuickAction('create_lead', conversation.id)}
                                >
                                    Create Lead
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    style={{
                                        borderRadius: '9999px',
                                        fontSize: '12px',
                                        height: '28px',
                                        padding: '0 10px',
                                        flex: 1,
                                    }}
                                    onClick={() => handleQuickAction('draft_proposal', conversation.id)}
                                >
                                    Draft Proposal
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    style={{
                                        borderRadius: '9999px',
                                        fontSize: '12px',
                                        height: '28px',
                                        padding: '0 10px',
                                    }}
                                    onClick={() => handleQuickAction('mark_done', conversation.id)}
                                >
                                    Mark Done
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Floating Action Button (Compose) */}
            <button style={{
                position: 'fixed',
                bottom: '100px',
                right: '24px',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'white',
                color: 'black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                zIndex: 50,
                fontSize: '24px',
                border: 'none',
                cursor: 'pointer',
            }}>
                ✏️
            </button>

            {/* Bottom spacing for nav */}
            <div style={{ height: '100px' }} />
        </main>
    );
}
