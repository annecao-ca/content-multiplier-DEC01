-- Migration: Add updated_at column to ideas table
-- Date: 2025-12-22

-- Add updated_at column to ideas table
ALTER TABLE ideas 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing rows to have updated_at = created_at
UPDATE ideas SET updated_at = created_at WHERE updated_at IS NULL;

-- Create index for sorting by updated_at
CREATE INDEX IF NOT EXISTS idx_ideas_updated_at ON ideas(updated_at);

-- Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_ideas_updated_at ON ideas;

CREATE TRIGGER update_ideas_updated_at
    BEFORE UPDATE ON ideas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Also add updated_at to briefs and content_packs if not exists
ALTER TABLE briefs 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE content_packs 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create triggers for briefs and content_packs
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
CREATE INDEX IF NOT EXISTS idx_briefs_updated_at ON briefs(updated_at);
CREATE INDEX IF NOT EXISTS idx_content_packs_updated_at ON content_packs(updated_at);


