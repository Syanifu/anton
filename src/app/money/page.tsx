'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { mockInvoices } from '@/lib/data';
import { Invoice } from '@/lib/types';

export default function MoneyPage() {
    const router = useRouter();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Calculate summary metrics
    const thisMonthEarnings = mockInvoices
        .filter((i) => i.status === 'paid')
        .reduce((sum, i) => sum + i.amount, 0);

    const outstanding = mockInvoices
        .filter((i) => i.status === 'sent' || i.status === 'overdue')
        .reduce((sum, i) => sum + i.amount, 0);

    const expected = mockInvoices
        .filter((i) => i.status === 'draft')
        .reduce((sum, i) => sum + i.amount, 0);

    const platformFees = mockInvoices
        .filter((i) => i.status === 'paid')
        .reduce((sum, i) => sum + i.platform_fee, 0);

    const netIncome = thisMonthEarnings - platformFees;

    const getStatusVariant = (status: Invoice['status']): 'red' | 'blue' | 'green' | 'gray' => {
        switch (status) {
            case 'paid': return 'green';
            case 'overdue': return 'red';
            case 'sent': return 'blue';
            case 'draft': return 'gray';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleInvoiceClick = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleAction = (action: string, invoice: Invoice) => {
        // Mock actions - in real app, these would trigger API calls
        alert(`${action}: ${invoice.clientName} - $${invoice.amount}`);
    };

    return (
        <main className="container animate-slide-in">
            <header style={{ padding: 'var(--spacing-md)' }}>
                <div className="flex-between">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        ← Back
                    </Button>
                    <Button size="sm" onClick={() => handleAction('Create Invoice', { clientName: 'New', amount: 0 } as Invoice)}>
                        + Create Invoice
                    </Button>
                </div>
                <div style={{ padding: 'var(--spacing-sm) 0' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Money</h1>
                    <p className="text-muted">Financial Overview</p>
                </div>
            </header>

            {/* Summary Card */}
            <section style={{ padding: '0 var(--spacing-md) var(--spacing-lg)' }}>
                <Card className="shadow-md" style={{ background: 'linear-gradient(135deg, var(--card-background) 0%, var(--accent-green-bg) 100%)' }}>
                    <div className="flex-between" style={{ marginBottom: '20px' }}>
                        <div>
                            <p className="text-sm text-muted">Net Income (Est.)</p>
                            <p style={{ fontSize: '2.25rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                                ${netIncome.toLocaleString()}
                            </p>
                        </div>
                        <Badge variant="green">This Month</Badge>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <SummaryItem label="Earnings" value={thisMonthEarnings} />
                        <SummaryItem label="Outstanding" value={outstanding} color="var(--accent-red)" />
                        <SummaryItem label="Expected" value={expected} color="var(--accent-blue)" />
                        <SummaryItem label="Platform Fees" value={platformFees} negative />
                    </div>
                </Card>
            </section>

            {/* Invoices List */}
            <section style={{ padding: '0 var(--spacing-md) var(--spacing-lg)' }}>
                <h2 className="text-lg" style={{ marginBottom: '16px' }}>Invoices</h2>
                <div className="flex-col gap-sm">
                    {mockInvoices.map((invoice) => (
                        <InvoiceRow
                            key={invoice.id}
                            invoice={invoice}
                            isExpanded={expandedId === invoice.id}
                            onClick={() => handleInvoiceClick(invoice.id)}
                            onAction={handleAction}
                            getStatusVariant={getStatusVariant}
                            formatDate={formatDate}
                        />
                    ))}
                </div>
            </section>
        </main>
    );
}

function SummaryItem({ label, value, color, negative }: {
    label: string;
    value: number;
    color?: string;
    negative?: boolean;
}) {
    return (
        <div>
            <p className="text-sm text-muted">{label}</p>
            <p style={{ fontWeight: 600, color: color || 'inherit' }}>
                {negative && '-'}${value.toLocaleString()}
            </p>
        </div>
    );
}

function InvoiceRow({
    invoice,
    isExpanded,
    onClick,
    onAction,
    getStatusVariant,
    formatDate
}: {
    invoice: Invoice;
    isExpanded: boolean;
    onClick: () => void;
    onAction: (action: string, invoice: Invoice) => void;
    getStatusVariant: (status: Invoice['status']) => 'red' | 'blue' | 'green' | 'gray';
    formatDate: (date: string) => string;
}) {
    return (
        <Card
            className="shadow-sm"
            onClick={onClick}
            style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderLeft: `3px solid var(--accent-${getStatusVariant(invoice.status)})`
            }}
        >
            {/* Main Row */}
            <div className="flex-between">
                <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, marginBottom: '4px' }}>{invoice.clientName}</p>
                    <p className="text-sm text-muted">Due: {formatDate(invoice.dueDate)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>
                        ${invoice.amount.toLocaleString()}
                    </p>
                    <Badge variant={getStatusVariant(invoice.status)}>
                        {invoice.status}
                    </Badge>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div
                    style={{
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: '1px solid var(--card-border)',
                        animation: 'slideIn 0.2s ease'
                    }}
                >
                    {/* Invoice Details */}
                    <div style={{ marginBottom: '12px' }}>
                        {invoice.description && (
                            <p className="text-sm" style={{ marginBottom: '8px' }}>
                                <span className="text-muted">Description: </span>
                                {invoice.description}
                            </p>
                        )}
                        {invoice.issuedDate && (
                            <p className="text-sm" style={{ marginBottom: '8px' }}>
                                <span className="text-muted">Issued: </span>
                                {formatDate(invoice.issuedDate)}
                            </p>
                        )}
                        <p className="text-sm">
                            <span className="text-muted">Platform Fee: </span>
                            ${invoice.platform_fee.toLocaleString()} (5%)
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                            <Button size="sm" variant="outline" onClick={() => onAction('Send Reminder', invoice)}>
                                Send Reminder
                            </Button>
                        )}
                        {invoice.status === 'draft' && (
                            <Button size="sm" onClick={() => onAction('Send Invoice', invoice)}>
                                Send Invoice
                            </Button>
                        )}
                        {invoice.status !== 'paid' && (
                            <Button size="sm" variant="ghost" onClick={() => onAction('Mark Paid', invoice)}>
                                Mark Paid
                            </Button>
                        )}
                        {invoice.status === 'paid' && (
                            <Button size="sm" variant="ghost" onClick={() => onAction('View Receipt', invoice)}>
                                View Receipt
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
}
