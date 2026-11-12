-- DOGSRUN continuous scraping — Phase 0–1 (docs/continuous-scraping-plan.md §7).
--
-- MIGRATION FILE ONLY. Do NOT run against live Supabase in this phase.
-- No migrations live in the repo today; schema is managed outside the repo.
-- RLS policies (admin-only read/write) and the /admin/import-queue UI are
-- Phase 1. All writes go through API routes with the service-role key,
-- per repo rules; RLS blocks browser writes.
create table import_queue (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_id text not null,
  source_url text not null,
  shelter_id uuid references organizations(id),
  payload jsonb not null,
  status text not null default 'pending_review',
  possible_duplicate_of uuid references dogs(id),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source, source_id)
);
create table sync_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  dogs_seen int not null default 0,
  dogs_new int not null default 0,
  dogs_updated int not null default 0,
  dogs_removed int not null default 0,
  status text not null default 'running',
  error text
);
