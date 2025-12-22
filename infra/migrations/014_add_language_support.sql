-- Migration: Add language support and media columns
-- Date: 2025-12-22
-- Description: Support for multi-language content (EN, VI, FR) and stock images

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add language column to ideas table
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Add language column to briefs table
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Add language column to content_packs table
ALTER TABLE content_packs ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Add media column to ideas table (for attached images)
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]';

-- Add media column to content_packs table
ALTER TABLE content_packs ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]';

-- Create content_translations table for translated content
CREATE TABLE IF NOT EXISTS content_translations (
  translation_id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('idea', 'brief', 'pack')),
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  translated_content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ideas_language ON ideas(language);
CREATE INDEX IF NOT EXISTS idx_briefs_language ON briefs(language);
CREATE INDEX IF NOT EXISTS idx_content_packs_language ON content_packs(language);
CREATE INDEX IF NOT EXISTS idx_translations_source ON content_translations(source_id, source_type);
CREATE INDEX IF NOT EXISTS idx_translations_languages ON content_translations(source_language, target_language);

-- Add trigger for content_translations updated_at
DROP TRIGGER IF EXISTS update_content_translations_updated_at ON content_translations;
CREATE TRIGGER update_content_translations_updated_at
    BEFORE UPDATE ON content_translations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Done
SELECT 'Migration 014: Language support and media columns added successfully!' as status;

