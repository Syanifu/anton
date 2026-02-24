import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { guestProjects } from '@/lib/guest-data';

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  due_date: string;
}

interface ProjectDetail {
  id: string;
  title: string;
  client_id: string;
  client_name: string;
  stage: string;
  status: string;
  budget: number;
  spent: number;
  deadline: string;
  description: string;
  milestones: Milestone[];
  created_at: string;
}

export function useProjectDetail(projectId: string) {
  const { isGuest, session } = useAuth();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    if (isGuest) {
      const gp = guestProjects.find((p) => p.id === projectId);
      if (gp) {
        setProject({
          id: gp.id,
          title: gp.title,
          client_id: gp.client_id,
          client_name: gp.client_name,
          stage: gp.stage,
          status: gp.status,
          budget: gp.budget,
          spent: 0,
          deadline: gp.deadline || '',
          description: gp.description,
          milestones: (gp.milestones || []).map((m) => ({
            id: m.id,
            title: m.title,
            completed: m.completed_at !== null,
            due_date: m.due_date || '',
          })),
          created_at: gp.created_at,
        });
      }
      setLoading(false);
      return;
    }

    const token = session?.access_token || localStorage.getItem('auth_token');

    async function fetchProjectDetail() {
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProject(data.project || data);
        }
      } catch (error) {
        console.error('Failed to fetch project detail:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjectDetail();
  }, [projectId, isGuest, session]);

  const createInvoice = useCallback(async () => {
    if (isGuest) {
      alert('Sign in to create invoices.');
      return null;
    }

    const token = session?.access_token || localStorage.getItem('auth_token');

    try {
      const res = await fetch(`/api/projects/${projectId}/invoice`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
    return null;
  }, [projectId, isGuest, session]);

  return { project, loading, isGuest, createInvoice };
}
