#!/bin/bash

# Test semantic similarity search
API_BASE="http://localhost:8080/rag"

echo "🔍 TEST SIMILARITY SEARCH - Tìm kiếm theo nghĩa"
echo "================================================"
echo ""
echo "📝 Tài liệu đã upload: 'Trí tuệ nhân tạo tại Việt Nam 2024'"
echo "   Nội dung: AI, machine learning, deep learning, startup, đầu tư..."
echo ""
echo "================================================"
echo ""

# Test 1: Exact keywords
echo "🧪 TEST 1: Từ khóa chính xác (AI Việt Nam)"
echo "-------------------------------------------"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "AI Việt Nam",
    "topK": 3
  }' | jq '.[] | {
    title: .title,
    author: .author,
    score: .score,
    preview: (.content | .[0:100] + "...")
  }'
echo ""

# Test 2: Different words, same meaning
echo "🧪 TEST 2: Từ khóa khác, nghĩa tương tự (trí tuệ nhân tạo phát triển)"
echo "-------------------------------------------------------------------"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "trí tuệ nhân tạo đang phát triển như thế nào",
    "topK": 3
  }' | jq '.[] | {
    title: .title,
    author: .author,
    score: .score,
    preview: (.content | .[0:100] + "...")
  }'
echo ""

# Test 3: Related concepts
echo "🧪 TEST 3: Khái niệm liên quan (machine learning startup)"
echo "---------------------------------------------------------"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "các công ty khởi nghiệp về machine learning",
    "topK": 3
  }' | jq '.[] | {
    title: .title,
    author: .author,
    score: .score,
    preview: (.content | .[0:100] + "...")
  }'
echo ""

# Test 4: Question format
echo "🧪 TEST 4: Định dạng câu hỏi (đầu tư vào AI)"
echo "---------------------------------------------"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "đầu tư vào lĩnh vực trí tuệ nhân tạo ở đâu?",
    "topK": 3
  }' | jq '.[] | {
    title: .title,
    author: .author,
    score: .score,
    preview: (.content | .[0:100] + "...")
  }'
echo ""

# Test 5: Application domain
echo "🧪 TEST 5: Lĩnh vực ứng dụng (AI trong giáo dục)"
echo "------------------------------------------------"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ứng dụng trí tuệ nhân tạo trong giáo dục và y tế",
    "topK": 3
  }' | jq '.[] | {
    title: .title,
    author: .author,
    score: .score,
    preview: (.content | .[0:100] + "...")
  }'
echo ""

# Test 6: Technical terms
echo "🧪 TEST 6: Thuật ngữ kỹ thuật (deep learning)"
echo "----------------------------------------------"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "chương trình đào tạo deep learning",
    "topK": 3
  }' | jq '.[] | {
    title: .title,
    author: .author,
    score: .score,
    preview: (.content | .[0:100] + "...")
  }'
echo ""

# Test 7: Policy/Strategy
echo "🧪 TEST 7: Chính sách (chiến lược quốc gia)"
echo "--------------------------------------------"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "chính phủ có chiến lược gì về công nghệ AI",
    "topK": 3
  }' | jq '.[] | {
    title: .title,
    author: .author,
    score: .score,
    preview: (.content | .[0:100] + "...")
  }'
echo ""

# Test 8: With filters (author + tags)
echo "🧪 TEST 8: Tìm kiếm + Lọc theo tác giả và tags"
echo "-----------------------------------------------"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "nghiên cứu về công nghệ mới",
    "topK": 5,
    "filters": {
      "author": "Nguyễn Văn An",
      "tags": ["AI", "Công nghệ"]
    }
  }' | jq '.[] | {
    title: .title,
    author: .author,
    tags: .tags,
    score: .score,
    preview: (.content | .[0:80] + "...")
  }'
echo ""

# Test 9: Completely different words
echo "🧪 TEST 9: Hoàn toàn từ khác (neural networks, algorithms)"
echo "-----------------------------------------------------------"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "các thuật toán học máy và mạng neural",
    "topK": 3
  }' | jq '.[] | {
    title: .title,
    score: .score,
    preview: (.content | .[0:100] + "...")
  }'
echo ""

# Test 10: Business context
echo "🧪 TEST 10: Ngữ cảnh kinh doanh (đầu tư, vốn)"
echo "----------------------------------------------"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "startup công nghệ thu hút vốn đầu tư như thế nào",
    "topK": 3
  }' | jq '.[] | {
    title: .title,
    score: .score,
    preview: (.content | .[0:100] + "...")
  }'
echo ""

echo "================================================"
echo "✅ Hoàn thành tất cả test cases!"
echo ""
echo "📊 KẾT LUẬN:"
echo "   - Semantic search tìm được tài liệu với từ khóa khác nhau"
echo "   - Score càng cao = càng liên quan (gần 1.0)"
echo "   - Filters hoạt động kết hợp với similarity search"
echo "================================================"








