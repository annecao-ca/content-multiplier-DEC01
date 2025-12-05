# Hướng dẫn Chạy Migration

## 📋 Tổng quan

Hướng dẫn này giải thích cách chạy các migration SQL để cập nhật database schema cho RAG pipeline với metadata support.

---

## 🎯 Migration cần chạy

Các migration files theo thứ tự:

1. `001_init.sql` - Tạo bảng documents cơ bản
2. `007_extend_documents.sql` - Thêm metadata columns (có thể đã có)
3. `009_add_vector_to_documents.sql` - Thêm embedding column
4. `010_extend_documents_metadata.sql` - **MỚI** - Đảm bảo metadata columns đúng type

---

## ⚡ Cách nhanh nhất: Dùng Script tự động

### Chạy migration 010 (chỉ migration mới)

```bash
# Từ thư mục gốc project
./run-migration-010.sh
```

Script này sẽ:
- ✅ Tự động phát hiện Docker hoặc psql
- ✅ Chạy migration 010
- ✅ Verify kết quả
- ✅ Hiển thị schema sau khi chạy

### Chạy tất cả migrations

```bash
# Chạy tất cả migrations theo thứ tự
./run-migrations.sh
```

---

## 🔧 Cách 1: Chạy với psql (Trực tiếp)

### Bước 1: Kiểm tra kết nối database

```bash
# Kiểm tra DATABASE_URL
echo $DATABASE_URL

# Hoặc nếu dùng connection string riêng
# postgresql://user:password@host:port/database
```

### Bước 2: Chạy từng migration

```bash
# Từ thư mục gốc của project
cd /Users/queeniecao/content-multiplier-git/content-multiplier

# Chạy migration 001 (nếu chưa chạy)
psql $DATABASE_URL -f infra/migrations/001_init.sql

# Chạy migration 007 (nếu chưa chạy)
psql $DATABASE_URL -f infra/migrations/007_extend_documents.sql

# Chạy migration 009 (nếu chưa chạy)
psql $DATABASE_URL -f infra/migrations/009_add_vector_to_documents.sql

# Chạy migration 010 (MỚI - bắt buộc)
psql $DATABASE_URL -f infra/migrations/010_extend_documents_metadata.sql
```

### Bước 3: Kiểm tra kết quả

```bash
# Kiểm tra các cột đã được thêm
psql $DATABASE_URL -c "\d documents"

# Kiểm tra indexes
psql $DATABASE_URL -c "\d+ documents" | grep -i index
```

---

## 🐳 Cách 2: Chạy với Docker Compose

### Bước 1: Khởi động database

```bash
cd /Users/queeniecao/content-multiplier-git/content-multiplier

# Khởi động PostgreSQL với pgvector
docker compose -f infra/docker-compose.yml up -d
```

### Bước 2: Chạy migrations

```bash
# Chạy migration 001
docker exec -i infra-db-1 psql -U cm -d cm < infra/migrations/001_init.sql

# Chạy migration 007
docker exec -i infra-db-1 psql -U cm -d cm < infra/migrations/007_extend_documents.sql

# Chạy migration 009
docker exec -i infra-db-1 psql -U cm -d cm < infra/migrations/009_add_vector_to_documents.sql

# Chạy migration 010 (MỚI)
docker exec -i infra-db-1 psql -U cm -d cm < infra/migrations/010_extend_documents_metadata.sql
```

### Bước 3: Kiểm tra

```bash
# Kiểm tra schema
docker exec -i infra-db-1 psql -U cm -d cm -c "\d documents"

# Kiểm tra pgvector extension
docker exec -i infra-db-1 psql -U cm -d cm -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

---

## 📜 Cách 3: Tạo Script tự động

Tạo script để chạy tất cả migrations:

```bash
#!/bin/bash
# run-migrations.sh

set -e

DB_URL="${DATABASE_URL:-postgresql://cm:cm@localhost:5432/cm}"

echo "🚀 Running migrations..."
echo "Database: $DB_URL"
echo ""

# Check if using Docker
if docker ps | grep -q infra-db-1; then
    echo "📦 Using Docker..."
    PREFIX="docker exec -i infra-db-1 psql -U cm -d cm"
else
    echo "💻 Using direct psql..."
    PREFIX="psql $DB_URL"
fi

# Run migrations in order
MIGRATIONS=(
    "infra/migrations/001_init.sql"
    "infra/migrations/007_extend_documents.sql"
    "infra/migrations/009_add_vector_to_documents.sql"
    "infra/migrations/010_extend_documents_metadata.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        echo "📝 Running $migration..."
        $PREFIX -f "$migration"
        echo "✅ $migration completed"
        echo ""
    else
        echo "⚠️  $migration not found, skipping..."
    fi
done

echo "✅ All migrations completed!"
echo ""
echo "🔍 Verifying schema..."
$PREFIX -c "\d documents"
```

**Sử dụng:**
```bash
chmod +x run-migrations.sh
./run-migrations.sh
```

---

## 🔍 Cách 4: Chạy từng migration và kiểm tra

### Kiểm tra trạng thái hiện tại

```bash
# Kiểm tra các cột hiện có
psql $DATABASE_URL -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents' 
ORDER BY ordinal_position;
"

# Kiểm tra pgvector extension
psql $DATABASE_URL -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

### Chạy migration 010 (chỉ migration mới)

```bash
# Migration 010 an toàn khi chạy nhiều lần (dùng IF NOT EXISTS)
psql $DATABASE_URL -f infra/migrations/010_extend_documents_metadata.sql
```

### Verify sau khi chạy

```bash
# Kiểm tra các cột metadata
psql $DATABASE_URL -c "
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'documents' 
AND column_name IN ('author', 'published_date', 'tags')
ORDER BY column_name;
"

# Kiểm tra indexes
psql $DATABASE_URL -c "
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'documents'
AND indexname LIKE 'idx_documents%';
"
```

---

## ⚠️ Lưu ý quan trọng

### 1. Backup trước khi chạy migration

```bash
# Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Migration 010 an toàn

Migration `010_extend_documents_metadata.sql` sử dụng `IF NOT EXISTS`, nên:
- ✅ An toàn chạy nhiều lần
- ✅ Không ảnh hưởng dữ liệu hiện có
- ✅ Tự động convert DATE → TIMESTAMPTZ nếu cần

### 3. Kiểm tra pgvector extension

```bash
# Nếu chưa có, migration 010 sẽ tự động tạo
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

---

## 🧪 Test sau khi chạy migration

### Test 1: Kiểm tra schema

```bash
psql $DATABASE_URL -c "\d documents"
```

**Kết quả mong đợi:**
```
Column          | Type           | Nullable
----------------+----------------+----------
doc_id          | text           | not null
title           | text           | 
url             | text           | 
raw             | text           | 
embedding       | vector(1536)   | ✅
author          | text           | ✅ NEW
published_date  | timestamp with time zone | ✅ NEW
tags            | text[]         | ✅ NEW
description     | text           | 
created_at      | timestamp with time zone | 
updated_at      | timestamp with time zone | 
```

### Test 2: Test insert với metadata

```bash
psql $DATABASE_URL -c "
INSERT INTO documents (doc_id, title, author, published_date, tags, raw)
VALUES (
    'test-migration-001',
    'Test Document',
    'John Doe',
    '2024-01-15T10:30:00Z'::TIMESTAMPTZ,
    ARRAY['test', 'migration'],
    'Test content'
)
ON CONFLICT (doc_id) DO NOTHING;

SELECT doc_id, title, author, published_date, tags 
FROM documents 
WHERE doc_id = 'test-migration-001';
"
```

### Test 3: Test query với filters

```bash
psql $DATABASE_URL -c "
SELECT 
    doc_id,
    title,
    author,
    published_date,
    tags
FROM documents
WHERE 
    author = 'John Doe'
    AND tags @> ARRAY['test']::text[]
LIMIT 5;
"
```

---

## 🐛 Troubleshooting

### Lỗi: "extension vector does not exist"

```bash
# Tạo extension pgvector
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Lỗi: "column already exists"

Migration 010 sử dụng `IF NOT EXISTS`, nên không nên gặp lỗi này. Nếu có, có thể bỏ qua.

### Lỗi: "cannot cast type date to timestamp with time zone"

Migration 010 tự động convert DATE → TIMESTAMPTZ. Nếu vẫn lỗi:

```bash
# Manual conversion
psql $DATABASE_URL -c "
ALTER TABLE documents 
ALTER COLUMN published_date TYPE TIMESTAMPTZ 
USING published_date::TIMESTAMPTZ;
"
```

### Lỗi: "permission denied"

```bash
# Đảm bảo user có quyền
psql $DATABASE_URL -c "GRANT ALL ON TABLE documents TO current_user;"
```

---

## 📝 Quick Reference

### ⚡ Cách nhanh nhất (Khuyến nghị)

```bash
# Script tự động - phát hiện Docker hoặc psql
./run-migration-010.sh
```

### Chạy migration nhanh (Docker)

```bash
docker exec -i infra-db-1 psql -U cm -d cm < infra/migrations/010_extend_documents_metadata.sql
```

### Chạy migration nhanh (psql)

```bash
psql $DATABASE_URL -f infra/migrations/010_extend_documents_metadata.sql
```

### Chạy tất cả migrations

```bash
./run-migrations.sh
```

### Kiểm tra schema

```bash
psql $DATABASE_URL -c "\d documents"
```

### Kiểm tra indexes

```bash
psql $DATABASE_URL -c "\d+ documents" | grep index
```

---

## ✅ Checklist

Sau khi chạy migration, đảm bảo:

- [ ] pgvector extension đã được enable
- [ ] Cột `author` tồn tại (TEXT)
- [ ] Cột `published_date` tồn tại (TIMESTAMPTZ)
- [ ] Cột `tags` tồn tại (TEXT[])
- [ ] Cột `embedding` tồn tại (vector(1536))
- [ ] Indexes đã được tạo:
  - [ ] idx_documents_embedding
  - [ ] idx_documents_author
  - [ ] idx_documents_published_date
  - [ ] idx_documents_tags
- [ ] Test insert với metadata thành công
- [ ] Test query với filters thành công

---

## 🎯 Kết luận

Sau khi chạy migration `010_extend_documents_metadata.sql`, database đã sẵn sàng cho:
- ✅ Upload documents với metadata
- ✅ Search với filters (author, tags, date)
- ✅ Document-level và chunk-level search
- ✅ Hiển thị metadata trong UI

Pipeline RAG với metadata support đã sẵn sàng sử dụng! 🚀

