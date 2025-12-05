-- Query PostgreSQL để tìm documents theo cosine similarity embedding
-- với filters: author = 'John Doe' và tags chứa 'marketing'

-- ============================================
-- CÁCH 1: Query trên document-level embedding
-- ============================================
-- Sử dụng embedding của toàn bộ document (nếu có)
-- Phù hợp khi cần tìm documents tương tự ở mức document

WITH query_embedding AS (
    -- Thay thế $1 bằng embedding vector của query (1536 dimensions)
    -- Ví dụ: SELECT embedding FROM documents WHERE doc_id = 'query-doc-id'
    SELECT $1::vector(1536) AS embedding
)
SELECT 
    d.doc_id,
    d.title,
    d.author,
    d.published_date,
    d.tags,
    d.url,
    d.description,
    d.created_at,
    -- Cosine similarity score (1 - distance)
    -- <=> là cosine distance operator trong pgvector
    1 - (d.embedding <=> qe.embedding) AS similarity_score
FROM documents d
CROSS JOIN query_embedding qe
WHERE 
    -- Filter theo author
    d.author = 'John Doe'
    -- Filter theo tags chứa 'marketing'
    -- Cách 1: Sử dụng @> (contains) - kiểm tra array có chứa giá trị
    AND d.tags @> ARRAY['marketing']::text[]
    -- Cách 2 (alternative): Sử dụng ANY() - kiểm tra bất kỳ phần tử nào
    -- AND 'marketing' = ANY(d.tags)
    -- Cách 3 (alternative): Sử dụng && (overlap) - có phần tử chung
    -- AND d.tags && ARRAY['marketing']::text[]
    -- Đảm bảo embedding không null
    AND d.embedding IS NOT NULL
ORDER BY 
    -- Sắp xếp theo cosine distance (từ nhỏ đến lớn = từ tương tự đến ít tương tự)
    d.embedding <=> qe.embedding ASC
LIMIT 10;  -- Lấy top 10 documents tương tự nhất


-- ============================================
-- CÁCH 2: Query trên chunk-level embedding
-- ============================================
-- Sử dụng embedding của các chunks, sau đó group by document
-- Phù hợp khi cần tìm chunks tương tự, rồi lấy documents chứa chunks đó

WITH query_embedding AS (
    SELECT $1::vector(1536) AS embedding
),
chunk_scores AS (
    SELECT 
        dc.doc_id,
        dc.chunk_id,
        dc.content,
        -- Cosine similarity score cho chunk
        1 - (dc.embedding <=> qe.embedding) AS similarity_score
    FROM doc_chunks dc
    CROSS JOIN query_embedding qe
    JOIN documents d ON dc.doc_id = d.doc_id
    WHERE 
        d.author = 'John Doe'
        AND d.tags @> ARRAY['marketing']::text[]
        AND dc.embedding IS NOT NULL
    ORDER BY dc.embedding <=> qe.embedding ASC
    LIMIT 50  -- Lấy top 50 chunks tương tự nhất
)
SELECT DISTINCT
    d.doc_id,
    d.title,
    d.author,
    d.published_date,
    d.tags,
    d.url,
    d.description,
    d.created_at,
    -- Lấy similarity score cao nhất của các chunks trong document
    MAX(cs.similarity_score) AS max_chunk_similarity,
    -- Đếm số chunks tương tự trong document
    COUNT(cs.chunk_id) AS matching_chunks_count
FROM documents d
JOIN chunk_scores cs ON d.doc_id = cs.doc_id
WHERE 
    d.author = 'John Doe'
    AND d.tags @> ARRAY['marketing']::text[]
GROUP BY 
    d.doc_id, d.title, d.author, d.published_date, d.tags, d.url, d.description, d.created_at
ORDER BY 
    max_chunk_similarity DESC, matching_chunks_count DESC
LIMIT 10;


-- ============================================
-- CÁCH 3: Query với document-level embedding + aggregate chunk scores
-- ============================================
-- Kết hợp cả document-level và chunk-level similarity

WITH query_embedding AS (
    SELECT $1::vector(1536) AS embedding
),
document_scores AS (
    SELECT 
        d.doc_id,
        d.title,
        d.author,
        d.published_date,
        d.tags,
        d.url,
        d.description,
        d.created_at,
        -- Document-level similarity
        CASE 
            WHEN d.embedding IS NOT NULL 
            THEN 1 - (d.embedding <=> qe.embedding)
            ELSE NULL
        END AS doc_similarity
    FROM documents d
    CROSS JOIN query_embedding qe
    WHERE 
        d.author = 'John Doe'
        AND d.tags @> ARRAY['marketing']::text[]
),
chunk_scores AS (
    SELECT 
        dc.doc_id,
        MAX(1 - (dc.embedding <=> qe.embedding)) AS max_chunk_similarity,
        AVG(1 - (dc.embedding <=> qe.embedding)) AS avg_chunk_similarity
    FROM doc_chunks dc
    CROSS JOIN query_embedding qe
    JOIN documents d ON dc.doc_id = d.doc_id
    WHERE 
        d.author = 'John Doe'
        AND d.tags @> ARRAY['marketing']::text[]
        AND dc.embedding IS NOT NULL
    GROUP BY dc.doc_id
)
SELECT 
    ds.*,
    COALESCE(cs.max_chunk_similarity, 0) AS max_chunk_similarity,
    COALESCE(cs.avg_chunk_similarity, 0) AS avg_chunk_similarity,
    -- Combined score: ưu tiên document-level nếu có, nếu không dùng chunk-level
    COALESCE(ds.doc_similarity, cs.max_chunk_similarity) AS combined_similarity
FROM document_scores ds
LEFT JOIN chunk_scores cs ON ds.doc_id = cs.doc_id
ORDER BY 
    combined_similarity DESC NULLS LAST
LIMIT 10;


-- ============================================
-- VÍ DỤ SỬ DỤNG VỚI PARAMETERS
-- ============================================
-- Trong ứng dụng, bạn sẽ truyền embedding vector như sau:

-- Ví dụ với psql:
-- \set query_embedding '\'[0.1, 0.2, 0.3, ...]\''  -- 1536 dimensions
-- SELECT ... WHERE d.embedding <=> :query_embedding::vector(1536) ...

-- Ví dụ với Node.js/TypeScript:
-- const queryEmbedding = await embed([queryText]);
-- const result = await q(`
--     SELECT ... WHERE d.embedding <=> $1::vector(1536) ...
-- `, [JSON.stringify(queryEmbedding[0])]);


-- ============================================
-- NOTES:
-- ============================================
-- 1. Cosine distance operator: <=> (trả về giá trị từ 0 đến 2)
--    - 0 = hoàn toàn giống nhau
--    - 2 = hoàn toàn khác nhau
-- 2. Cosine similarity: 1 - (embedding1 <=> embedding2)
--    - 1 = hoàn toàn giống nhau
--    - -1 = hoàn toàn khác nhau
-- 3. Tags filter:
--    - @> : array contains (chứa tất cả các giá trị)
--    - && : array overlap (có phần tử chung)
--    - ANY(): kiểm tra bất kỳ phần tử nào
-- 4. Index: Đảm bảo có index trên:
--    - documents.embedding (ivfflat hoặc hnsw)
--    - documents.author
--    - documents.tags (GIN index)

