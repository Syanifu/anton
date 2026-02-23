'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';

interface MoneySummary {
    earned_this_month: number;
    outstanding: number;
    expected: number;
    net_estimate: number;
}

interface Invoice {
    id: string;
    client_name: string;
    project_name: string;
    amount: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    due_date: string;
}

export default function MoneyPage() {
    const router = useRouter();
    const { session, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<MoneySummary>({
        earned_this_month: 0,
        outstanding: 0,
        expected: 0,
        net_estimate: 0,
    });
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const token = session?.access_token || localStorage.getItem('auth_token');
                const headers = { Authorization: `Bearer ${token}` };

                const [summaryRes, invoicesRes] = await Promise.all([
                    fetch('/api/money/summary', { headers }),
                    fetch('/api/invoices', { headers }),
                ]);

                if (summaryRes.ok) {
                    const data = await summaryRes.json();
                    setSummary(data.summary || data || {
                        earned_this_month: 0,
                        outstanding: 0,
                        expected: 0,
                        net_estimate: 0,
                    });
                }

                if (invoicesRes.ok) {
                    const data = await invoicesRes.json();
                    setInvoices(data.invoices || data || []);
                }
            } catch (err) {
                console.error('Failed to fetch money data:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [session]);

    function getStatusBadgeVariant(status: string): 'gray' | 'blue' | 'green' | 'red' {
        switch (status) {
            case 'draft': return 'gray';
            case 'sent': return 'blue';
            case 'paid': return 'green';
            case 'overdue': return 'red';
            default: return 'gray';
        }
    }

    function getStatusIcon(status: string) {
        switch (status) {
            case 'draft': return '📝';
            case 'sent': return '📤';
            case 'paid': return '💰';
            case 'overdue': return '⚠️';
            default: return '📄';
        }
    }

    function formatDueDate(dateStr: string) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    async function handleSendReminder(invoiceId: string) {
        try {
            const token = session?.access_token || localStorage.getItem('auth_token');
            await fetch(`/api/invoices/${invoiceId}/remind`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (err) {
            console.error('Failed to send reminder:', err);
        }
    }

    async function handleMarkPaid(invoiceId: string) {
        try {
            const token = session?.access_token || localStorage.getItem('auth_token');
            const res = await fetch(`/api/invoices/${invoiceId}/mark-paid`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setInvoices((prev) =>
                    prev.map((inv) =>
                        inv.id === invoiceId ? { ...inv, status: 'paid' as const } : inv
                    )
                );
            }
        } catch (err) {
            console.error('Failed to mark paid:', err);
        }
    }

    return (
        <main className="container animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center" style={{ padding: '24px 20px 12px' }}>
                <h1 className="text-h1">Money</h1>
                <div onClick={() => router.push('/profile')} style={{ cursor: 'pointer' }}>
                    <Avatar src={user?.user_metadata?.avatar_url} size={40} />
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <p className="text-body" style={{ color: 'var(--muted)' }}>Loading finances...</p>
                </div>
            )}

            {!loading && (
                <>
                    {/* Summary Dashboard Card */}
                    <div style={{ padding: '12px 20px 24px' }}>
                        <Card style={{
                            background: 'linear-gradient(135deg, #4B6BFB 0%, #3650C9 100%)',
                            border: 'none',
                            padding: '24px'
                        }}>
                            <div className="flex justify-between items-start" style={{ marginBottom: '24px' }}>
                                <div>
                                    <p className="text-small" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                                        Net Estimate
                                    </p>
                                    <h2 style={{ fontSize: '36px', fontWeight: 700, color: 'white' }}>
                                        ${summary.net_estimate.toLocaleString()}
                                    </h2>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <p className="text-caption" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2px' }}>
                                        Earned This Month
                                    </p>
                                    <p style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>
                                        ${summary.earned_this_month.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-caption" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2px' }}>
                                        Outstanding
                                    </p>
                                    <p style={{ fontSize: '18px', fontWeight: 600, color: '#fbbf24' }}>
                                        ${summary.outstanding.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-caption" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2px' }}>
                                        Expected
                                    </p>
                                    <p style={{ fontSize: '18px', fontWeight: 600, color: '#34d399' }}>
                                        ${summary.expected.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Invoice List */}
                    <section style={{ padding: '0 20px 24px' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
                            <h2 className="text-h3">Invoices</h2>
                            <Badge variant="blue">{invoices.length}</Badge>
                        </div>

                        {invoices.length === 0 ? (
                            <Card style={{ padding: '20px', background: 'var(--card-bg)', textAlign: 'center' }}>
                                <p className="text-body" style={{ color: 'var(--muted)' }}>No invoices yet</p>
                            </Card>
                        ) : (
                            <div className="flex-col gap-sm">
                                {invoices.map((invoice) => (
                                    <Card key={invoice.id} style={{
                                        padding: '16px',
                                        background: 'var(--card-bg)',
                                    }}>
                                        <div className="flex justify-between items-start" style={{ marginBottom: '10px' }}>
                                            <div className="flex items-center gap-md">
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '12px',
                                                    background: invoice.status === 'paid'
                                                        ? 'rgba(16, 185, 129, 0.1)'
                                                        : invoice.status === 'overdue'
                                                        ? 'rgba(239, 68, 68, 0.1)'
                                                        : invoice.status === 'sent'
                                                        ? 'rgba(75, 107, 251, 0.1)'
                                                        : 'rgba(156, 163, 175, 0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '18px'
                                                }}>
                                                    {getStatusIcon(invoice.status)}
                                                </div>
                                                <div>
                                                    <p className="text-body font-bold" style={{ color: 'var(--foreground)', marginBottom: '2px' }}>
                                                        {invoice.client_name}
                                                    </p>
                                                    <p className="text-caption" style={{ color: 'var(--muted)' }}>
                                                        {invoice.project_name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p className="text-body font-bold" style={{ color: 'var(--foreground)', marginBottom: '4px' }}>
                                                    ${invoice.amount.toLocaleString()}
                                                </p>
                                                <Badge variant={getStatusBadgeVariant(invoice.status)}>
                                                    {invoice.status.toUpperCase()}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <p className="text-caption" style={{ color: 'var(--muted)' }}>
                                                Due: {formatDueDate(invoice.due_date)}
                                            </p>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        style={{ borderRadius: '9999px', fontSize: '12px', height: '28px', padding: '0 10px' }}
                                                        onClick={() => handleSendReminder(invoice.id)}
                                                    >
                                                        Send Reminder
                                                    </Button>
                                                )}
                                                {invoice.status === 'sent' && (
                                                    <Button
                                                        size="sm"
                                                        variant="primary"
                                                        style={{
                                                            borderRadius: '9999px',
                                                            fontSize: '12px',
                                                            height: '28px',
                                                            padding: '0 10px',
                                                            background: 'var(--brand-green)',
                                                            color: 'white'
                                                        }}
                                                        onClick={() => handleMarkPaid(invoice.id)}
                                                    >
                                                        Mark Paid
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            {/* FAB - Create Invoice */}
            <button
                onClick={() => router.push('/money/create-invoice')}
                style={{
                    position: 'fixed',
                    bottom: '100px',
                    right: '24px',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    color: 'var(--background)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 50,
                    fontSize: '24px',
                    border: 'none',
                    cursor: 'pointer',
                }}
            >
                +
            </button>

            {/* Bottom spacing for nav */}
            <div style={{ height: '100px' }} />
        </main>
    );
}
