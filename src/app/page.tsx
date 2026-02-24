'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { guestTodayData, guestProjects } from '@/lib/guest-data';

interface PriorityAction {
    id: string;
    title: string;
    description: string;
    type: string;
    urgency: string;
    client_name?: string;
}

interface Opportunity {
    id: string;
    client_name: string;
    title: string;
    score: number;
    budget?: number;
}

interface MoneyOverview {
    earned_this_month: number;
    outstanding: number;
    expected: number;
}

interface MomentumData {
    pending_replies: number;
    idle_conversations: number;
}

interface Project {
    id: string;
    name: string;
    client_name: string;
    stage: string;
    deadline: string;
    status: 'on_track' | 'at_risk' | 'behind';
}

export default function TodayPage() {
    const router = useRouter();
    const { session, user, isGuest } = useAuth();
    const [loading, setLoading] = useState(true);
    const [priorities, setPriorities] = useState<PriorityAction[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [money, setMoney] = useState<MoneyOverview>({ earned_this_month: 0, outstanding: 0, expected: 0 });
    const [momentum, setMomentum] = useState<MomentumData>({ pending_replies: 0, idle_conversations: 0 });
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        async function fetchData() {
            if (isGuest) {
                setPriorities(guestTodayData.priority.slice(0, 5));
                setOpportunities(
                    guestTodayData.opportunities.map((o) => ({
                        id: o.id,
                        client_name: o.clientName,
                        title: o.title,
                        score: o.score,
                        budget: o.budget,
                    }))
                );
                setMoney({
                    earned_this_month: guestTodayData.money.paidThisMonth,
                    outstanding: guestTodayData.money.outstanding,
                    expected: guestTodayData.money.expected,
                });
                setMomentum({
                    pending_replies: guestTodayData.momentum.replyPendingCount,
                    idle_conversations: guestTodayData.momentum.idleConversations,
                });
                setProjects(
                    guestProjects
                        .filter((p) => p.stage !== 'completed')
                        .map((p) => ({
                            id: p.id,
                            name: p.title,
                            client_name: p.client_name,
                            stage: p.stage,
                            deadline: p.deadline,
                            status: p.status as 'on_track' | 'at_risk' | 'behind',
                        }))
                );
                setLoading(false);
                return;
            }

            try {
                const token = session?.access_token || localStorage.getItem('auth_token');
                const headers = { Authorization: `Bearer ${token}` };

                const [todayRes, projectsRes] = await Promise.all([
                    fetch('/api/today', { headers }),
                    fetch('/api/projects?status=active', { headers }),
                ]);

                if (todayRes.ok) {
                    const data = await todayRes.json();
                    setPriorities((data.priority || data.priorities || []).slice(0, 5));
                    setOpportunities(
                        (data.opportunities || []).filter((o: Opportunity) => o.score >= 0.6)
                    );
                    setMoney(data.money || { earned_this_month: 0, outstanding: 0, expected: 0 });
                    setMomentum(data.momentum || { pending_replies: 0, idle_conversations: 0 });
                }

                if (projectsRes.ok) {
                    const projData = await projectsRes.json();
                    setProjects(projData.projects || projData || []);
                }
            } catch (err) {
                console.error('Failed to fetch today data:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [session, isGuest]);

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'on_track': return 'var(--brand-green)';
            case 'at_risk': return '#f59e0b';
            case 'behind': return 'var(--brand-red)';
            default: return 'var(--muted)';
        }
    }

    function getActionLabel(type: string) {
        switch (type) {
            case 'reply': return 'Reply';
            case 'reminder': return 'Remind';
            case 'follow_up': return 'Follow Up';
            case 'invoice': return 'Invoice';
            default: return 'Action';
        }
    }

    function formatDeadline(dateStr: string) {
        if (!dateStr) return 'No deadline';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        if (diffDays < 7) return `Due in ${diffDays}d`;
        if (diffDays < 30) return `Due in ${Math.floor(diffDays / 7)}w`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    return (
        <main className="container animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center" style={{ padding: '24px 20px 12px' }}>
                <div>
                    <p className="text-caption" style={{ color: 'var(--muted)', marginBottom: '4px' }}>{getGreeting()}</p>
                    <h1 className="text-h1">Today</h1>
                </div>
                <div onClick={() => router.push('/profile')} style={{ cursor: 'pointer' }}>
                    <Avatar src={user?.user_metadata?.avatar_url} size={40} />
                </div>
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

            {/* Loading State */}
            {loading && (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <p className="text-body" style={{ color: 'var(--muted)' }}>Loading your day...</p>
                </div>
            )}

            {!loading && (
                <>
                    {/* Section 1: Priority Actions */}
                    <section style={{ padding: '12px 20px 24px' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
                            <h2 className="text-h3">Priority Actions</h2>
                            {priorities.length > 0 && <Badge variant="red">{priorities.length}</Badge>}
                        </div>

                        {priorities.length === 0 ? (
                            <Card style={{ padding: '20px', background: 'var(--card-bg)', textAlign: 'center' }}>
                                <p className="text-body" style={{ color: 'var(--muted)' }}>No urgent actions right now</p>
                            </Card>
                        ) : (
                            <div className="flex-col gap-sm">
                                {priorities.map((action) => (
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
                                                {action.client_name && (
                                                    <p className="text-caption" style={{ color: 'var(--brand-blue)', marginTop: '4px' }}>
                                                        {action.client_name}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                onClick={() => { if (isGuest) { alert('Sign up to use this feature'); } }}
                                                style={{
                                                    background: 'white',
                                                    color: 'black',
                                                    borderRadius: '9999px',
                                                    marginLeft: '12px'
                                                }}
                                            >
                                                {getActionLabel(action.type)}
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Section 2: Opportunities */}
                    <section style={{ padding: '0 20px 24px' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
                            <h2 className="text-h3">Opportunities</h2>
                            <Button variant="ghost" size="sm" style={{ color: 'var(--brand-blue)' }} onClick={() => router.push('/leads')}>
                                View all
                            </Button>
                        </div>

                        {opportunities.length === 0 ? (
                            <Card style={{ padding: '20px', background: 'var(--card-bg)', textAlign: 'center' }}>
                                <p className="text-body" style={{ color: 'var(--muted)' }}>No hot opportunities right now</p>
                            </Card>
                        ) : (
                            <div className="flex-col gap-sm">
                                {opportunities.map((lead) => (
                                    <Card key={lead.id} style={{
                                        padding: '16px',
                                        background: 'var(--card-bg)',
                                        cursor: 'pointer'
                                    }} onClick={() => router.push('/leads')}>
                                        <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                                            <div className="flex items-center gap-sm">
                                                <Avatar src={`https://i.pravatar.cc/150?u=${lead.client_name}`} size={36} />
                                                <div>
                                                    <span className="text-body font-bold" style={{ color: 'var(--foreground)' }}>
                                                        {lead.client_name}
                                                    </span>
                                                    <p className="text-caption" style={{ color: 'var(--muted)', marginTop: '2px' }}>
                                                        {lead.title}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={lead.score >= 0.8 ? 'red' : 'blue'}>
                                                {lead.score >= 0.8 ? 'HOT' : 'WARM'}
                                            </Badge>
                                        </div>
                                        {lead.budget != null && lead.budget > 0 && (
                                            <p className="text-small" style={{ color: 'var(--brand-green)' }}>
                                                Budget: ${lead.budget.toLocaleString()}
                                            </p>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Section 3: Money */}
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
                            <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
                                <div>
                                    <p className="text-caption" style={{ color: 'var(--muted)', marginBottom: '4px' }}>This Month</p>
                                    <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--foreground)' }}>
                                        ${money.earned_this_month.toLocaleString()}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p className="text-caption" style={{ color: 'var(--muted)', marginBottom: '4px' }}>Outstanding</p>
                                    <p style={{ fontSize: '20px', fontWeight: 600, color: 'var(--brand-red)' }}>
                                        ${money.outstanding.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                                <p className="text-caption" style={{ color: 'var(--muted)', marginBottom: '4px' }}>Expected</p>
                                <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--brand-green)' }}>
                                    ${money.expected.toLocaleString()}
                                </p>
                            </div>
                        </Card>
                    </section>

                    {/* Section 4: Active Projects */}
                    <section style={{ padding: '0 20px 24px' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
                            <h2 className="text-h3">Active Projects</h2>
                            <Button variant="ghost" size="sm" style={{ color: 'var(--brand-blue)' }} onClick={() => router.push('/projects')}>
                                View all
                            </Button>
                        </div>

                        {projects.length === 0 ? (
                            <Card style={{ padding: '20px', background: 'var(--card-bg)', textAlign: 'center' }}>
                                <p className="text-body" style={{ color: 'var(--muted)' }}>No active projects</p>
                            </Card>
                        ) : (
                            <div className="flex-col gap-sm">
                                {projects.map((project) => (
                                    <Card key={project.id} style={{
                                        padding: '16px',
                                        background: 'var(--card-bg)',
                                        cursor: 'pointer'
                                    }} onClick={() => router.push('/projects')}>
                                        <div className="flex justify-between items-start" style={{ marginBottom: '8px' }}>
                                            <div style={{ flex: 1 }}>
                                                <p className="text-body font-bold" style={{ color: 'var(--foreground)', marginBottom: '2px' }}>
                                                    {project.name}
                                                </p>
                                                <p className="text-caption" style={{ color: 'var(--muted)' }}>
                                                    {project.client_name}
                                                </p>
                                            </div>
                                            <Badge variant={
                                                project.stage === 'review' ? 'blue' :
                                                project.stage === 'in_progress' ? 'green' :
                                                project.stage === 'planning' ? 'gray' : 'gray'
                                            }>
                                                {project.stage?.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-caption" style={{ color: 'var(--muted)' }}>
                                                {formatDeadline(project.deadline)}
                                            </p>
                                            <div className="flex items-center gap-sm">
                                                <div style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    background: getStatusColor(project.status)
                                                }} />
                                                <span className="text-caption" style={{ color: getStatusColor(project.status) }}>
                                                    {project.status?.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Section 5: Conversation Momentum */}
                    <section style={{ padding: '0 20px 24px' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
                            <h2 className="text-h3">Conversation Momentum</h2>
                        </div>

                        <Card style={{
                            padding: '20px',
                            background: 'var(--card-bg)',
                        }}>
                            <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
                                <div>
                                    <p className="text-caption" style={{ color: 'var(--muted)', marginBottom: '4px' }}>Pending Replies</p>
                                    <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--brand-blue)' }}>
                                        {momentum.pending_replies}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p className="text-caption" style={{ color: 'var(--muted)', marginBottom: '4px' }}>Idle Conversations</p>
                                    <p style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
                                        {momentum.idle_conversations}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                fullWidth
                                onClick={() => router.push('/inbox')}
                                style={{ borderRadius: '9999px' }}
                            >
                                View Inbox
                            </Button>
                        </Card>
                    </section>
                </>
            )}

            {/* Bottom spacing for nav */}
            <div style={{ height: '100px' }} />
        </main>
    );
}
