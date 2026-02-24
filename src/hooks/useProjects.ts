import { useState, useEffect } from 'react';
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

export function useProjects() {
  const { isGuest, session } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setProjects(
        guestProjects.map((p) => ({
          id: p.id,
          title: p.title,
          client_id: p.client_id,
          client_name: p.client_name,
          stage: p.stage,
          status: p.status,
          budget: p.budget,
          deadline: p.deadline || '',
          created_at: p.created_at,
        }))
      );
      setLoading(false);
      return;
    }

    const token = session?.access_token || localStorage.getItem('auth_token');

    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || data || []);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [isGuest, session]);

  return { projects, loading, isGuest };
}
