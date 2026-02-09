'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { mockConversations } from '@/lib/data';
import { Conversation, Channel } from '@/lib/types';

type FilterType = 'all' | 'unread' | 'leads' | 'idle';

const FILTERS: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Unread', value: 'unread' },
    { label: 'Leads', value: 'leads' },
    { label: 'Idle', value: 'idle' },
];

const CHANNEL_ICONS: Record<Channel, { icon: string; color: string }> = {
    whatsapp: { icon: '💬', color: '#25D366' },
    slack: { icon: '🔷', color: '#4A154B' },
    email: { icon: '✉️', color: '#EA4335' },
    telegram: { icon: '📨', color: '#0088cc' },
};

export default function InboxPage() {
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const filteredConversations = conversations.filter((c) => {
        switch (activeFilter) {
            case 'unread': return c.unreadCount > 0;
            case 'leads': return c.status === 'lead';
            case 'idle': return c.status === 'idle';
            default: return true;
        }
    });

    const unreadCount = conversations.filter(c => c.unreadCount > 0).length;
    const leadsCount = conversations.filter(c => c.status === 'lead').length;

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        // Simulate API refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        setConversations([...mockConversations]);
        setIsRefreshing(false);
    }, []);

    const handleConversationClick = (id: string) => {
        // Optimistic update: mark as read
        setConversations(prev => prev.map(c =>
            c.id === id ? { ...c, unreadCount: 0, lastMessage: { ...c.lastMessage, isRead: true } } : c
        ));
        router.push(`/conversation/${id}`);
    };

    const formatRelativeTime = (timestamp: string): string => {
        const diff = Date.now() - new Date(timestamp).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getLeadBadge = (score?: number): { label: string; variant: 'red' | 'blue' | 'gray' } | null => {
        if (!score) return null;
        if (score >= 0.85) return { label: 'HOT', variant: 'red' };
        if (score >= 0.7) return { label: 'WARM', variant: 'blue' };
        return { label: 'NEW', variant: 'gray' };
    };

    return (
        <main className="container animate-slide-in">
            <header style={{ padding: 'var(--spacing-md)' }}>
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    ← Back
                </Button>
                <div style={{ padding: 'var(--spacing-sm) 0' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Inbox</h1>
                    <p className="text-muted">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                        {leadsCount > 0 && ` · ${leadsCount} leads`}
                    </p>
                </div>
            </header>

            {/* Pull to Refresh Button */}
            <section style={{ padding: '0 var(--spacing-md) var(--spacing-sm)' }}>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    style={{ width: '100%', opacity: isRefreshing ? 0.6 : 1 }}
                >
                    {isRefreshing ? '↻ Refreshing...' : '↻ Pull to refresh'}
                </Button>
            </section>

            {/* Filter Tabs */}
            <section style={{ padding: '0 var(--spacing-md) var(--spacing-md)' }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                    {FILTERS.map((filter) => (
                        <Button
                            key={filter.value}
                            size="sm"
                            variant={activeFilter === filter.value ? 'primary' : 'outline'}
                            onClick={() => setActiveFilter(filter.value)}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {filter.label}
                            {filter.value === 'unread' && unreadCount > 0 && (
                                <span style={{
                                    marginLeft: '6px',
                                    background: activeFilter === 'unread' ? 'var(--background)' : 'var(--accent-red)',
                                    color: activeFilter === 'unread' ? 'var(--foreground)' : 'white',
                                    borderRadius: '9999px',
                                    padding: '0 6px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700
                                }}>
                                    {unreadCount}
                                </span>
                            )}
                        </Button>
                    ))}
                </div>
            </section>

            {/* Conversations List */}
            <section style={{ padding: '0 var(--spacing-md) var(--spacing-lg)' }}>
                <div className="flex-col gap-sm">
                    {filteredConversations.length === 0 && (
                        <Card className="shadow-sm" style={{ textAlign: 'center', padding: '32px' }}>
                            <p className="text-muted">
                                {activeFilter === 'unread' ? 'All caught up!' : `No ${activeFilter} conversations`}
                            </p>
                        </Card>
                    )}

                    {filteredConversations.map((conversation) => (
                        <ConversationRow
                            key={conversation.id}
                            conversation={conversation}
                            onClick={() => handleConversationClick(conversation.id)}
                            formatRelativeTime={formatRelativeTime}
                            getLeadBadge={getLeadBadge}
                        />
                    ))}
                </div>
            </section>
        </main>
    );
}

function ConversationRow({
    conversation,
    onClick,
    formatRelativeTime,
    getLeadBadge
}: {
    conversation: Conversation;
    onClick: () => void;
    formatRelativeTime: (ts: string) => string;
    getLeadBadge: (score?: number) => { label: string; variant: 'red' | 'blue' | 'gray' } | null;
}) {
    const channel = CHANNEL_ICONS[conversation.channel];
    const leadBadge = getLeadBadge(conversation.leadScore);
    const hasUnread = conversation.unreadCount > 0;

    return (
        <Card
            className="shadow-sm"
            onClick={onClick}
            style={{
                cursor: 'pointer',
                borderLeft: hasUnread ? '3px solid var(--accent-blue)' : undefined,
                background: hasUnread ? 'var(--accent-blue-bg)' : undefined
            }}
        >
            {/* Header Row */}
            <div className="flex-between" style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Channel Icon */}
                    <span style={{ fontSize: '1.4rem' }}>{channel.icon}</span>

                    {/* Client Name */}
                    <span style={{ fontWeight: hasUnread ? 700 : 600 }}>
                        {conversation.clientName}
                    </span>

                    {/* Lead Badge */}
                    {leadBadge && (
                        <Badge variant={leadBadge.variant} className="text-sm">
                            {leadBadge.label}
                        </Badge>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Timestamp */}
                    <span className="text-sm text-muted">
                        {formatRelativeTime(conversation.lastMessage.timestamp)}
                    </span>

                    {/* Unread Indicator */}
                    {hasUnread && (
                        <div style={{
                            minWidth: '20px',
                            height: '20px',
                            borderRadius: '9999px',
                            background: 'var(--accent-red)',
                            color: 'white',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 6px'
                        }}>
                            {conversation.unreadCount}
                        </div>
                    )}
                </div>
            </div>

            {/* Message Preview */}
            <p style={{
                margin: '0 0 6px 0',
                fontSize: '0.9rem',
                color: hasUnread ? 'var(--foreground)' : 'var(--muted)',
                fontWeight: hasUnread ? 500 : 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                paddingLeft: '34px'
            }}>
                {conversation.lastMessage.sender === 'me' && (
                    <span style={{ color: 'var(--muted)' }}>You: </span>
                )}
                {conversation.lastMessage.text}
            </p>

            {/* AI Summary */}
            {conversation.aiSummary && (
                <p style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    color: 'var(--accent-blue)',
                    fontStyle: 'italic',
                    paddingLeft: '34px'
                }}>
                    ✨ {conversation.aiSummary}
                </p>
            )}
        </Card>
    );
}
