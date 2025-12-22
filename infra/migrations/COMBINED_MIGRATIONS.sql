-- ============================================
-- COMBINED MIGRATIONS FOR RAILWAY DATABASE
-- Run this SQL in Railway Postgres Query tab
-- ============================================

-- 001: Enable vector extension and create core tables
CREATE EXTENSION IF NOT EXISTS vector;

-- Core tables
CREATE TABLE IF NOT EXISTS ideas (
  idea_id TEXT PRIMARY KEY,
  one_liner TEXT NOT NULL,
  angle TEXT,
  personas TEXT[] NOT NULL,
  why_now TEXT[],
  evidence JSONB,
  scores JSONB,
  status TEXT NOT NULL DEFAULT 'proposed',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS briefs (
  brief_id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL REFERENCES ideas(idea_id) ON DELETE CASCADE,
  key_points JSONB,
  counterpoints JSONB,
  outline JSONB,
  claims_ledger JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_packs (
  pack_id TEXT PRIMARY KEY,
  brief_id TEXT NOT NULL REFERENCES briefs(brief_id) ON DELETE CASCADE,
  draft_markdown TEXT,
  claims_ledger JSONB,
  seo JSONB,
  derivatives JSONB,
  distribution_plan JSONB,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  doc_id TEXT PRIMARY KEY,
  title TEXT,
  url TEXT,
  raw TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS doc_chunks (
  chunk_id TEXT PRIMARY KEY,
  doc_id TEXT REFERENCES documents(doc_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536)
);

CREATE TABLE IF NOT EXISTS events (
  event_id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  pack_id TEXT,
  idea_id TEXT,
  brief_id TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 005: Add tags to ideas
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_ideas_tags ON ideas USING GIN(tags);

-- 013: Add updated_at columns
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE content_packs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing rows
UPDATE ideas SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE briefs SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE content_packs SET updated_at = created_at WHERE updated_at IS NULL;

-- Create function for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_ideas_updated_at ON ideas;
CREATE TRIGGER update_ideas_updated_at
    BEFORE UPDATE ON ideas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_briefs_updated_at ON briefs;
CREATE TRIGGER update_briefs_updated_at
    BEFORE UPDATE ON briefs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_packs_updated_at ON content_packs;
CREATE TRIGGER update_content_packs_updated_at
    BEFORE UPDATE ON content_packs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ideas_updated_at ON ideas(updated_at);
CREATE INDEX IF NOT EXISTS idx_briefs_updated_at ON briefs(updated_at);
CREATE INDEX IF NOT EXISTS idx_content_packs_updated_at ON content_packs(updated_at);
CREATE INDEX IF NOT EXISTS idx_ideas_scores ON ideas((scores->>'novelty'));
CREATE INDEX IF NOT EXISTS idx_content_packs_seo ON content_packs((seo->>'slug'));
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

-- Done!
SELECT 'Migrations completed successfully!' as status;

