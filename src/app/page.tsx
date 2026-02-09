'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { mockPriorityActions, mockConversations, mockInvoices } from '@/lib/data';

export default function TodayPage() {
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

  const expected = mockInvoices
    .filter((i) => i.status === 'draft')
    .reduce((sum, i) => sum + i.amount, 0);

  // Conversations Stats
  const pendingReplies = mockConversations.filter(c => c.unreadCount > 0).length;
  const idleConversations = mockConversations.length - pendingReplies; // Simplified

  return (
    <main className="container animate-slide-in">
      <header style={{ padding: 'var(--spacing-lg) var(--spacing-md)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Today</h1>
        <p className="text-muted">Welcome back, Anton.</p>
      </header>

      {/* 1. PRIORITY ACTIONS */}
      <section className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex-between" style={{ padding: '0 var(--spacing-md) var(--spacing-sm)' }}>
          <h2 className="text-lg" style={{ color: 'var(--accent-red)' }}>PRIORITY</h2>
          <Badge variant="red">{mockPriorityActions.length}</Badge>
        </div>
        <div className="flex-col" style={{ padding: '0 var(--spacing-md)', gap: 'var(--spacing-md)' }}>
          {mockPriorityActions.map((action) => (
            <Card key={action.id} className="shadow-sm">
              <div className="flex-col gap-sm">
                <div>
                  <h3 style={{ fontWeight: 600 }}>{action.title}</h3>
                  <p className="text-sm text-muted">{action.description}</p>
                </div>
                <Button fullWidth variant="primary" size="sm">
                  {action.type === 'reply' ? 'Reply' : action.type === 'reminder' ? 'Send Reminder' : 'Draft Follow-up'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 2. OPPORTUNITIES */}
      <section className="animate-slide-in" style={{ animationDelay: '0.2s', marginTop: 'var(--spacing-lg)' }}>
        <div className="flex-between" style={{ padding: '0 var(--spacing-md) var(--spacing-sm)' }}>
          <h2 className="text-lg" style={{ color: 'var(--accent-blue)' }}>OPPORTUNITIES</h2>
          <Badge variant="blue">{opportunities.length}</Badge>
        </div>
        <div className="flex-col" style={{ padding: '0 var(--spacing-md)', gap: 'var(--spacing-md)' }}>
          {opportunities.map((lead) => (
            <Card key={lead.id} className="shadow-sm">
              <div className="flex-between" style={{ marginBottom: 'var(--spacing-sm)' }}>
                <span style={{ fontWeight: 600 }}>{lead.clientName}</span>
                <Badge variant={(lead.leadScore || 0) >= 0.8 ? 'red' : 'blue'}>
                  {(lead.leadScore || 0) >= 0.8 ? 'HOT' : 'WARM'}
                </Badge>
              </div>
              <p className="text-sm text-muted" style={{ marginBottom: 'var(--spacing-md)' }}>
                {lead.aiSummary || 'Potential Lead'}
              </p>
              <Button fullWidth variant="outline" size="sm">Create Proposal</Button>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. MONEY */}
      <section className="animate-slide-in" style={{ animationDelay: '0.3s', marginTop: 'var(--spacing-lg)' }}>
        <div className="flex-between" style={{ padding: '0 var(--spacing-md) var(--spacing-sm)' }}>
          <h2 className="text-lg" style={{ color: 'var(--accent-green)' }}>MONEY</h2>
        </div>
        <div style={{ padding: '0 var(--spacing-md)' }}>
          <Card className="shadow-sm">
            <div className="flex-between" style={{ marginBottom: 'var(--spacing-md)' }}>
              <div>
                <p className="text-sm text-muted">This Month</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${thisMonthEarnings.toLocaleString()}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="text-sm text-muted">Outstanding</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--accent-red)' }}>
                  ${outstanding.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex-between">
              <p className="text-sm text-muted">Expected: <span style={{ color: 'var(--foreground)' }}>${expected.toLocaleString()}</span></p>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
          </Card>
        </div>
      </section>

      {/* 4. CONVERSATIONS */}
      <section className="animate-slide-in" style={{ animationDelay: '0.4s', marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        <div className="flex-between" style={{ padding: '0 var(--spacing-md) var(--spacing-sm)' }}>
          <h2 className="text-lg" style={{ color: 'var(--muted)' }}>CONVERSATIONS</h2>
        </div>
        <div style={{ padding: '0 var(--spacing-md)' }}>
          <Card className="shadow-sm">
            <div className="flex-between">
              <div>
                <p style={{ fontWeight: 600 }}>{pendingReplies} Replies Pending</p>
                <p className="text-sm text-muted">{idleConversations} conversations idle</p>
              </div>
              <Button variant="secondary" size="sm">Open Inbox</Button>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
