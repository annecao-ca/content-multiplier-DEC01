-- Add vector column to documents table for document-level embeddings
-- This allows similarity search at the document level, not just chunk level

-- Ensure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to documents table
-- Using 1536 dimensions to match OpenAI text-embedding-3-small model
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for vector similarity search
-- Using ivfflat index for efficient approximate nearest neighbor search
-- Note: ivfflat requires some data to be present, so we create it conditionally
-- For better performance with large datasets, consider using HNSW index instead
CREATE INDEX IF NOT EXISTS idx_documents_embedding 
ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Alternative: HNSW index (better for large datasets, but slower inserts)
-- Uncomment if you prefer HNSW over ivfflat:
-- CREATE INDEX IF NOT EXISTS idx_documents_embedding_hnsw
-- ON documents 
-- USING hnsw (embedding vector_cosine_ops)
-- WITH (m = 16, ef_construction = 64);

-- Add comment
COMMENT ON COLUMN documents.embedding IS 'Vector embedding for the entire document (1536 dimensions, OpenAI text-embedding-3-small)';
COMMENT ON INDEX idx_documents_embedding IS 'Vector similarity search index for document embeddings using cosine distance';



