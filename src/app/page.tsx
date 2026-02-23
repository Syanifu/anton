'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { mockPriorityActions, mockConversations, mockInvoices } from '@/lib/data';
import { useProfile } from '@/context/ProfileContext';

export default function TodayPage() {
    const router = useRouter();
    const { profilePicture } = useProfile();

    // Filter Opportunities
    const opportunities = mockConversations
        .filter((c) => c.status === 'lead' && (c.leadScore || 0) >= 0.6)
        .sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0))
        .slice(0, 3);

    // Calculate Money
    const thisMonthEarnings = mockInvoices
        .filter((i) => i.status === 'paid')
        .reduce((sum, i) => sum + i.amount, 0);

    const outstanding = mockInvoices
        .filter((i) => i.status === 'sent' || i.status === 'overdue')
        .reduce((sum, i) => sum + i.amount, 0);

    // Conversations Stats
    const pendingReplies = mockConversations.filter(c => c.unreadCount > 0).length;
    const pendingDrafts = mockConversations.filter(c => c.aiSummary && c.unreadCount > 0).length;

    return (
        <main className="container animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center" style={{ padding: '24px 20px 12px' }}>
                <div>
                    <p className="text-caption" style={{ color: 'var(--muted)', marginBottom: '4px' }}>Good morning</p>
                    <h1 className="text-h1">Today</h1>
                </div>
                <div onClick={() => router.push('/profile')} style={{ cursor: 'pointer' }}>
                    <Avatar src={profilePicture} size={40} />
                </div>
            </div>

            {/* Quick Stats Row */}
            <div style={{ padding: '12px 20px 24px', display: 'flex', gap: '12px' }}>
                <Card style={{
                    flex: 1,
                    padding: '16px',
                    background: 'var(--card-bg)',
                    textAlign: 'center'
                }}>
                    <p className="text-h2" style={{ color: 'var(--brand-blue)', marginBottom: '4px' }}>{pendingReplies}</p>
                    <p className="text-caption">To Reply</p>
                </Card>
                <Card style={{
                    flex: 1,
                    padding: '16px',
                    background: 'var(--card-bg)',
                    textAlign: 'center'
                }}>
                    <p className="text-h2" style={{ color: 'var(--brand-green)', marginBottom: '4px' }}>{pendingDrafts}</p>
                    <p className="text-caption">Drafts Ready</p>
                </Card>
                <Card style={{
                    flex: 1,
                    padding: '16px',
                    background: 'var(--card-bg)',
                    textAlign: 'center'
                }}>
                    <p className="text-h2" style={{ color: 'var(--foreground)', marginBottom: '4px' }}>${(thisMonthEarnings / 1000).toFixed(1)}k</p>
                    <p className="text-caption">Earned</p>
                </Card>
            </div>

            {/* Priority Actions */}
            <section style={{ padding: '0 20px 24px' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
                    <h2 className="text-h3">Priority Actions</h2>
                    <Badge variant="red">{mockPriorityActions.length}</Badge>
                </div>

                <div className="flex-col gap-sm">
                    {mockPriorityActions.slice(0, 3).map((action) => (
                        <Card key={action.id} style={{
                            padding: '16px',
                            background: 'var(--card-bg)',
                            borderLeft: '3px solid var(--brand-red)'
                        }}>
                            <div className="flex justify-between items-start">
                                <div style={{ flex: 1 }}>
                                    <p className="text-body font-bold" style={{ color: 'var(--foreground)', marginBottom: '4px' }}>
                                        {action.title}
                                    </p>
                                    <p className="text-small" style={{ color: 'var(--muted)' }}>
                                        {action.description}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="primary"
                                    style={{
                                        background: 'white',
                                        color: 'black',
                                        borderRadius: '9999px',
                                        marginLeft: '12px'
                                    }}
                                >
                                    {action.type === 'reply' ? 'Reply' : action.type === 'reminder' ? 'Remind' : 'Follow-up'}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Hot Leads */}
            <section style={{ padding: '0 20px 24px' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
                    <h2 className="text-h3">Hot Leads</h2>
                    <Button variant="ghost" size="sm" style={{ color: 'var(--brand-blue)' }}>View all</Button>
                </div>

                <div className="flex-col gap-sm">
                    {opportunities.map((lead) => (
                        <Card key={lead.id} style={{
                            padding: '16px',
                            background: 'var(--card-bg)',
                            cursor: 'pointer'
                        }} onClick={() => router.push(`/conversation/${lead.id}`)}>
                            <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                                <div className="flex items-center gap-sm">
                                    <Avatar src={`https://i.pravatar.cc/150?u=${lead.clientName}`} size={36} />
                                    <span className="text-body font-bold" style={{ color: 'var(--foreground)' }}>
                                        {lead.clientName}
                                    </span>
                                </div>
                                <Badge variant={(lead.leadScore || 0) >= 0.8 ? 'red' : 'blue'}>
                                    {(lead.leadScore || 0) >= 0.8 ? 'HOT' : 'WARM'}
                                </Badge>
                            </div>
                            <p className="text-small" style={{ color: 'var(--muted)' }}>
                                {lead.aiSummary || 'Potential lead - follow up soon'}
                            </p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Money Overview */}
            <section style={{ padding: '0 20px 24px' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
                    <h2 className="text-h3">Money</h2>
                    <Button variant="ghost" size="sm" style={{ color: 'var(--brand-blue)' }} onClick={() => router.push('/money')}>
                        Details
                    </Button>
                </div>

                <Card style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, rgba(75, 107, 251, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
                    border: '1px solid rgba(75, 107, 251, 0.3)'
                }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-caption" style={{ color: 'var(--muted)', marginBottom: '4px' }}>This Month</p>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--foreground)' }}>
                                ${thisMonthEarnings.toLocaleString()}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p className="text-caption" style={{ color: 'var(--muted)', marginBottom: '4px' }}>Outstanding</p>
                            <p style={{ fontSize: '20px', fontWeight: 600, color: 'var(--brand-red)' }}>
                                ${outstanding.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </Card>
            </section>

            {/* Bottom spacing for nav */}
            <div style={{ height: '20px' }} />
        </main>
    );
}
