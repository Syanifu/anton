import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  guestClients,
  guestConversations,
  guestLeads,
  guestProjects,
  guestInvoices,
} from '@/lib/guest-data';

interface ClientDetail {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  channels: string[];
  total_revenue: number;
  active_projects_count: number;
  last_interaction_at: string;
  notes: string;
}

interface Conversation {
  id: string;
  channel: string;
  last_message: string;
  timestamp: string;
  unread: boolean;
}

interface Lead {
  id: string;
  title: string;
  score: string;
  budget: number;
  status: string;
}

interface Project {
  id: string;
  title: string;
  stage: string;
  status: string;
  deadline: string;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  due_date: string;
}

export function useClientDetail(clientId: string) {
  const { isGuest, session } = useAuth();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [aiNotes, setAiNotes] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;

    if (isGuest) {
      const gc = guestClients.find((c) => c.id === clientId);
      if (gc) {
        setClient({
          id: gc.id,
          name: gc.name,
          company: gc.company || '',
          email: gc.email,
          phone: gc.phone || '',
          channels: gc.channels.map((ch) => ch.type),
          total_revenue: gc.total_revenue,
          active_projects_count: gc.active_projects_count,
          last_interaction_at: gc.last_interaction_at,
          notes: '',
        });
        setAiNotes(gc.ai_notes);
      }

      setConversations(
        guestConversations
          .filter((c) => c.client_id === clientId)
          .map((c) => ({
            id: c.id,
            channel: c.channel,
            last_message: c.last_message,
            timestamp: c.last_message_at,
            unread: c.unread_count > 0,
          }))
      );

      setLeads(
        guestLeads
          .filter((l) => l.client_id === clientId)
          .map((l) => ({
            id: l.id,
            title: l.title,
            score: String(l.score),
            budget: l.budget || 0,
            status: l.status,
          }))
      );

      setProjects(
        guestProjects
          .filter((p) => p.client_id === clientId)
          .map((p) => ({
            id: p.id,
            title: p.title,
            stage: p.stage,
            status: p.status,
            deadline: p.deadline || '',
          }))
      );

      setInvoices(
        guestInvoices
          .filter((i) => i.client_id === clientId)
          .map((i) => ({
            id: i.id,
            amount: i.amount,
            status: i.status,
            due_date: i.due_date,
          }))
      );

      setLoading(false);
      return;
    }

    const token = session?.access_token || localStorage.getItem('auth_token');

    async function fetchClientDetail() {
      try {
        const res = await fetch(`/api/clients/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setClient(data.client || data);
          setConversations(data.conversations || []);
          setLeads(data.leads || []);
          setProjects(data.projects || []);
          setInvoices(data.invoices || []);
          setAiNotes(data.ai_notes || '');
        }
      } catch (error) {
        console.error('Failed to fetch client detail:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchClientDetail();
  }, [clientId, isGuest, session]);

  return { client, conversations, leads, projects, invoices, aiNotes, loading, isGuest };
}
