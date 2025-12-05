-- Update embedding dimensions from 1536 (OpenAI) to 768 (Gemini)
-- Note: This will fail if there is existing data with 1536 dimensions.
-- We will truncate the tables first to avoid issues since we are switching providers.

TRUNCATE TABLE doc_chunks CASCADE;
TRUNCATE TABLE documents CASCADE;

ALTER TABLE documents ALTER COLUMN embedding TYPE vector(768);
ALTER TABLE doc_chunks ALTER COLUMN embedding TYPE vector(768);
