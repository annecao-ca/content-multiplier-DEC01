#!/bin/bash
# Script để chạy tất cả migrations

set -e

DB_URL="${DATABASE_URL:-postgresql://cm:cm@localhost:5432/cm}"

echo "🚀 Running migrations..."
echo "Database: $DB_URL"
echo ""

# Check if using Docker
if docker ps | grep -q infra-db-1; then
    echo "📦 Using Docker..."
    PREFIX="docker exec -i infra-db-1 psql -U cm -d cm"
elif command -v psql &> /dev/null; then
    echo "💻 Using direct psql..."
    PREFIX="psql $DB_URL"
else
    echo "❌ psql not found. Please install PostgreSQL client or use Docker."
    exit 1
fi

# Run migrations in order
MIGRATIONS=(
    "infra/migrations/001_init.sql"
    "infra/migrations/007_extend_documents.sql"
    "infra/migrations/009_add_vector_to_documents.sql"
    "infra/migrations/010_extend_documents_metadata.sql"
    "infra/migrations/011_update_embedding_dimensions.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        echo "📝 Running $migration..."
        $PREFIX -f "$migration" 2>&1 | grep -v "NOTICE" || true
        echo "✅ $migration completed"
        echo ""
    else
        echo "⚠️  $migration not found, skipping..."
    fi
done

echo "✅ All migrations completed!"
echo ""
echo "🔍 Verifying schema..."
$PREFIX -c "\d documents" 2>&1 | head -20
