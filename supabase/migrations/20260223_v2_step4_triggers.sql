-- V2 Step 4: Create triggers for new tables + CRON jobs
-- Uses pg_net for HTTP calls and pg_cron for scheduled jobs

-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- ============================================================
-- Helper: Generic webhook dispatch function
-- ============================================================
CREATE OR REPLACE FUNCTION notify_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_url text;
  webhook_secret text;
  payload jsonb;
  event_type text;
BEGIN
  webhook_url := current_setting('app.settings.webhook_url', true);
  webhook_secret := current_setting('app.settings.webhook_secret', true);

  -- Determine event type from trigger argument
  event_type := TG_ARGV[0];

  payload := jsonb_build_object(
    'event', event_type,
    'table', TG_TABLE_NAME,
    'resource_id', NEW.id::text,
    'record', row_to_json(NEW)::jsonb,
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
    'timestamp', now()::text,
    'user_id', NEW.user_id::text
  );

  PERFORM extensions.http_post(
    webhook_url,
    payload::text,
    'application/json',
    ARRAY[
      extensions.http_header('x-webhook-secret', webhook_secret)
    ]
  );

  RETURN NEW;
END;
$$;

-- ============================================================
-- Trigger: on_client_created
-- ============================================================
DROP TRIGGER IF EXISTS on_client_created ON clients;
CREATE TRIGGER on_client_created
  AFTER INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION notify_webhook('client.created');

-- ============================================================
-- Trigger: on_project_created
-- ============================================================
DROP TRIGGER IF EXISTS on_project_created ON projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_webhook('project.created');

-- ============================================================
-- Trigger: on_project_updated
-- ============================================================
DROP TRIGGER IF EXISTS on_project_updated ON projects;
CREATE TRIGGER on_project_updated
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_webhook('project.updated');

-- ============================================================
-- Trigger: update_client_revenue (when invoice paid)
-- ============================================================
CREATE OR REPLACE FUNCTION update_client_revenue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only act when status changes to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') AND NEW.client_id IS NOT NULL THEN
    UPDATE clients
    SET total_revenue = (
      SELECT COALESCE(SUM(amount), 0)
      FROM invoices
      WHERE client_id = NEW.client_id AND status = 'paid'
    )
    WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_client_revenue ON invoices;
CREATE TRIGGER update_client_revenue
  AFTER UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_client_revenue();

-- ============================================================
-- Trigger: update_client_active_projects_count
-- ============================================================
CREATE OR REPLACE FUNCTION update_client_active_projects_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_client_id uuid;
BEGIN
  -- Determine which client_id to update
  IF TG_OP = 'DELETE' THEN
    target_client_id := OLD.client_id;
  ELSE
    target_client_id := NEW.client_id;
  END IF;

  -- Also handle case where client_id changed on UPDATE
  IF TG_OP = 'UPDATE' AND OLD.client_id IS DISTINCT FROM NEW.client_id AND OLD.client_id IS NOT NULL THEN
    UPDATE clients
    SET active_projects_count = (
      SELECT COUNT(*) FROM projects
      WHERE client_id = OLD.client_id AND stage NOT IN ('completed', 'cancelled')
    )
    WHERE id = OLD.client_id;
  END IF;

  IF target_client_id IS NOT NULL THEN
    UPDATE clients
    SET active_projects_count = (
      SELECT COUNT(*) FROM projects
      WHERE client_id = target_client_id AND stage NOT IN ('completed', 'cancelled')
    )
    WHERE id = target_client_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_client_active_projects_count ON projects;
CREATE TRIGGER update_client_active_projects_count
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_client_active_projects_count();

-- ============================================================
-- CRON: Milestone reminder — daily at 8am UTC
-- Check milestones due within 48 hours, create task reminders
-- ============================================================
CREATE OR REPLACE FUNCTION check_milestone_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO tasks (user_id, title, priority, due_date, project_id, created_at, updated_at)
  SELECT
    p.user_id,
    'Milestone due soon: ' || m.title || ' (' || p.title || ')',
    'high',
    m.due_date,
    m.project_id,
    now(),
    now()
  FROM milestones m
  JOIN projects p ON p.id = m.project_id
  WHERE m.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '2 days'
    AND m.completed_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.project_id = m.project_id
        AND t.title LIKE 'Milestone due soon: ' || m.title || '%'
        AND t.created_at > now() - INTERVAL '2 days'
    );
END;
$$;

SELECT cron.schedule(
  'milestone-reminder',
  '0 8 * * *',
  $$SELECT check_milestone_reminders()$$
);

-- ============================================================
-- CRON: Project deadline check — daily at 8am UTC
-- Update project status based on deadlines
-- ============================================================
CREATE OR REPLACE FUNCTION check_project_deadlines()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark overdue projects
  UPDATE projects
  SET status = 'overdue', updated_at = now()
  WHERE deadline < CURRENT_DATE
    AND stage NOT IN ('completed', 'cancelled')
    AND status != 'overdue';

  -- Mark at-risk projects (deadline within 3 days + incomplete milestones)
  UPDATE projects
  SET status = 'at_risk', updated_at = now()
  WHERE deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
    AND stage NOT IN ('completed', 'cancelled')
    AND status = 'on_track'
    AND EXISTS (
      SELECT 1 FROM milestones m
      WHERE m.project_id = projects.id AND m.completed_at IS NULL
    );
END;
$$;

SELECT cron.schedule(
  'project-deadline-check',
  '0 8 * * *',
  $$SELECT check_project_deadlines()$$
);
