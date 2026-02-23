'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { mockConversations } from '@/lib/data';
import { Conversation } from '@/lib/types';

type FilterType = 'all' | 'unread' | 'pending';

const FILTERS: { label: string; value: FilterType }[] = [
    { label: 'All Messages', value: 'all' },
    { label: 'Unread', value: 'unread' },
    { label: 'Pending', value: 'pending' },
];

export default function InboxPage() {
    const router = useRouter();
    const [conversations] = useState<Conversation[]>(mockConversations);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');

    // TODO: Add mock user avatar
    const userAvatar = "https://i.pravatar.cc/150?u=anton";

    return (
        <main className="container animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center" style={{ padding: '24px 20px 12px' }}>
                <h1 className="text-h1">Inbox</h1>
                <Avatar src={userAvatar} size={40} />
            </div>

            {/* Filters */}
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
                        {filter.value === 'pending' && (
                            <span style={{
                                width: '6px',
                                height: '6px',
                                background: 'var(--brand-blue)',
                                borderRadius: '50%',
                                marginLeft: '6px'
                            }} />
                        )}
                    </Button>
                ))}
            </div>

            {/* Conversation List */}
            <div className="flex-col gap-md" style={{ padding: '0 20px' }}>
                {conversations.map((conversation) => (
                    <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        onClick={() => router.push(`/conversation/${conversation.id}`)}
                    />
                ))}
            </div>

            {/* Floating Action Button (Edit/Compose) */}
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
                fontSize: '24px'
            }}>
                ✏️
            </button>
        </main>
    );
}

function ConversationItem({ conversation, onClick }: { conversation: Conversation; onClick: () => void }) {
    const isUnread = conversation.unreadCount > 0;

    return (
        <Card
            onClick={onClick}
            style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                padding: '16px',
                position: 'relative'
            }}
        >
            <div className="flex justify-between items-start" style={{ marginBottom: '8px' }}>
                <div className="flex gap-md items-center">
                    <div style={{ position: 'relative' }}>
                        <Avatar src={`https://i.pravatar.cc/150?u=${conversation.clientName}`} size={48} />
                        <div style={{
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            width: 20,
                            height: 20,
                            background: 'var(--brand-blue)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            color: 'white',
                            border: '2px solid var(--card-bg)'
                        }}>
                            ⚡️
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-sm">
                            <span className="text-body font-bold" style={{ color: 'var(--foreground)' }}>
                                {conversation.clientName}
                            </span>
                            <span className="text-caption" style={{ color: 'var(--brand-blue)' }}>
                                {formatTime(conversation.lastMessage.timestamp)}
                            </span>
                        </div>
                        <p className="text-body font-medium" style={{ color: 'var(--foreground)', marginTop: '2px' }}>
                            {/* Simulate 'Subject' or first line of message */}
                            {conversation.lastMessage.text.substring(0, 25)}...
                        </p>
                    </div>
                </div>

                {isUnread && (
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
                        {conversation.unreadCount}
                    </div>
                )}
            </div>

            <p className="text-small" style={{
                color: 'var(--muted)',
                lineHeight: '1.5',
                marginBottom: '16px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
            }}>
                {conversation.lastMessage.text}
            </p>

            {/* AI Suggestion Area */}
            <div style={{
                background: 'rgba(75, 107, 251, 0.1)',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--brand-blue)',
                    letterSpacing: '0.05em'
                }}>
                    ANTON SUGGESTS
                </span>
                <span className="text-caption" style={{ color: 'var(--muted-light)', fontStyle: 'italic' }}>
                    "{conversation.aiSummary || 'Draft a reply...'}"
                </span>
            </div>
        </Card>
    );
}

function formatTime(timestamp: string) {
    // Simple mock formatter
    return '2M AGO';
}
