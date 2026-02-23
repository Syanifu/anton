'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

export default function MoneyPage() {
    const router = useRouter();
    const userAvatar = "https://i.pravatar.cc/150?u=anton";

    return (
        <main className="container animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center" style={{ padding: '24px 20px 12px' }}>
                <h1 className="text-h1">Finances</h1>
                <Avatar src={userAvatar} size={40} />
            </div>

            {/* Summary Card */}
            <div style={{ padding: '0 20px 24px' }}>
                <Card style={{
                    background: 'linear-gradient(135deg, #4B6BFB 0%, #3650C9 100%)',
                    border: 'none',
                    padding: '24px'
                }}>
                    <div className="flex justify-between items-start" style={{ marginBottom: '32px' }}>
                        <div>
                            <p className="text-small" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Net Income (Feb)</p>
                            <h2 style={{ fontSize: '36px', fontWeight: 700, color: 'white' }}>$12,450</h2>
                        </div>
                        <Button variant="ghost" size="sm" style={{ color: 'white', background: 'rgba(255,255,255,0.1)' }}>
                            📈 +12%
                        </Button>
                    </div>

                    <div className="flex gap-lg">
                        <div>
                            <p className="text-caption" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2px' }}>Earnings</p>
                            <p style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>$14,200</p>
                        </div>
                        <div>
                            <p className="text-caption" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2px' }}>Outstanding</p>
                            <p style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>$3,850</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Sections */}
            <div className="flex-col gap-lg" style={{ padding: '0 20px' }}>

                {/* Expected Payments */}
                <div>
                    <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
                        <h3 className="text-h3">Expected</h3>
                        <Button variant="ghost" size="sm" style={{ color: 'var(--brand-blue)' }}>View all</Button>
                    </div>
                    <div className="flex-col gap-sm">
                        <InvoiceItem
                            client="Acme Corp"
                            amount="$2,400"
                            date="Due tomorrow"
                            status="pending"
                        />
                        <InvoiceItem
                            client="Stark Ind"
                            amount="$1,450"
                            date="Due in 3 days"
                            status="pending"
                        />
                    </div>
                </div>

                {/* Recent Activity */}
                <div>
                    <h3 className="text-h3" style={{ marginBottom: '12px' }}>Recent</h3>
                    <div className="flex-col gap-sm">
                        <InvoiceItem
                            client="Wayne Ent"
                            amount="$5,000"
                            date="Paid yesterday"
                            status="paid"
                        />
                        <InvoiceItem
                            client="Cyberdyne"
                            amount="$800"
                            date="Paid Feb 10"
                            status="paid"
                        />
                    </div>
                </div>

            </div>

        </main>
    );
}

function InvoiceItem({ client, amount, date, status }: { client: string, amount: string, date: string, status: 'pending' | 'paid' }) {
    return (
        <Card style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            background: 'var(--card-bg)'
        }}>
            <div className="flex items-center gap-md">
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 165, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                }}>
                    {status === 'paid' ? '💰' : '⏳'}
                </div>
                <div>
                    <p className="text-body font-bold" style={{ color: 'var(--foreground)' }}>{client}</p>
                    <p className="text-caption" style={{ color: status === 'paid' ? 'var(--brand-green)' : 'var(--muted)' }}>
                        {date}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-body font-bold" style={{ color: 'var(--foreground)' }}>{amount}</p>
                <Badge variant={status === 'paid' ? 'green' : 'gray'} className="text-sm">
                    {status.toUpperCase()}
                </Badge>
            </div>
        </Card>
    );
}
