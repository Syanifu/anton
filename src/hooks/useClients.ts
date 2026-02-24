import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { guestClients } from '@/lib/guest-data';

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  channels: string[];
  total_revenue: number;
  active_projects_count: number;
  last_interaction_at: string;
}

export function useClients() {
  const { isGuest, session } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setClients(
        guestClients.map((c) => ({
          id: c.id,
          name: c.name,
          company: c.company || '',
          email: c.email,
          phone: c.phone || '',
          channels: c.channels.map((ch) => ch.type),
          total_revenue: c.total_revenue,
          active_projects_count: c.active_projects_count,
          last_interaction_at: c.last_interaction_at,
        }))
      );
      setLoading(false);
      return;
    }

    const token = session?.access_token || localStorage.getItem('auth_token');

    async function fetchClients() {
      try {
        const res = await fetch('/api/clients', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || data || []);
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchClients();
  }, [isGuest, session]);

  return { clients, loading, isGuest };
}
