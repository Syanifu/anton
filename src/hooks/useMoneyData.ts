import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { guestMoneySummary, guestInvoices } from '@/lib/guest-data';

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

export function useMoneyData() {
  const { isGuest, session } = useAuth();
  const [summary, setSummary] = useState<MoneySummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setSummary({
        earned_this_month: guestMoneySummary.earnedThisMonth,
        outstanding: guestMoneySummary.outstanding,
        expected: guestMoneySummary.expected,
        net_estimate: guestMoneySummary.netIncome,
      });
      setInvoices(
        guestInvoices.map((i) => ({
          id: i.id,
          client_name: i.client_name,
          project_name: i.project_name || '',
          amount: i.amount,
          status: i.status as 'draft' | 'sent' | 'paid' | 'overdue',
          due_date: i.due_date,
        }))
      );
      setLoading(false);
      return;
    }

    const token = session?.access_token || localStorage.getItem('auth_token');

    async function fetchData() {
      try {
        const [summaryRes, invoicesRes] = await Promise.all([
          fetch('/api/money/summary', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/invoices', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (summaryRes.ok) {
          const data = await summaryRes.json();
          setSummary(data.summary || data);
        }

        if (invoicesRes.ok) {
          const data = await invoicesRes.json();
          setInvoices(data.invoices || data || []);
        }
      } catch (error) {
        console.error('Failed to fetch money data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [isGuest, session]);

  const sendReminder = useCallback(
    async (invoiceId: string) => {
      if (isGuest) {
        alert('Sign in to send payment reminders.');
        return;
      }

      const token = session?.access_token || localStorage.getItem('auth_token');

      try {
        await fetch(`/api/invoices/${invoiceId}/remind`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        console.error('Failed to send reminder:', error);
      }
    },
    [isGuest, session]
  );

  const markPaid = useCallback(
    async (invoiceId: string) => {
      if (isGuest) {
        alert('Sign in to mark invoices as paid.');
        return;
      }

      const token = session?.access_token || localStorage.getItem('auth_token');

      try {
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
      } catch (error) {
        console.error('Failed to mark invoice as paid:', error);
      }
    },
    [isGuest, session]
  );

  return { summary, invoices, loading, isGuest, sendReminder, markPaid };
}
