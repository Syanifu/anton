'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useLeads } from '@/hooks/useLeads';
import { GuestBanner } from '@/components/GuestBanner';

type FilterType = 'all' | 'HOT' | 'WARM' | 'COLD';

const FILTERS: { label: string; value: FilterType; color?: string }[] = [
    { label: 'All', value: 'all' },
    { label: 'HOT', value: 'HOT', color: 'var(--brand-red)' },
    { label: 'WARM', value: 'WARM', color: '#3B82F6' },
    { label: 'COLD', value: 'COLD' },
];

export default function LeadsPage() {
    const router = useRouter();
    const { leads, loading, convertLead } = useLeads();
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [convertingId, setConvertingId] = useState<string | null>(null);

    const filteredLeads = activeFilter === 'all'
        ? leads
        : leads.filter((l) => l.score === activeFilter);

    async function handleConvert(leadId: string) {
        setConvertingId(leadId);
        try {
            const projectId = await convertLead(leadId);
            if (projectId) {
                router.push(`/projects/${projectId}`);
            }
        } finally {
            setConvertingId(null);
        }
    }

    const scoreVariant = (score: string): 'red' | 'blue' | 'gray' => {
        if (score === 'HOT') return 'red';
        if (score === 'WARM') return 'blue';
        return 'gray';
    };

    const scoreBorderColor = (score: string): string => {
        if (score === 'HOT') return 'var(--brand-red)';
        if (score === 'WARM') return '#3B82F6';
        return 'var(--card-border)';
    };

    return (
        <main className="container animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center" style={{ padding: '24px 20px 12px' }}>
                <h1 className="text-h1">Leads</h1>
                <Badge variant="blue">{leads.length}</Badge>
            </div>

            {/* Guest Mode Banner */}
            <GuestBanner />

            {/* Filter Chips */}
            <div style={{ padding: '0 20px 20px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                {FILTERS.map((filter) => (
                    <Button
                        key={filter.value}
                        size="sm"
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
                        {filter.value !== 'all' && (
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: filter.color || 'var(--muted)',
                                display: 'inline-block',
                                marginRight: '6px'
                            }} />
                        )}
                        {filter.label}
                    </Button>
                ))}
            </div>

            {/* Loading State */}
            {loading && (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <p className="text-body" style={{ color: 'var(--muted)' }}>Loading leads...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredLeads.length === 0 && (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '48px', marginBottom: '12px' }}>📈</p>
                    <p className="text-body" style={{ color: 'var(--muted)' }}>
                        {activeFilter !== 'all' ? `No ${activeFilter} leads` : 'No leads yet'}
                    </p>
                </div>
            )}

            {/* Lead Cards */}
            <div className="flex-col gap-sm" style={{ padding: '0 20px' }}>
                {filteredLeads.map((lead) => (
                    <Card
                        key={lead.id}
                        style={{
                            padding: '16px',
                            background: 'var(--card-bg)',
                            borderLeft: `3px solid ${scoreBorderColor(lead.score)}`
                        }}
                    >
                        <div className="flex justify-between items-start" style={{ marginBottom: '10px' }}>
                            <div className="flex items-center gap-md">
                                <Avatar
                                    src={`https://i.pravatar.cc/150?u=${lead.client_id || lead.id}`}
                                    initials={lead.client_name?.substring(0, 2)}
                                    size={40}
                                />
                                <div>
                                    <p className="text-body font-bold" style={{ color: 'var(--foreground)', marginBottom: '2px' }}>
                                        {lead.client_name}
                                    </p>
                                    <p className="text-small" style={{ color: 'var(--muted)' }}>
                                        {lead.title}
                                    </p>
                                </div>
                            </div>
                            <Badge variant={scoreVariant(lead.score)}>{lead.score}</Badge>
                        </div>

                        <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
                            <div className="flex gap-lg">
                                {lead.budget > 0 && (
                                    <div>
                                        <p className="text-caption" style={{ color: 'var(--muted)', marginBottom: '2px' }}>Budget</p>
                                        <p className="text-body font-bold" style={{ color: 'var(--foreground)' }}>
                                            ${lead.budget.toLocaleString()}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-caption" style={{ color: 'var(--muted)', marginBottom: '2px' }}>Status</p>
                                    <p className="text-body" style={{ color: 'var(--foreground)' }}>
                                        {lead.status}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConvert(lead.id)}
                            disabled={convertingId === lead.id}
                            style={{
                                borderRadius: '9999px',
                                width: '100%',
                                border: '1px solid var(--brand-blue)',
                                color: 'var(--brand-blue)',
                                background: 'rgba(75, 107, 251, 0.05)'
                            }}
                        >
                            {convertingId === lead.id ? 'Converting...' : 'Convert to Project'}
                        </Button>
                    </Card>
                ))}
            </div>

            {/* Bottom spacing for nav */}
            <div style={{ height: '100px' }} />
        </main>
    );
}
