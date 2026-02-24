import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { guestLeads } from '@/lib/guest-data';

interface Lead {
  id: string;
  client_id: string;
  client_name: string;
  title: string;
  score: string;
  budget: number;
  status: string;
  source: string;
  created_at: string;
  notes: string;
}

export function useLeads() {
  const { isGuest, session } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setLeads(
        guestLeads.map((l) => ({
          id: l.id,
          client_id: l.client_id,
          client_name: l.client_name,
          title: l.title,
          score: l.priority,
          budget: l.budget || 0,
          status: l.status,
          source: '',
          created_at: l.created_at,
          notes: l.ai_summary,
        }))
      );
      setLoading(false);
      return;
    }

    const token = session?.access_token || localStorage.getItem('auth_token');

    async function fetchLeads() {
      try {
        const res = await fetch('/api/leads', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLeads(data.leads || data || []);
        }
      } catch (error) {
        console.error('Failed to fetch leads:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeads();
  }, [isGuest, session]);

  const convertLead = useCallback(
    async (leadId: string): Promise<string | null> => {
      if (isGuest) {
        alert('Sign in to convert leads to projects.');
        return null;
      }

      const token = session?.access_token || localStorage.getItem('auth_token');

      try {
        const res = await fetch(`/api/leads/${leadId}/convert`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLeads((prev) => prev.filter((l) => l.id !== leadId));
          return data.project_id || null;
        }
      } catch (error) {
        console.error('Failed to convert lead:', error);
      }
      return null;
    },
    [isGuest, session]
  );

  return { leads, loading, isGuest, convertLead };
}
