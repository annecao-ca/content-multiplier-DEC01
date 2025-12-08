#!/bin/bash
# Script chẩn đoán và sửa lỗi Select Idea

set -e
cd /Users/queeniecao/content-multiplier-git/content-multiplier

echo "=========================================="
echo "🔧 CONTENT MULTIPLIER - DIAGNOSTIC SCRIPT"
echo "=========================================="
echo ""

# 1. Kiểm tra .env
echo "📋 Step 1: Checking .env file..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found! Creating..."
    echo "DATABASE_URL=postgresql://cm:cm@localhost:5432/cm" > .env
    echo "✅ Created .env with DATABASE_URL"
else
    if grep -q "DATABASE_URL" .env; then
        echo "✅ .env exists and has DATABASE_URL"
        grep "DATABASE_URL" .env
    else
        echo "⚠️  DATABASE_URL not found in .env! Adding..."
        echo "DATABASE_URL=postgresql://cm:cm@localhost:5432/cm" >> .env
        echo "✅ Added DATABASE_URL to .env"
    fi
fi
echo ""

# 2. Kiểm tra Docker DB
echo "📋 Step 2: Checking Docker DB..."
cd infra
if docker compose ps | grep -q "Up"; then
    echo "✅ Docker DB is running"
else
    echo "⚠️  Docker DB not running! Starting..."
    docker compose up -d
    sleep 3
    echo "✅ Docker DB started"
fi
echo ""

# 3. Kiểm tra bảng ideas
echo "📋 Step 3: Checking 'ideas' table schema..."
docker compose exec -T db psql -U cm -d cm -c "\d ideas" 2>/dev/null || echo "⚠️  Table 'ideas' not found!"
echo ""

# 4. Kiểm tra dữ liệu
echo "📋 Step 4: Checking ideas data..."
docker compose exec -T db psql -U cm -d cm -c "SELECT idea_id, status FROM ideas LIMIT 5;" 2>/dev/null || echo "⚠️  No data or table error"
echo ""

# 5. Lấy 1 idea_id để test
echo "📋 Step 5: Getting a test idea_id..."
IDEA_ID=$(docker compose exec -T db psql -U cm -d cm -t -c "SELECT idea_id FROM ideas LIMIT 1;" 2>/dev/null | tr -d ' \n')
if [ -z "$IDEA_ID" ]; then
    echo "⚠️  No ideas in database. Generate some ideas first!"
else
    echo "✅ Found idea_id: $IDEA_ID"
fi
echo ""

# 6. Kiểm tra port 3001
echo "📋 Step 6: Checking port 3001..."
cd ..
if lsof -i :3001 > /dev/null 2>&1; then
    echo "✅ Something is listening on port 3001:"
    lsof -i :3001 | head -3
else
    echo "⚠️  Nothing listening on port 3001! Backend not running."
fi
echo ""

# 7. Test API select (nếu có idea_id và backend chạy)
if [ -n "$IDEA_ID" ]; then
    echo "📋 Step 7: Testing API select..."
    echo "Calling: POST http://localhost:3001/api/ideas/$IDEA_ID/select"
    curl -s -X POST "http://localhost:3001/api/ideas/$IDEA_ID/select" \
        -H "Content-Type: application/json" \
        -H "x-user-id: demo-user" \
        -H "x-user-role: CL" | head -20
    echo ""
fi
echo ""

echo "=========================================="
echo "📌 SUMMARY & NEXT STEPS"
echo "=========================================="
echo ""
echo "If backend is NOT running on 3001:"
echo "  1. Open a new terminal tab"
echo "  2. Run: cd /Users/queeniecao/content-multiplier-git/content-multiplier && ./start-backend.sh"
echo ""
echo "If frontend is NOT running on 3000:"
echo "  1. Open another terminal tab"  
echo "  2. Run: cd /Users/queeniecao/content-multiplier-git/content-multiplier && ./start-frontend.sh"
echo ""
echo "Then try http://localhost:3000/ideas again!"
echo "=========================================="

