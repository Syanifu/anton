'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useClientDetail } from '@/hooks/useClientDetail';
import { GuestBanner } from '@/components/GuestBanner';

type TabType = 'conversations' | 'leads' | 'projects' | 'invoices' | 'notes';

const TABS: { label: string; value: TabType }[] = [
    { label: 'Conversations', value: 'conversations' },
    { label: 'Leads', value: 'leads' },
    { label: 'Projects', value: 'projects' },
    { label: 'Invoices', value: 'invoices' },
    { label: 'AI Notes', value: 'notes' },
];

export default function ClientDetailPage() {
    const router = useRouter();
    const params = useParams();
    const clientId = params.id as string;
    const { client, conversations, leads, projects, invoices, aiNotes, loading } = useClientDetail(clientId);
    const [activeTab, setActiveTab] = useState<TabType>('conversations');

    const channelIcons: Record<string, string> = {
        whatsapp: '💬', email: '📧', phone: '📞', instagram: '📸', telegram: '✈️', sms: '💌',
    };

    const scoreVariant = (score: string): 'red' | 'blue' | 'gray' => {
        if (score === 'HOT') return 'red';
        if (score === 'WARM') return 'blue';
        return 'gray';
    };

    const statusColor = (status: string): string => {
        if (status === 'paid') return 'var(--brand-green)';
        if (status === 'overdue') return 'var(--brand-red)';
        return 'var(--muted)';
    };

    if (loading) {
        return (
            <main className="container animate-fade-in">
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <p className="text-body" style={{ color: 'var(--muted)' }}>Loading client...</p>
                </div>
            </main>
        );
    }

    if (!client) {
        return (
            <main className="container animate-fade-in">
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <p className="text-body" style={{ color: 'var(--muted)' }}>Client not found</p>
                    <Button variant="outline" size="sm" onClick={() => router.push('/clients')} style={{ marginTop: '16px' }}>
                        Back to Clients
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="container animate-fade-in">
            {/* Back Button */}
            <div style={{ padding: '16px 20px 0' }}>
                <Button variant="ghost" size="sm" onClick={() => router.push('/clients')} style={{ color: 'var(--brand-blue)', padding: 0 }}>
                    ← Back
                </Button>
            </div>

            {/* Guest Mode Banner */}
            <GuestBanner />

            {/* Client Header */}
            <div style={{ padding: '12px 20px 24px' }}>
                <Card style={{ padding: '20px', background: 'var(--card-bg)' }}>
                    <div className="flex items-center gap-md" style={{ marginBottom: '16px' }}>
                        <Avatar
                            src={`https://i.pravatar.cc/150?u=${client.id}`}
                            initials={client.name.substring(0, 2)}
                            size={56}
                        />
                        <div style={{ flex: 1 }}>
                            <h2 className="text-h2" style={{ color: 'var(--foreground)', marginBottom: '2px' }}>
                                {client.name}
                            </h2>
                            {client.company && (
                                <p className="text-body" style={{ color: 'var(--muted)' }}>{client.company}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex-col gap-sm">
                        {client.email && (
                            <div className="flex items-center gap-sm">
                                <span style={{ fontSize: '14px' }}>📧</span>
                                <p className="text-small" style={{ color: 'var(--foreground)' }}>{client.email}</p>
                            </div>
                        )}
                        {client.phone && (
                            <div className="flex items-center gap-sm">
                                <span style={{ fontSize: '14px' }}>📞</span>
                                <p className="text-small" style={{ color: 'var(--foreground)' }}>{client.phone}</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-lg" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--card-border)' }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <p className="text-h3" style={{ color: 'var(--brand-green)', marginBottom: '2px' }}>
                                ${(client.total_revenue || 0).toLocaleString()}
                            </p>
                            <p className="text-caption" style={{ color: 'var(--muted)' }}>Revenue</p>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <p className="text-h3" style={{ color: 'var(--brand-blue)', marginBottom: '2px' }}>
                                {client.active_projects_count || 0}
                            </p>
                            <p className="text-caption" style={{ color: 'var(--muted)' }}>Active Projects</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tabs */}
            <div style={{ padding: '0 20px 16px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                {TABS.map((tab) => (
                    <Button
                        key={tab.value}
                        size="sm"
                        variant={activeTab === tab.value ? 'primary' : 'secondary'}
                        onClick={() => setActiveTab(tab.value)}
                        style={{
                            borderRadius: '9999px',
                            padding: '0 16px',
                            whiteSpace: 'nowrap',
                            height: '36px',
                            background: activeTab === tab.value ? 'white' : 'var(--card-bg)',
                            color: activeTab === tab.value ? 'black' : 'var(--muted)',
                            border: '1px solid var(--card-border)',
                            fontSize: '13px'
                        }}
                    >
                        {tab.label}
                    </Button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-col gap-sm" style={{ padding: '0 20px' }}>
                {/* Conversations Tab */}
                {activeTab === 'conversations' && (
                    <>
                        {conversations.length === 0 ? (
                            <EmptyState icon="💬" text="No conversations yet" />
                        ) : (
                            conversations.map((conv) => (
                                <Card key={conv.id} style={{ padding: '16px', background: 'var(--card-bg)' }}>
                                    <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
                                        <div className="flex items-center gap-sm">
                                            <span style={{ fontSize: '14px' }}>{channelIcons[conv.channel] || '📱'}</span>
                                            <p className="text-body font-bold" style={{ color: 'var(--foreground)' }}>
                                                {conv.channel?.charAt(0).toUpperCase() + conv.channel?.slice(1)}
                                            </p>
                                        </div>
                                        {conv.unread && (
                                            <div style={{
                                                width: '8px', height: '8px', borderRadius: '50%',
                                                background: 'var(--brand-blue)'
                                            }} />
                                        )}
                                    </div>
                                    <p className="text-small" style={{ color: 'var(--muted)', lineHeight: '1.5' }}>
                                        {conv.last_message}
                                    </p>
                                    <p className="text-caption" style={{ color: 'var(--muted)', marginTop: '6px' }}>
                                        {conv.timestamp}
                                    </p>
                                </Card>
                            ))
                        )}
                    </>
                )}

                {/* Leads Tab */}
                {activeTab === 'leads' && (
                    <>
                        {leads.length === 0 ? (
                            <EmptyState icon="📈" text="No leads for this client" />
                        ) : (
                            leads.map((lead) => (
                                <Card key={lead.id} onClick={() => router.push('/leads')} style={{ padding: '16px', background: 'var(--card-bg)', cursor: 'pointer' }}>
                                    <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
                                        <p className="text-body font-bold" style={{ color: 'var(--foreground)' }}>{lead.title}</p>
                                        <Badge variant={scoreVariant(lead.score)}>{lead.score}</Badge>
                                    </div>
                                    <div className="flex gap-lg">
                                        <p className="text-small" style={{ color: 'var(--muted)' }}>
                                            Budget: ${(lead.budget || 0).toLocaleString()}
                                        </p>
                                        <p className="text-small" style={{ color: 'var(--muted)' }}>
                                            Status: {lead.status}
                                        </p>
                                    </div>
                                </Card>
                            ))
                        )}
                    </>
                )}

                {/* Projects Tab */}
                {activeTab === 'projects' && (
                    <>
                        {projects.length === 0 ? (
                            <EmptyState icon="📁" text="No projects for this client" />
                        ) : (
                            projects.map((proj) => (
                                <Card key={proj.id} onClick={() => router.push(`/projects/${proj.id}`)} style={{ padding: '16px', background: 'var(--card-bg)', cursor: 'pointer' }}>
                                    <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
                                        <p className="text-body font-bold" style={{ color: 'var(--foreground)' }}>{proj.title}</p>
                                        <Badge variant={proj.stage === 'completed' ? 'green' : 'blue'}>{proj.stage}</Badge>
                                    </div>
                                    <div className="flex gap-lg">
                                        <p className="text-small" style={{ color: 'var(--muted)' }}>
                                            Status: {proj.status}
                                        </p>
                                        {proj.deadline && (
                                            <p className="text-small" style={{ color: 'var(--muted)' }}>
                                                Deadline: {proj.deadline}
                                            </p>
                                        )}
                                    </div>
                                </Card>
                            ))
                        )}
                    </>
                )}

                {/* Invoices Tab */}
                {activeTab === 'invoices' && (
                    <>
                        {invoices.length === 0 ? (
                            <EmptyState icon="💰" text="No invoices for this client" />
                        ) : (
                            invoices.map((inv) => (
                                <Card key={inv.id} style={{ padding: '16px', background: 'var(--card-bg)' }}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-body font-bold" style={{ color: 'var(--foreground)' }}>
                                                ${(inv.amount || 0).toLocaleString()}
                                            </p>
                                            <p className="text-caption" style={{ color: 'var(--muted)', marginTop: '2px' }}>
                                                Due: {inv.due_date}
                                            </p>
                                        </div>
                                        <Badge variant={inv.status === 'paid' ? 'green' : inv.status === 'overdue' ? 'red' : 'gray'}>
                                            {inv.status?.toUpperCase()}
                                        </Badge>
                                    </div>
                                </Card>
                            ))
                        )}
                    </>
                )}

                {/* AI Notes Tab */}
                {activeTab === 'notes' && (
                    <Card style={{ padding: '20px', background: 'var(--card-bg)' }}>
                        <div className="flex items-center gap-sm" style={{ marginBottom: '12px' }}>
                            <span style={{ fontSize: '16px' }}>🤖</span>
                            <p className="text-body font-bold" style={{ color: 'var(--foreground)' }}>AI-Generated Notes</p>
                        </div>
                        <p className="text-body" style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
                            {aiNotes || 'No AI notes available for this client yet. Notes will be generated automatically from conversations and interactions.'}
                        </p>
                    </Card>
                )}
            </div>

            {/* Bottom spacing for nav */}
            <div style={{ height: '100px' }} />
        </main>
    );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
    return (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <p style={{ fontSize: '36px', marginBottom: '8px' }}>{icon}</p>
            <p className="text-body" style={{ color: 'var(--muted)' }}>{text}</p>
        </div>
    );
}
