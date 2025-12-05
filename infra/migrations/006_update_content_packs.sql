-- Migration 006: Update content_packs table
-- Add missing columns and constraints

-- Add missing columns
ALTER TABLE content_packs 
ADD COLUMN IF NOT EXISTS draft_content TEXT,
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create ENUM type for status if not exists
DO $$ BEGIN
    CREATE TYPE pack_status AS ENUM ('draft', 'review', 'approved', 'published');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update status column to use ENUM type
-- First, ensure all existing values are valid
UPDATE content_packs SET status = 'draft' WHERE status NOT IN ('draft', 'review', 'approved', 'published');

-- Change status column type (drop default first, then change type, then add default back)
ALTER TABLE content_packs 
ALTER COLUMN status DROP DEFAULT;

ALTER TABLE content_packs 
ALTER COLUMN status TYPE pack_status USING status::pack_status;

ALTER TABLE content_packs 
ALTER COLUMN status SET DEFAULT 'draft'::pack_status;

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for content_packs
DROP TRIGGER IF EXISTS update_content_packs_updated_at ON content_packs;
CREATE TRIGGER update_content_packs_updated_at
    BEFORE UPDATE ON content_packs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_content_packs_status ON content_packs(status);
CREATE INDEX IF NOT EXISTS idx_content_packs_updated_at ON content_packs(updated_at DESC);

-- Add comment
COMMENT ON TABLE content_packs IS 'Content packages with draft, status tracking, and word count';
COMMENT ON COLUMN content_packs.draft_content IS 'Main draft content in plain text or markdown';
COMMENT ON COLUMN content_packs.word_count IS 'Calculated word count of draft_content';
COMMENT ON COLUMN content_packs.status IS 'Current status: draft, review, approved, or published';
COMMENT ON COLUMN content_packs.updated_at IS 'Automatically updated on every row modification';

