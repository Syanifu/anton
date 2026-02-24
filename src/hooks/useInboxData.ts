import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { guestConversations } from '@/lib/guest-data';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  client_name: string;
  sender: string;
  channel: string;
  last_message: Message;
  unread_count: number;
  ai_summary: string;
  status: string;
  lead_score?: number;
}

export function useInboxData() {
  const { isGuest, session } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setConversations(
        guestConversations.map((c) => ({
          id: c.id,
          client_name: c.client_name,
          sender: c.client_name,
          channel: c.channel,
          last_message: {
            id: c.id,
            text: c.last_message,
            sender: c.client_name,
            timestamp: c.last_message_at,
          },
          unread_count: c.unread_count,
          ai_summary: c.ai_summary,
          status: c.status,
          lead_score: c.lead_score ?? undefined,
        }))
      );
      setLoading(false);
      return;
    }

    const token = session?.access_token || localStorage.getItem('auth_token');

    async function fetchConversations() {
      try {
        const res = await fetch('/api/conversations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || data || []);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchConversations();
  }, [isGuest, session]);

  const quickAction = useCallback(
    async (action: string, conversationId: string): Promise<string | null> => {
      if (isGuest) {
        alert('Sign in to perform actions on conversations.');
        return null;
      }

      const token = session?.access_token || localStorage.getItem('auth_token');

      try {
        if (action === 'create_lead') {
          await fetch('/api/leads', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ conversation_id: conversationId }),
          });
          return action;
        }

        if (action === 'mark_done') {
          const res = await fetch(`/api/conversations/${conversationId}/mark-done`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === conversationId ? { ...c, status: 'done' } : c
              )
            );
          }
          return action;
        }

        if (action === 'draft_proposal') {
          return action;
        }
      } catch (error) {
        console.error('Failed to perform quick action:', error);
      }

      return null;
    },
    [isGuest, session]
  );

  return { conversations, loading, isGuest, quickAction };
}
