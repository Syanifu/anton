-- V2 Step 2: Create projects and milestones tables

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  client_id uuid REFERENCES clients(id),
  lead_id uuid REFERENCES leads(id),
  conversation_id uuid REFERENCES conversations(id),
  title text NOT NULL,
  description text,
  budget numeric,
  currency text DEFAULT 'USD',
  stage text DEFAULT 'discovery' CHECK (stage IN ('discovery', 'proposal', 'negotiation', 'active', 'review', 'completed', 'cancelled')),
  status text DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'overdue')),
  start_date date,
  deadline date,
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_stage ON projects(user_id, stage);
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(user_id, deadline);

-- Projects RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can manage own projects'
  ) THEN
    CREATE POLICY "Users can manage own projects" ON projects
      FOR ALL USING (user_id = auth.uid());
  END IF;
END
$$;

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  due_date date,
  completed_at timestamptz,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);

-- Milestones RLS (inherit access through project ownership)
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'milestones' AND policyname = 'Users can manage milestones of own projects'
  ) THEN
    CREATE POLICY "Users can manage milestones of own projects" ON milestones
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM projects WHERE projects.id = milestones.project_id AND projects.user_id = auth.uid()
        )
      );
  END IF;
END
$$;
