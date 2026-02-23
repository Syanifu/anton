-- V2 Step 3: Add client_id and project_id columns to existing tables

-- conversations.client_id already exists — skip

-- Link leads to clients + track project conversion
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_to_project_id uuid REFERENCES projects(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at timestamptz;

-- Link invoices to clients and projects
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id);

-- Link tasks to projects
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id);

-- Indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
