-- Migration 010: Extend documents table with metadata columns
-- This migration ensures author, published_date (TIMESTAMPTZ), and tags columns exist
-- Safe to run multiple times (uses IF NOT EXISTS)
-- 
-- Note: Migration 007 already added these columns, but this migration ensures:
-- 1. published_date is TIMESTAMPTZ (not DATE)
-- 2. All columns exist with proper types
-- 3. Indexes are created for performance

-- Add author column if it doesn't exist
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS author TEXT;

-- Add published_date column (convert from DATE to TIMESTAMPTZ if needed)
-- First check if column exists and what type it is
DO $$
BEGIN
    -- If published_date doesn't exist, create it as TIMESTAMPTZ
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'published_date'
    ) THEN
        ALTER TABLE documents ADD COLUMN published_date TIMESTAMPTZ;
    -- If it exists as DATE, convert to TIMESTAMPTZ
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' 
        AND column_name = 'published_date' 
        AND data_type = 'date'
    ) THEN
        -- Convert DATE to TIMESTAMPTZ
        ALTER TABLE documents 
        ALTER COLUMN published_date TYPE TIMESTAMPTZ 
        USING published_date::TIMESTAMPTZ;
    END IF;
END $$;

-- Add tags column if it doesn't exist
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create indexes for faster filtering (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_documents_author ON documents(author);
CREATE INDEX IF NOT EXISTS idx_documents_published_date ON documents(published_date);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);

-- Add comment
COMMENT ON COLUMN documents.author IS 'Document author or creator';
COMMENT ON COLUMN documents.published_date IS 'Publication date and time (TIMESTAMPTZ)';
COMMENT ON COLUMN documents.tags IS 'Array of tags for categorization';

