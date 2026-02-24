# Claude Code Prompt — Anton V2 Implementation

Copy-paste this into Claude Code after placing `ANTON_BUILD_PLAN_V2.md` in your project root.

---

## Prompt:

```
Read the file ANTON_BUILD_PLAN_V2.md in the project root. This is the complete build plan for Anton V2 — an AI co-founder app for freelancers.

A basic V1 of Anton is already deployed in this codebase using Supabase + Antigravity + Vercel + Expo. Do NOT rebuild existing working features. Your job is to extend the app with V2 features.

Before making any changes:
1. Read ANTON_BUILD_PLAN_V2.md completely
2. Scan the existing codebase to understand the current structure — look at the Supabase schema, Antigravity missions, Vercel API routes, and Expo screens
3. Identify what already exists vs what's new

Then follow the build order in Phase 7 of the document, step by step (steps 1-24). For each step:
- Tell me what you're about to do
- Implement it
- Verify it works (run tests, check types, validate schema)
- Move to the next step

Key things to know:
- The document contains exact SQL for new tables (clients, projects, milestones) — use it
- The document contains exact LLM prompts for Antigravity missions — use them as-is
- The document lists all new API endpoints with their specs — implement them
- New mobile screens: Clients, Leads, Projects (and updates to Today, Inbox, Money)
- Follow the architecture: Supabase owns data, Antigravity owns AI logic, Vercel owns API surface, mobile app is read-heavy

Start with Step 1: Add the clients table to Supabase with RLS and indexes.
```

---

## Alternative: If you want Claude Code to do a specific phase only

### Database only:
```
Read ANTON_BUILD_PLAN_V2.md. Focus on Phase 1 only. Add the clients, projects, and milestones tables to Supabase. ALTER the existing tables to add client_id and project_id columns. Create all new triggers. Do not touch Antigravity, Vercel, or the mobile app.
```

### Antigravity missions only:
```
Read ANTON_BUILD_PLAN_V2.md. Focus on Phase 2 only. Build the new Antigravity missions (client_identification, project_creation, project_status_check, milestone_reminder) and update existing missions (message_pipeline, conversation_intelligence, lead_scoring, daily_digest, notification_dispatcher). Use the exact LLM prompts from the document.
```

### API routes only:
```
Read ANTON_BUILD_PLAN_V2.md. Focus on Phase 3 only. Update the Vercel webhook router to handle new event types. Create all new BFF API endpoints listed in section 3.2. Follow existing route patterns in the project.
```

### Mobile screens only:
```
Read ANTON_BUILD_PLAN_V2.md. Focus on Phase 4 only. Update navigation to 6 tabs. Build the Clients, Leads, and Projects screens. Update Today, Inbox, and Money screens. All API endpoints already exist — consume them.
```
