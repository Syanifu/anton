-- V2 Step 1: Extend clients table with V2 columns, indexes, and RLS
-- The clients table already exists with: id, user_id, name, phone, email, created_at, updated_at

-- Add new V2 columns
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS channels jsonb DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS total_revenue numeric DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS active_projects_count integer DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_interaction_at timestamptz;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ai_notes text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Indexes (create if not exist)
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(user_id, name);
CREATE INDEX IF NOT EXISTS idx_clients_last_interaction ON clients(user_id, last_interaction_at DESC);

-- RLS (enable if not already enabled, policy is idempotent via DO block)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Users can manage own clients'
  ) THEN
    CREATE POLICY "Users can manage own clients" ON clients
      FOR ALL USING (user_id = auth.uid());
  END IF;
END
$$;
