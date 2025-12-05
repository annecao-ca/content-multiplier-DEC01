-- Document Versioning System
-- Allows multiple versions of the same document

-- Create document_versions table
CREATE TABLE IF NOT EXISTS document_versions (
    version_id TEXT PRIMARY KEY,
    doc_id TEXT NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title TEXT,
    author TEXT,
    published_date DATE,
    tags TEXT[] DEFAULT '{}',
    description TEXT,
    raw TEXT NOT NULL,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT,
    
    -- Ensure unique version number per document
    UNIQUE(doc_id, version_number)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_document_versions_doc_id ON document_versions(doc_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_version_number ON document_versions(doc_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_at ON document_versions(created_at DESC);

-- Create doc_chunk_versions table to track which chunks belong to which version
CREATE TABLE IF NOT EXISTS doc_chunk_versions (
    chunk_id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL REFERENCES document_versions(version_id) ON DELETE CASCADE,
    doc_id TEXT NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536),
    chunk_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for chunk versions
CREATE INDEX IF NOT EXISTS idx_doc_chunk_versions_version_id ON doc_chunk_versions(version_id);
CREATE INDEX IF NOT EXISTS idx_doc_chunk_versions_doc_id ON doc_chunk_versions(doc_id);
CREATE INDEX IF NOT EXISTS idx_doc_chunk_versions_embedding ON doc_chunk_versions USING ivfflat (embedding vector_cosine_ops);

-- Add version tracking to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS latest_version_id TEXT,
ADD COLUMN IF NOT EXISTS total_versions INTEGER DEFAULT 1;

-- Create function to get next version number
CREATE OR REPLACE FUNCTION get_next_version_number(p_doc_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO next_version
    FROM document_versions
    WHERE doc_id = p_doc_id;
    
    RETURN next_version;
END;
$$ LANGUAGE plpgsql;

-- Create function to update document version info
CREATE OR REPLACE FUNCTION update_document_version_info(p_doc_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE documents
    SET 
        current_version = (
            SELECT MAX(version_number)
            FROM document_versions
            WHERE doc_id = p_doc_id
        ),
        latest_version_id = (
            SELECT version_id
            FROM document_versions
            WHERE doc_id = p_doc_id
            ORDER BY version_number DESC
            LIMIT 1
        ),
        total_versions = (
            SELECT COUNT(*)
            FROM document_versions
            WHERE doc_id = p_doc_id
        )
    WHERE doc_id = p_doc_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update document version info
CREATE OR REPLACE FUNCTION trigger_update_document_version_info()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_document_version_info(NEW.doc_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_versions_update_info
AFTER INSERT OR UPDATE OR DELETE ON document_versions
FOR EACH ROW
EXECUTE FUNCTION trigger_update_document_version_info();

-- Create view for document version summary
CREATE OR REPLACE VIEW document_version_summary AS
SELECT 
    d.doc_id,
    d.title as current_title,
    d.current_version,
    d.total_versions,
    d.latest_version_id,
    d.created_at as document_created_at,
    dv.version_id,
    dv.version_number,
    dv.title as version_title,
    dv.author,
    dv.published_date,
    dv.tags,
    dv.created_at as version_created_at,
    LENGTH(dv.raw) as content_length,
    (
        SELECT COUNT(*)
        FROM doc_chunk_versions
        WHERE version_id = dv.version_id
    ) as chunk_count
FROM documents d
LEFT JOIN document_versions dv ON d.doc_id = dv.doc_id
ORDER BY d.doc_id, dv.version_number DESC;

-- Add comment
COMMENT ON TABLE document_versions IS 'Stores multiple versions of documents with version numbers';
COMMENT ON TABLE doc_chunk_versions IS 'Stores chunks for each document version';
COMMENT ON FUNCTION get_next_version_number IS 'Returns the next version number for a document';
COMMENT ON FUNCTION update_document_version_info IS 'Updates version tracking info in documents table';








