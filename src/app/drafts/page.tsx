'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { mockConversations } from '@/lib/data';

interface Draft {
    id: string;
    clientId: string;
    clientName: string;
    content: string;
    status: 'pending' | 'sent' | 'dismissed';
    confidence: number;
    intent: string;
    timestamp: string;
}

// Mock AI drafts based on conversations
const mockDrafts: Draft[] = mockConversations
    .filter(c => c.aiSummary && c.unreadCount > 0)
    .map(c => ({
        id: `draft-${c.id}`,
        clientId: c.id,
        clientName: c.clientName,
        content: `Hi ${c.clientName.split(' ')[0]},\n\nThanks for reaching out! I'd be happy to help with this project. Based on your requirements, I can have this delivered by Tuesday.\n\nLet me know if that works for you.`,
        status: 'pending',
        confidence: 0.89,
        intent: 'Scheduling',
        timestamp: new Date().toISOString()
    }));

export default function DraftsPage() {
    const router = useRouter();
    const [drafts, setDrafts] = useState<Draft[]>(mockDrafts);
    const [filter, setFilter] = useState<'pending' | 'sent' | 'dismissed'>('pending');

    const filteredDrafts = drafts.filter(d => d.status === filter);

    const handleAction = (id: string, action: 'send' | 'dismiss') => {
        setDrafts(prev => prev.map(d =>
            d.id === id ? { ...d, status: action === 'send' ? 'sent' : 'dismissed' } : d
        ));
    };

    const userAvatar = "https://i.pravatar.cc/150?u=anton";

    return (
        <main className="container animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center" style={{ padding: '24px 20px 12px' }}>
                <h1 className="text-h1">Review Drafts</h1>
                <Avatar src={userAvatar} size={40} />
            </div>

            {/* Filter Tabs */}
            <section style={{ padding: '0 20px 24px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {(['pending', 'sent', 'dismissed'] as const).map((f) => (
                        <Button
                            key={f}
                            size="sm"
                            variant={filter === f ? 'primary' : 'secondary'}
                            onClick={() => setFilter(f)}
                            style={{
                                textTransform: 'capitalize',
                                borderRadius: '9999px',
                                background: filter === f ? 'white' : 'var(--card-bg)',
                                color: filter === f ? 'black' : 'var(--muted)',
                                border: '1px solid var(--card-border)'
                            }}
                        >
                            {f}
                        </Button>
                    ))}
                </div>
            </section>

            {/* Drafts List */}
            <div className="flex-col gap-md" style={{ padding: '0 20px 24px' }}>
                {filteredDrafts.length === 0 && (
                    <div className="text-center" style={{ marginTop: '40px', color: 'var(--muted)' }}>
                        <p>No {filter} drafts.</p>
                    </div>
                )}

                {filteredDrafts.map((draft) => (
                    <DraftCard
                        key={draft.id}
                        draft={draft}
                        onSend={() => handleAction(draft.id, 'send')}
                        onDismiss={() => handleAction(draft.id, 'dismiss')}
                        isReviewing={filter === 'pending'}
                    />
                ))}
            </div>

        </main>
    );
}

function DraftCard({
    draft,
    onSend,
    onDismiss,
    isReviewing
}: {
    draft: Draft;
    onSend: () => void;
    onDismiss: () => void;
    isReviewing: boolean;
}) {
    return (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div className="flex justify-between items-center" style={{
                padding: '16px',
                background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid var(--card-border)'
            }}>
                <div className="flex items-center gap-sm">
                    <Avatar src={`https://i.pravatar.cc/150?u=${draft.clientName}`} size={32} />
                    <span className="text-body font-bold" style={{ color: 'var(--foreground)' }}>
                        Draft for {draft.clientName}
                    </span>
                </div>
                {isReviewing && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <Button variant="ghost" size="sm" icon={<span>✏️</span>} />
                        <Button variant="ghost" size="sm" onClick={onDismiss} icon={<span>🗑️</span>} style={{ color: 'var(--brand-red)' }} />
                    </div>
                )}
            </div>

            {/* Content */}
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <Badge variant="blue" className="text-sm">{draft.intent}</Badge>
                    {isReviewing && (
                        <Badge variant="gray" className="text-sm">
                            {Math.round(draft.confidence * 100)}% confidence
                        </Badge>
                    )}
                </div>

                <p className="text-body" style={{
                    color: 'var(--muted-light)',
                    lineHeight: '1.6',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap'
                }}>
                    {draft.content}
                </p>
            </div>

            {/* Footer / Actions */}
            {isReviewing ? (
                <div style={{ padding: '0 20px 20px' }}>
                    <Button
                        fullWidth
                        size="lg"
                        onClick={onSend}
                        style={{
                            background: 'white',
                            color: 'black',
                            fontWeight: 700,
                            fontSize: '16px'
                        }}
                        icon={<span>🚀</span>}
                    >
                        Send now
                    </Button>
                    <div className="text-center" style={{ marginTop: '12px' }}>
                        <span className="text-caption" style={{ color: 'var(--muted)' }}>
                            Auto-sending in 2 hours
                        </span>
                    </div>
                </div>
            ) : (
                <div style={{ padding: '0 20px 20px', textAlign: 'right' }}>
                    <Badge variant={draft.status === 'sent' ? 'green' : 'gray'}>
                        {draft.status.toUpperCase()}
                    </Badge>
                </div>
            )}
        </Card>
    );
}
