import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { guestTodayData, guestProjects } from '@/lib/guest-data';

interface PriorityAction {
  id: string;
  title: string;
  description: string;
  type: string;
  urgency: string;
  client_name?: string;
}

interface Opportunity {
  id: string;
  client_name: string;
  title: string;
  score: number;
  budget?: number;
}

interface MoneyOverview {
  earned_this_month: number;
  outstanding: number;
  expected: number;
}

interface MomentumData {
  pending_replies: number;
  idle_conversations: number;
}

interface Project {
  id: string;
  name: string;
  client_name: string;
  stage: string;
  deadline: string;
  status: 'on_track' | 'at_risk' | 'behind';
}

export function useTodayData() {
  const { isGuest, session } = useAuth();
  const [priorities, setPriorities] = useState<PriorityAction[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [money, setMoney] = useState<MoneyOverview | null>(null);
  const [momentum, setMomentum] = useState<MomentumData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setPriorities(guestTodayData.priority.slice(0, 5));
      setOpportunities(
        guestTodayData.opportunities.map((o) => ({
          id: o.id,
          client_name: o.clientName,
          title: o.title,
          score: o.score,
          budget: o.budget,
        }))
      );
      setMoney({
        earned_this_month: guestTodayData.money.paidThisMonth,
        outstanding: guestTodayData.money.outstanding,
        expected: guestTodayData.money.expected,
      });
      setMomentum({
        pending_replies: guestTodayData.momentum.replyPendingCount,
        idle_conversations: guestTodayData.momentum.idleConversations,
      });
      setProjects(
        guestProjects
          .filter((p) => p.stage !== 'completed')
          .map((p) => ({
            id: p.id,
            name: p.title,
            client_name: p.client_name,
            stage: p.stage,
            deadline: p.deadline || '',
            status: p.status as 'on_track' | 'at_risk' | 'behind',
          }))
      );
      setLoading(false);
      return;
    }

    const token = session?.access_token || localStorage.getItem('auth_token');

    async function fetchData() {
      try {
        const [todayRes, projectsRes] = await Promise.all([
          fetch('/api/today', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/projects?status=active', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (todayRes.ok) {
          const todayData = await todayRes.json();
          setPriorities(todayData.priorities || []);
          setOpportunities(todayData.opportunities || []);
          setMoney(todayData.money || null);
          setMomentum(todayData.momentum || null);
        }

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setProjects(projectsData.projects || projectsData || []);
        }
      } catch (error) {
        console.error('Failed to fetch today data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [isGuest, session]);

  return { priorities, opportunities, money, momentum, projects, loading, isGuest };
}
