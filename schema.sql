-- CPDiagnose — run in Supabase SQL Editor

-- Users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cf_handle text UNIQUE NOT NULL,
  created_at timestamp DEFAULT now()
);

-- CF Sessions (encrypted cookies)
CREATE TABLE IF NOT EXISTS cf_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  session_cookie text NOT NULL,
  jsessionid text,
  expires_at timestamp,
  updated_at timestamp DEFAULT now(),
  UNIQUE (user_id)
);

-- Cached AI Diagnoses
CREATE TABLE IF NOT EXISTS diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id bigint UNIQUE NOT NULL,
  cf_handle text NOT NULL,
  problem_name text,
  problem_rating int,
  problem_tags text[],
  analysis jsonb,
  created_at timestamp DEFAULT now()
);

-- Prerequisite Problem Mappings
CREATE TABLE IF NOT EXISTS problem_prerequisites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id text NOT NULL,
  prereq_problem_id text NOT NULL,
  tag_coverage text[],
  difficulty_delta int,
  prereq_name text,
  prereq_rating int,
  why_this_helps text,
  cf_url text,
  UNIQUE (problem_id, prereq_problem_id)
);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cf_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_prerequisites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_service_only" ON users;
DROP POLICY IF EXISTS "sessions_service_only" ON cf_sessions;
DROP POLICY IF EXISTS "diagnoses_public_read" ON diagnoses;
DROP POLICY IF EXISTS "diagnoses_service_insert" ON diagnoses;
DROP POLICY IF EXISTS "prereqs_public_read" ON problem_prerequisites;
DROP POLICY IF EXISTS "prereqs_service_insert" ON problem_prerequisites;

CREATE POLICY "users_service_only" ON users USING (true) WITH CHECK (true);
CREATE POLICY "sessions_service_only" ON cf_sessions USING (true) WITH CHECK (true);
CREATE POLICY "diagnoses_public_read" ON diagnoses FOR SELECT USING (true);
CREATE POLICY "diagnoses_service_insert" ON diagnoses FOR INSERT WITH CHECK (true);
CREATE POLICY "prereqs_public_read" ON problem_prerequisites FOR SELECT USING (true);
CREATE POLICY "prereqs_service_insert" ON problem_prerequisites FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_cf_sessions_user_id ON cf_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_submission_id ON diagnoses(submission_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_cf_handle ON diagnoses(cf_handle);
