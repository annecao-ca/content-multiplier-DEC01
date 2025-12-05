-- =======================================
-- KIỂM TRA TÀI LIỆU VỪA UPLOAD
-- =======================================

\echo '📄 1. CHI TIẾT TÀI LIỆU MỚI:'
\echo '=================================='
SELECT 
    doc_id AS "ID",
    title AS "Tiêu đề",
    author AS "Tác giả",
    published_date AS "Ngày xuất bản",
    tags AS "Chủ đề",
    description AS "Mô tả",
    created_at AS "Ngày tạo"
FROM documents
WHERE doc_id = 'test-vietnam-ai-2024';

\echo ''
\echo '📚 2. DANH SÁCH TẤT CẢ TÀI LIỆU:'
\echo '=================================='
SELECT 
    doc_id AS "ID",
    title AS "Tiêu đề",
    author AS "Tác giả",
    published_date AS "Ngày xuất bản",
    array_length(tags, 1) AS "Số tags",
    created_at AS "Ngày tạo"
FROM documents
ORDER BY created_at DESC;

\echo ''
\echo '🔢 3. CHUNKS CỦA TÀI LIỆU MỚI:'
\echo '=================================='
SELECT 
    chunk_id AS "Chunk ID",
    LEFT(content, 100) || '...' AS "Nội dung (100 ký tự đầu)",
    LENGTH(content) AS "Độ dài"
FROM doc_chunks
WHERE doc_id = 'test-vietnam-ai-2024'
ORDER BY chunk_id;

\echo ''
\echo '📊 4. THỐNG KÊ:'
\echo '=================================='
SELECT 
    COUNT(DISTINCT d.doc_id) AS "Tổng số tài liệu",
    COUNT(dc.chunk_id) AS "Tổng số chunks",
    COUNT(DISTINCT d.author) AS "Số tác giả",
    array_length(array_agg(DISTINCT unnest(d.tags)), 1) AS "Số tags"
FROM documents d
LEFT JOIN doc_chunks dc ON d.doc_id = dc.doc_id;

\echo ''
\echo '🏷️ 5. TẤT CẢ TAGS:'
\echo '=================================='
SELECT DISTINCT unnest(tags) AS "Tag"
FROM documents
WHERE tags IS NOT NULL
ORDER BY 1;

\echo ''
\echo '✅ KIỂM TRA HOÀN TẤT!'








