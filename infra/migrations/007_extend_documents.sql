-- Extend documents table with metadata
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS author TEXT,
ADD COLUMN IF NOT EXISTS published_date DATE,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_documents_author ON documents(author);
CREATE INDEX IF NOT EXISTS idx_documents_published_date ON documents(published_date);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);

-- Add full text search support for title and description
CREATE INDEX IF NOT EXISTS idx_documents_title_search ON documents USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_documents_desc_search ON documents USING GIN(to_tsvector('english', COALESCE(description, '')));

-- Create view for document statistics
CREATE OR REPLACE VIEW document_stats AS
SELECT 
  d.doc_id,
  d.title,
  d.author,
  d.published_date,
  d.tags,
  d.created_at,
  COUNT(dc.chunk_id) as chunk_count
FROM documents d
LEFT JOIN doc_chunks dc ON d.doc_id = dc.doc_id
GROUP BY d.doc_id, d.title, d.author, d.published_date, d.tags, d.created_at;

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_documents_updated_at();










