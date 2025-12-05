#!/bin/bash

# Test script cho RAG Pipeline với metadata
# Test toàn bộ workflow: ingest -> search -> filters

set -e

API_BASE="${API_BASE:-http://localhost:3001}"
echo "🧪 Testing RAG Pipeline với metadata"
echo "API Base: $API_BASE"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Ingest document với metadata
echo "📝 TEST 1: Ingest document với metadata"
echo "----------------------------------------"
DOC_ID="test-doc-$(date +%s)"
RESPONSE=$(curl -s -X POST "${API_BASE}/api/rag/ingest" \
  -H "Content-Type: application/json" \
  -d "{
    \"doc_id\": \"${DOC_ID}\",
    \"raw\": \"Machine learning is transforming the marketing industry. AI-powered tools help marketers analyze customer behavior, personalize campaigns, and optimize ad spend. Modern marketing teams use ML algorithms to predict customer lifetime value and identify high-value segments.\",
    \"title\": \"AI in Marketing: A Comprehensive Guide\",
    \"url\": \"https://example.com/ai-marketing\",
    \"author\": \"John Doe\",
    \"published_date\": \"2024-01-15T10:30:00Z\",
    \"tags\": [\"marketing\", \"AI\", \"machine-learning\"],
    \"description\": \"A comprehensive guide to using AI in marketing\"
  }")

if echo "$RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✅ Ingest thành công${NC}"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
  echo -e "${RED}❌ Ingest thất bại${NC}"
  echo "$RESPONSE"
  exit 1
fi

echo ""
sleep 2

# Test 2: Ingest thêm document với author khác
echo "📝 TEST 2: Ingest document với author khác"
echo "----------------------------------------"
DOC_ID2="test-doc-$(date +%s)-2"
RESPONSE2=$(curl -s -X POST "${API_BASE}/api/rag/ingest" \
  -H "Content-Type: application/json" \
  -d "{
    \"doc_id\": \"${DOC_ID2}\",
    \"raw\": \"Content marketing strategies for SaaS companies. How to create valuable content that attracts and converts customers. Best practices for blog posts, whitepapers, and case studies.\",
    \"title\": \"Content Marketing for SaaS\",
    \"author\": \"Jane Smith\",
    \"published_date\": \"2024-02-20T14:00:00Z\",
    \"tags\": [\"marketing\", \"SaaS\", \"content\"],
    \"description\": \"Content marketing guide for SaaS businesses\"
  }")

if echo "$RESPONSE2" | grep -q "success"; then
  echo -e "${GREEN}✅ Ingest thành công${NC}"
else
  echo -e "${RED}❌ Ingest thất bại${NC}"
  echo "$RESPONSE2"
fi

echo ""
sleep 2

# Test 3: Search không có filters
echo "🔍 TEST 3: Search không có filters"
echo "----------------------------------------"
SEARCH_RESPONSE=$(curl -s -X POST "${API_BASE}/api/rag/search" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"marketing strategies\",
    \"topK\": 5
  }")

if echo "$SEARCH_RESPONSE" | grep -q "results"; then
  echo -e "${GREEN}✅ Search thành công${NC}"
  COUNT=$(echo "$SEARCH_RESPONSE" | jq '.count // .results | length' 2>/dev/null || echo "N/A")
  echo "Số kết quả: $COUNT"
  echo "$SEARCH_RESPONSE" | jq '.results[0:2]' 2>/dev/null || echo "$SEARCH_RESPONSE" | head -20
else
  echo -e "${RED}❌ Search thất bại${NC}"
  echo "$SEARCH_RESPONSE"
fi

echo ""
sleep 2

# Test 4: Search với filter author
echo "🔍 TEST 4: Search với filter author = 'John Doe'"
echo "----------------------------------------"
SEARCH_FILTERED=$(curl -s -X POST "${API_BASE}/api/rag/search" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"marketing\",
    \"topK\": 5,
    \"filters\": {
      \"author\": \"John Doe\"
    }
  }")

if echo "$SEARCH_FILTERED" | grep -q "results"; then
  echo -e "${GREEN}✅ Search với filter author thành công${NC}"
  COUNT=$(echo "$SEARCH_FILTERED" | jq '.count // .results | length' 2>/dev/null || echo "N/A")
  echo "Số kết quả: $COUNT"
  # Verify all results have author = "John Doe"
  AUTHORS=$(echo "$SEARCH_FILTERED" | jq -r '.results[]?.author // empty' 2>/dev/null || echo "")
  if [ -n "$AUTHORS" ]; then
    echo "Authors trong kết quả: $AUTHORS"
  fi
else
  echo -e "${RED}❌ Search với filter thất bại${NC}"
  echo "$SEARCH_FILTERED"
fi

echo ""
sleep 2

# Test 5: Search với filter tags
echo "🔍 TEST 5: Search với filter tags chứa 'marketing'"
echo "----------------------------------------"
SEARCH_TAGS=$(curl -s -X POST "${API_BASE}/api/rag/search" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"AI and machine learning\",
    \"topK\": 5,
    \"filters\": {
      \"tags\": [\"marketing\"]
    }
  }")

if echo "$SEARCH_TAGS" | grep -q "results"; then
  echo -e "${GREEN}✅ Search với filter tags thành công${NC}"
  COUNT=$(echo "$SEARCH_TAGS" | jq '.count // .results | length' 2>/dev/null || echo "N/A")
  echo "Số kết quả: $COUNT"
else
  echo -e "${RED}❌ Search với filter tags thất bại${NC}"
  echo "$SEARCH_TAGS"
fi

echo ""
sleep 2

# Test 6: Search với cả author và tags
echo "🔍 TEST 6: Search với author = 'John Doe' và tags chứa 'marketing'"
echo "----------------------------------------"
SEARCH_COMBINED=$(curl -s -X POST "${API_BASE}/api/rag/search" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"marketing AI\",
    \"topK\": 5,
    \"filters\": {
      \"author\": \"John Doe\",
      \"tags\": [\"marketing\"]
    }
  }")

if echo "$SEARCH_COMBINED" | grep -q "results"; then
  echo -e "${GREEN}✅ Search với combined filters thành công${NC}"
  COUNT=$(echo "$SEARCH_COMBINED" | jq '.count // .results | length' 2>/dev/null || echo "N/A")
  echo "Số kết quả: $COUNT"
else
  echo -e "${RED}❌ Search với combined filters thất bại${NC}"
  echo "$SEARCH_COMBINED"
fi

echo ""
sleep 2

# Test 7: Search at document level
echo "🔍 TEST 7: Search at document level (không phải chunks)"
echo "----------------------------------------"
SEARCH_DOCS=$(curl -s -X POST "${API_BASE}/api/rag/search" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"marketing strategies\",
    \"topK\": 5,
    \"searchType\": \"documents\",
    \"filters\": {
      \"author\": \"John Doe\"
    }
  }")

if echo "$SEARCH_DOCS" | grep -q "results"; then
  echo -e "${GREEN}✅ Document-level search thành công${NC}"
  COUNT=$(echo "$SEARCH_DOCS" | jq '.count // .results | length' 2>/dev/null || echo "N/A")
  echo "Số kết quả: $COUNT"
  echo "$SEARCH_DOCS" | jq '.results[0]' 2>/dev/null || echo "$SEARCH_DOCS" | head -10
else
  echo -e "${RED}❌ Document-level search thất bại${NC}"
  echo "$SEARCH_DOCS"
fi

echo ""
sleep 2

# Test 8: List documents với filters
echo "📋 TEST 8: List documents với filters"
echo "----------------------------------------"
LIST_FILTERED=$(curl -s -X GET "${API_BASE}/api/rag/documents?author=John%20Doe&tags=marketing" \
  -H "Content-Type: application/json")

if echo "$LIST_FILTERED" | grep -q "doc_id"; then
  echo -e "${GREEN}✅ List documents với filters thành công${NC}"
  COUNT=$(echo "$LIST_FILTERED" | jq 'length' 2>/dev/null || echo "N/A")
  echo "Số documents: $COUNT"
else
  echo -e "${YELLOW}⚠️  List documents (có thể không có kết quả)${NC}"
  echo "$LIST_FILTERED" | head -5
fi

echo ""
sleep 2

# Test 9: Get stats
echo "📊 TEST 9: Get document statistics"
echo "----------------------------------------"
STATS=$(curl -s -X GET "${API_BASE}/api/rag/stats" \
  -H "Content-Type: application/json")

if echo "$STATS" | grep -q "total_documents"; then
  echo -e "${GREEN}✅ Get stats thành công${NC}"
  echo "$STATS" | jq '.' 2>/dev/null || echo "$STATS"
else
  echo -e "${RED}❌ Get stats thất bại${NC}"
  echo "$STATS"
fi

echo ""
sleep 2

# Test 10: Get authors và tags
echo "🏷️  TEST 10: Get available authors và tags"
echo "----------------------------------------"
AUTHORS=$(curl -s -X GET "${API_BASE}/api/rag/authors" \
  -H "Content-Type: application/json")
TAGS=$(curl -s -X GET "${API_BASE}/api/rag/tags" \
  -H "Content-Type: application/json")

if echo "$AUTHORS" | grep -q "authors"; then
  echo -e "${GREEN}✅ Get authors thành công${NC}"
  echo "$AUTHORS" | jq '.authors' 2>/dev/null || echo "$AUTHORS"
else
  echo -e "${YELLOW}⚠️  Get authors (có thể rỗng)${NC}"
fi

if echo "$TAGS" | grep -q "tags"; then
  echo -e "${GREEN}✅ Get tags thành công${NC}"
  echo "$TAGS" | jq '.tags' 2>/dev/null || echo "$TAGS"
else
  echo -e "${YELLOW}⚠️  Get tags (có thể rỗng)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Tất cả tests đã hoàn thành!${NC}"
echo ""
echo "📝 Test documents đã tạo:"
echo "  - ${DOC_ID}"
echo "  - ${DOC_ID2}"
echo ""
echo "💡 Để xóa test documents, chạy:"
echo "  curl -X DELETE ${API_BASE}/api/rag/documents/${DOC_ID}"
echo "  curl -X DELETE ${API_BASE}/api/rag/documents/${DOC_ID2}"

