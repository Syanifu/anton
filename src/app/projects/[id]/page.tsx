'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

interface Milestone {
    id: string;
    title: string;
    completed: boolean;
    due_date: string;
}

interface ProjectDetail {
    id: string;
    title: string;
    client_id: string;
    client_name: string;
    stage: string;
    status: string;
    budget: number;
    spent: number;
    deadline: string;
    description: string;
    milestones: Milestone[];
    created_at: string;
}

const stageColors: Record<string, string> = {
    discovery: '#8B5CF6',
    proposal: '#3B82F6',
    negotiation: '#F59E0B',
    in_progress: '#10B981',
    review: '#6366F1',
    completed: '#22C55E',
    cancelled: '#EF4444',
};

const stageVariant = (stage: string): 'red' | 'blue' | 'green' | 'gray' => {
    if (stage === 'completed') return 'green';
    if (stage === 'cancelled') return 'red';
    if (stage === 'in_progress' || stage === 'review') return 'blue';
    return 'gray';
};

const statusIndicator = (status: string): { color: string; label: string } => {
    if (status === 'on_track') return { color: '#22C55E', label: 'On Track' };
    if (status === 'at_risk') return { color: '#F59E0B', label: 'At Risk' };
    if (status === 'overdue') return { color: '#EF4444', label: 'Overdue' };
    return { color: 'var(--muted)', label: status };
};

function getDeadlineCountdown(deadline: string): string {
    if (!deadline) return '';
    const now = new Date();
    const dl = new Date(deadline);
    const diffMs = dl.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays < 7) return `${diffDays}d left`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w left`;
    return `${Math.floor(diffDays / 30)}mo left`;
}

export default function ProjectDetailPage() {
    const router = useRouter();
    const params = useParams();
    const projectId = params.id as string;
    const { session } = useAuth();

    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [creatingInvoice, setCreatingInvoice] = useState(false);

    useEffect(() => {
        async function fetchProject() {
            try {
                const token = session?.access_token || localStorage.getItem('auth_token');
                const res = await fetch(`/api/projects/${projectId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setProject(data.project || data);
                }
            } catch (err) {
                console.error('Failed to fetch project:', err);
            } finally {
                setLoading(false);
            }
        }

        if (projectId) fetchProject();
    }, [projectId, session]);

    async function handleCreateInvoice() {
        setCreatingInvoice(true);
        try {
            const token = session?.access_token || localStorage.getItem('auth_token');
            const res = await fetch(`/api/projects/${projectId}/invoice`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (res.ok) {
                const data = await res.json();
                // Navigate to money page or show success
                router.push('/money');
            }
        } catch (err) {
            console.error('Failed to create invoice:', err);
        } finally {
            setCreatingInvoice(false);
        }
    }

    if (loading) {
        return (
            <main className="container animate-fade-in">
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <p className="text-body" style={{ color: 'var(--muted)' }}>Loading project...</p>
                </div>
            </main>
        );
    }

    if (!project) {
        return (
            <main className="container animate-fade-in">
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <p className="text-body" style={{ color: 'var(--muted)' }}>Project not found</p>
                    <Button variant="outline" size="sm" onClick={() => router.push('/projects')} style={{ marginTop: '16px' }}>
                        Back to Projects
                    </Button>
                </div>
            </main>
        );
    }

    const si = statusIndicator(project.status);
    const countdown = getDeadlineCountdown(project.deadline);
    const completedMilestones = (project.milestones || []).filter((m) => m.completed).length;
    const totalMilestones = (project.milestones || []).length;
    const budgetUsedPercent = project.budget > 0 ? Math.round(((project.spent || 0) / project.budget) * 100) : 0;

    return (
        <main className="container animate-fade-in">
            {/* Back Button */}
            <div style={{ padding: '16px 20px 0' }}>
                <Button variant="ghost" size="sm" onClick={() => router.push('/projects')} style={{ color: 'var(--brand-blue)', padding: 0 }}>
                    ← Back
                </Button>
            </div>

            {/* Project Header Card */}
            <div style={{ padding: '12px 20px 24px' }}>
                <Card style={{
                    padding: '20px',
                    background: 'var(--card-bg)',
                    borderLeft: `4px solid ${stageColors[project.stage] || 'var(--card-border)'}`
                }}>
                    <div className="flex justify-between items-start" style={{ marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                            <h2 className="text-h2" style={{ color: 'var(--foreground)', marginBottom: '4px' }}>
                                {project.title}
                            </h2>
                            <p className="text-body" style={{ color: 'var(--muted)', cursor: 'pointer' }}
                                onClick={() => router.push(`/clients/${project.client_id}`)}>
                                {project.client_name}
                            </p>
                        </div>
                        <Badge variant={stageVariant(project.stage)}>
                            {project.stage?.replace('_', ' ').toUpperCase()}
                        </Badge>
                    </div>

                    {project.description && (
                        <p className="text-small" style={{ color: 'var(--muted)', lineHeight: '1.6', marginBottom: '16px' }}>
                            {project.description}
                        </p>
                    )}

                    {/* Status + Deadline Row */}
                    <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
                        <div className="flex items-center gap-sm">
                            <div style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: si.color
                            }} />
                            <p className="text-body" style={{ color: si.color, fontWeight: 600 }}>
                                {si.label}
                            </p>
                        </div>
                        {countdown && (
                            <p className="text-body" style={{
                                color: project.status === 'overdue' ? 'var(--brand-red)' : 'var(--muted)',
                                fontWeight: 600
                            }}>
                                {countdown}
                            </p>
                        )}
                    </div>

                    {/* Budget Info */}
                    <div style={{ paddingTop: '16px', borderTop: '1px solid var(--card-border)' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                            <p className="text-caption" style={{ color: 'var(--muted)' }}>Budget</p>
                            <p className="text-body font-bold" style={{ color: 'var(--foreground)' }}>
                                ${(project.spent || 0).toLocaleString()} / ${(project.budget || 0).toLocaleString()}
                            </p>
                        </div>
                        {/* Budget progress bar */}
                        <div style={{
                            width: '100%',
                            height: '6px',
                            background: 'var(--card-border)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${Math.min(budgetUsedPercent, 100)}%`,
                                height: '100%',
                                background: budgetUsedPercent > 90 ? 'var(--brand-red)' : 'var(--brand-blue)',
                                borderRadius: '3px',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                        <p className="text-caption" style={{ color: 'var(--muted)', marginTop: '4px', textAlign: 'right' }}>
                            {budgetUsedPercent}% used
                        </p>
                    </div>
                </Card>
            </div>

            {/* Milestones */}
            <section style={{ padding: '0 20px 24px' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
                    <h3 className="text-h3">Milestones</h3>
                    <p className="text-caption" style={{ color: 'var(--muted)' }}>
                        {completedMilestones}/{totalMilestones} done
                    </p>
                </div>

                {totalMilestones === 0 ? (
                    <Card style={{ padding: '20px', background: 'var(--card-bg)', textAlign: 'center' }}>
                        <p className="text-body" style={{ color: 'var(--muted)' }}>No milestones defined yet</p>
                    </Card>
                ) : (
                    <div className="flex-col gap-sm">
                        {project.milestones.map((milestone) => (
                            <Card key={milestone.id} style={{
                                padding: '14px 16px',
                                background: 'var(--card-bg)',
                                opacity: milestone.completed ? 0.7 : 1
                            }}>
                                <div className="flex items-center gap-md">
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        border: milestone.completed
                                            ? 'none'
                                            : '2px solid var(--card-border)',
                                        background: milestone.completed
                                            ? '#22C55E'
                                            : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        color: 'white',
                                        flexShrink: 0
                                    }}>
                                        {milestone.completed && '✓'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p className="text-body" style={{
                                            color: 'var(--foreground)',
                                            textDecoration: milestone.completed ? 'line-through' : 'none'
                                        }}>
                                            {milestone.title}
                                        </p>
                                        {milestone.due_date && (
                                            <p className="text-caption" style={{ color: 'var(--muted)', marginTop: '2px' }}>
                                                Due: {new Date(milestone.due_date).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            {/* Create Invoice Button */}
            <div style={{ padding: '0 20px 24px' }}>
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleCreateInvoice}
                    disabled={creatingInvoice}
                    style={{
                        borderRadius: 'var(--radius-lg)',
                        background: 'white',
                        color: 'black',
                        fontWeight: 700
                    }}
                >
                    {creatingInvoice ? 'Creating Invoice...' : 'Create Invoice'}
                </Button>
            </div>

            {/* Bottom spacing for nav */}
            <div style={{ height: '100px' }} />
        </main>
    );
}
