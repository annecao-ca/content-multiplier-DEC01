#!/bin/bash
# Script đơn giản để chạy migration 010 (metadata extension)

set -e

echo "🚀 Chạy Migration 010: Extend Documents Metadata"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Kiểm tra database connection
check_db() {
    if docker ps | grep -q infra-db-1; then
        echo "✅ Database Docker container đang chạy"
        return 0
    elif command -v psql &> /dev/null; then
        if psql "${DATABASE_URL:-postgresql://cm:cm@localhost:5432/cm}" -c "SELECT 1" &> /dev/null; then
            echo "✅ Database connection OK"
            return 0
        fi
    fi
    return 1
}

# Chạy migration
run_migration() {
    MIGRATION_FILE="infra/migrations/010_extend_documents_metadata.sql"
    
    if [ ! -f "$MIGRATION_FILE" ]; then
        echo "❌ Không tìm thấy file: $MIGRATION_FILE"
        exit 1
    fi
    
    echo "📝 Đang chạy migration: $MIGRATION_FILE"
    echo ""
    
    if docker ps | grep -q infra-db-1; then
        # Sử dụng Docker
        echo "📦 Sử dụng Docker..."
        docker exec -i infra-db-1 psql -U cm -d cm < "$MIGRATION_FILE"
    else
        # Sử dụng psql trực tiếp
        echo "💻 Sử dụng psql trực tiếp..."
        DB_URL="${DATABASE_URL:-postgresql://cm:cm@localhost:5432/cm}"
        psql "$DB_URL" -f "$MIGRATION_FILE"
    fi
}

# Verify migration
verify() {
    echo ""
    echo "🔍 Kiểm tra kết quả..."
    echo ""
    
    if docker ps | grep -q infra-db-1; then
        PREFIX="docker exec -i infra-db-1 psql -U cm -d cm"
    else
        DB_URL="${DATABASE_URL:-postgresql://cm:cm@localhost:5432/cm}"
        PREFIX="psql $DB_URL"
    fi
    
    echo "📊 Các cột metadata:"
    $PREFIX -c "
    SELECT 
        column_name, 
        data_type,
        is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name IN ('author', 'published_date', 'tags', 'embedding')
    ORDER BY column_name;
    " 2>&1 | grep -v "NOTICE" || true
    
    echo ""
    echo "📑 Indexes:"
    $PREFIX -c "
    SELECT indexname
    FROM pg_indexes 
    WHERE tablename = 'documents'
    AND indexname LIKE 'idx_documents%'
    ORDER BY indexname;
    " 2>&1 | grep -v "NOTICE" || true
}

# Main
main() {
    if ! check_db; then
        echo "❌ Không thể kết nối database"
        echo ""
        echo "💡 Hãy đảm bảo:"
        echo "   1. Database đang chạy (Docker hoặc PostgreSQL server)"
        echo "   2. DATABASE_URL được set đúng"
        echo "   3. Hoặc chạy: docker compose -f infra/docker-compose.yml up -d"
        exit 1
    fi
    
    echo ""
    run_migration
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Migration hoàn thành!"
        verify
        echo ""
        echo "🎉 Database đã sẵn sàng cho RAG pipeline với metadata!"
    else
        echo ""
        echo "❌ Migration thất bại. Vui lòng kiểm tra lỗi ở trên."
        exit 1
    fi
}

main





