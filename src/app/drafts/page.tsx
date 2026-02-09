'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { mockDrafts } from '@/lib/data';
import { Draft, DraftStatus, ReplyIntent } from '@/lib/types';

const STATUS_FILTERS: { label: string; value: DraftStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Sent', value: 'sent' },
    { label: 'Dismissed', value: 'dismissed' },
];

const INTENT_LABELS: Record<ReplyIntent, string> = {
    project_inquiry: 'Project',
    payment_query: 'Payment',
    scope_clarification: 'Scope',
    follow_up: 'Follow-up',
    scheduling: 'Scheduling',
    casual_chat: 'Chat',
    introduction: 'Intro',
};

export default function DraftsPage() {
    const router = useRouter();
    const [drafts, setDrafts] = useState<Draft[]>(mockDrafts);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<DraftStatus | 'all'>('all');

    const filteredDrafts = activeFilter === 'all'
        ? drafts
        : drafts.filter(d => d.status === activeFilter);

    const pendingCount = drafts.filter(d => d.status === 'pending').length;

    const handleSend = (draft: Draft, type: 'short' | 'detailed') => {
        console.log(`Sending ${type} reply to ${draft.clientName}`);
        setDrafts(drafts.map(d =>
            d.id === draft.id ? { ...d, status: 'sent' as DraftStatus } : d
        ));
        setExpandedId(null);
    };

    const handleDismiss = (id: string) => {
        setDrafts(drafts.map(d =>
            d.id === id ? { ...d, status: 'dismissed' as DraftStatus } : d
        ));
        setExpandedId(null);
    };

    const handleEdit = (draft: Draft) => {
        alert(`Edit draft for ${draft.clientName}`);
    };

    const getConfidenceBadge = (confidence: number): { variant: 'green' | 'blue' | 'gray'; label: string } => {
        if (confidence >= 0.9) return { variant: 'green', label: 'High' };
        if (confidence >= 0.75) return { variant: 'blue', label: 'Good' };
        return { variant: 'gray', label: 'Low' };
    };

    const getChannelIcon = (channel: string): string => {
        switch (channel) {
            case 'whatsapp': return '💬';
            case 'slack': return '🔷';
            case 'email': return '✉️';
            case 'telegram': return '📨';
            default: return '💬';
        }
    };

    const formatTimeAgo = (dateStr: string): string => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <main className="container animate-slide-in">
            <header style={{ padding: 'var(--spacing-md)' }}>
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    ← Back
                </Button>
                <div style={{ padding: 'var(--spacing-sm) 0' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Drafts</h1>
                    <p className="text-muted">
                        {pendingCount} pending {pendingCount === 1 ? 'reply' : 'replies'} to review
                    </p>
                </div>
            </header>

            {/* Status Filter Tabs */}
            <section style={{ padding: '0 var(--spacing-md) var(--spacing-md)' }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                    {STATUS_FILTERS.map((filter) => (
                        <Button
                            key={filter.value}
                            size="sm"
                            variant={activeFilter === filter.value ? 'primary' : 'outline'}
                            onClick={() => setActiveFilter(filter.value)}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {filter.label}
                            {filter.value === 'pending' && pendingCount > 0 && (
                                <span style={{
                                    marginLeft: '6px',
                                    background: activeFilter === 'pending' ? 'var(--background)' : 'var(--accent-red)',
                                    color: activeFilter === 'pending' ? 'var(--foreground)' : 'white',
                                    borderRadius: '9999px',
                                    padding: '0 6px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700
                                }}>
                                    {pendingCount}
                                </span>
                            )}
                        </Button>
                    ))}
                </div>
            </section>

            {/* Drafts List */}
            <section style={{ padding: '0 var(--spacing-md) var(--spacing-lg)' }}>
                <div className="flex-col gap-sm">
                    {filteredDrafts.length === 0 && (
                        <Card className="shadow-sm" style={{ textAlign: 'center', padding: '32px' }}>
                            <p className="text-muted">No {activeFilter === 'all' ? '' : activeFilter} drafts</p>
                        </Card>
                    )}

                    {filteredDrafts.map((draft) => (
                        <DraftCard
                            key={draft.id}
                            draft={draft}
                            isExpanded={expandedId === draft.id}
                            onToggle={() => setExpandedId(expandedId === draft.id ? null : draft.id)}
                            onSend={handleSend}
                            onDismiss={handleDismiss}
                            onEdit={handleEdit}
                            getConfidenceBadge={getConfidenceBadge}
                            getChannelIcon={getChannelIcon}
                            formatTimeAgo={formatTimeAgo}
                            intentLabels={INTENT_LABELS}
                        />
                    ))}
                </div>
            </section>
        </main>
    );
}

function DraftCard({
    draft,
    isExpanded,
    onToggle,
    onSend,
    onDismiss,
    onEdit,
    getConfidenceBadge,
    getChannelIcon,
    formatTimeAgo,
    intentLabels
}: {
    draft: Draft;
    isExpanded: boolean;
    onToggle: () => void;
    onSend: (draft: Draft, type: 'short' | 'detailed') => void;
    onDismiss: (id: string) => void;
    onEdit: (draft: Draft) => void;
    getConfidenceBadge: (c: number) => { variant: 'green' | 'blue' | 'gray'; label: string };
    getChannelIcon: (channel: string) => string;
    formatTimeAgo: (date: string) => string;
    intentLabels: Record<ReplyIntent, string>;
}) {
    const confidence = getConfidenceBadge(draft.confidence);
    const isPending = draft.status === 'pending';

    return (
        <Card
            className="shadow-sm"
            onClick={onToggle}
            style={{
                cursor: 'pointer',
                opacity: draft.status === 'dismissed' ? 0.6 : 1,
                borderLeft: `3px solid var(--accent-${draft.status === 'sent' ? 'green' : draft.status === 'dismissed' ? 'gray' : 'blue'})`
            }}
        >
            {/* Header */}
            <div className="flex-between" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{getChannelIcon(draft.channel)}</span>
                    <div>
                        <span style={{ fontWeight: 600 }}>{draft.clientName}</span>
                        <span className="text-sm text-muted" style={{ marginLeft: '8px' }}>
                            {formatTimeAgo(draft.createdAt)}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Badge variant="gray" className="text-sm">
                        {intentLabels[draft.intent]}
                    </Badge>
                    <Badge variant={confidence.variant}>
                        {Math.round(draft.confidence * 100)}%
                    </Badge>
                </div>
            </div>

            {/* Short Reply Preview */}
            <div style={{
                background: 'var(--accent-gray-bg)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: isExpanded ? '12px' : 0
            }}>
                <p className="text-sm text-muted" style={{ marginBottom: '4px' }}>Short reply:</p>
                <p style={{ margin: 0 }}>{draft.short}</p>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div style={{ animation: 'slideIn 0.2s ease' }} onClick={(e) => e.stopPropagation()}>
                    {/* Detailed Reply */}
                    <div style={{
                        background: 'var(--accent-blue-bg)',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '16px'
                    }}>
                        <p className="text-sm text-muted" style={{ marginBottom: '4px' }}>Detailed reply:</p>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{draft.detailed}</p>
                    </div>

                    {/* Status indicator for non-pending */}
                    {!isPending && (
                        <div style={{ marginBottom: '12px' }}>
                            <Badge variant={draft.status === 'sent' ? 'green' : 'gray'}>
                                {draft.status === 'sent' ? '✓ Sent' : '✗ Dismissed'}
                            </Badge>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {isPending && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <Button size="sm" onClick={() => onSend(draft, 'short')}>
                                Send Short
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => onSend(draft, 'detailed')}>
                                Send Detailed
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => onEdit(draft)}>
                                Edit
                            </Button>
                            <div style={{ flex: 1 }} />
                            <Button size="sm" variant="ghost" onClick={() => onDismiss(draft.id)}>
                                Dismiss
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}
