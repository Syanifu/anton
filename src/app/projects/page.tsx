'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { guestProjects } from '@/lib/guest-data';

interface Project {
    id: string;
    title: string;
    client_id: string;
    client_name: string;
    stage: string;
    status: string;
    budget: number;
    deadline: string;
    created_at: string;
}

type FilterType = 'all' | 'active' | 'completed';

const FILTERS: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
];

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

export default function ProjectsPage() {
    const router = useRouter();
    const { session, isGuest } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');

    useEffect(() => {
        async function fetchProjects() {
            if (isGuest) {
                setProjects(guestProjects.map((p) => ({
                    id: p.id,
                    title: p.title,
                    client_id: p.client_id,
                    client_name: p.client_name,
                    stage: p.stage,
                    status: p.status,
                    budget: p.budget,
                    deadline: p.deadline || '',
                    created_at: p.created_at,
                })));
                setLoading(false);
                return;
            }

            try {
                const token = session?.access_token || localStorage.getItem('auth_token');
                const res = await fetch('/api/projects', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setProjects(data.projects || data || []);
                }
            } catch (err) {
                console.error('Failed to fetch projects:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchProjects();
    }, [session, isGuest]);

    const filteredProjects = activeFilter === 'all'
        ? projects
        : activeFilter === 'active'
            ? projects.filter((p) => p.stage !== 'completed' && p.stage !== 'cancelled')
            : projects.filter((p) => p.stage === 'completed');

    return (
        <main className="container animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center" style={{ padding: '24px 20px 12px' }}>
                <h1 className="text-h1">Projects</h1>
                <Badge variant="blue">{projects.length}</Badge>
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

            {/* Filter Tabs */}
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
                        {filter.label}
                    </Button>
                ))}
            </div>

            {/* Loading State */}
            {loading && (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <p className="text-body" style={{ color: 'var(--muted)' }}>Loading projects...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredProjects.length === 0 && (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '48px', marginBottom: '12px' }}>📁</p>
                    <p className="text-body" style={{ color: 'var(--muted)' }}>
                        {activeFilter !== 'all' ? `No ${activeFilter} projects` : 'No projects yet'}
                    </p>
                </div>
            )}

            {/* Project Cards */}
            <div className="flex-col gap-sm" style={{ padding: '0 20px' }}>
                {filteredProjects.map((project) => {
                    const si = statusIndicator(project.status);
                    const countdown = getDeadlineCountdown(project.deadline);

                    return (
                        <Card
                            key={project.id}
                            onClick={() => router.push(`/projects/${project.id}`)}
                            style={{
                                padding: '16px',
                                background: 'var(--card-bg)',
                                cursor: 'pointer',
                                borderLeft: `3px solid ${stageColors[project.stage] || 'var(--card-border)'}`
                            }}
                        >
                            <div className="flex justify-between items-start" style={{ marginBottom: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <p className="text-body font-bold" style={{ color: 'var(--foreground)', marginBottom: '2px' }}>
                                        {project.title}
                                    </p>
                                    <p className="text-small" style={{ color: 'var(--muted)' }}>
                                        {project.client_name}
                                    </p>
                                </div>
                                <Badge variant={stageVariant(project.stage)}>
                                    {project.stage?.replace('_', ' ').toUpperCase()}
                                </Badge>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="flex gap-lg items-center">
                                    {/* Status Indicator */}
                                    <div className="flex items-center gap-sm">
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: si.color
                                        }} />
                                        <p className="text-caption" style={{ color: si.color }}>
                                            {si.label}
                                        </p>
                                    </div>

                                    {/* Budget */}
                                    {project.budget > 0 && (
                                        <p className="text-caption" style={{ color: 'var(--muted)' }}>
                                            ${project.budget.toLocaleString()}
                                        </p>
                                    )}
                                </div>

                                {/* Deadline Countdown */}
                                {countdown && (
                                    <p className="text-caption" style={{
                                        color: project.status === 'overdue' ? 'var(--brand-red)' : 'var(--muted)'
                                    }}>
                                        {countdown}
                                    </p>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Bottom spacing for nav */}
            <div style={{ height: '100px' }} />
        </main>
    );
}
