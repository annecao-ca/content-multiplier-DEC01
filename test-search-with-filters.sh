#!/bin/bash

API_BASE="http://localhost:8080/rag"

echo "🎯 TEST SEARCH WITH FILTERS"
echo "============================"
echo ""

# Step 1: Upload multiple test documents
echo "📤 Bước 1: Upload tài liệu test..."
echo "-----------------------------------"

# Document 1: John Doe - Marketing
echo "1️⃣ Uploading: AI in Marketing by John Doe"
curl -s -X POST "$API_BASE/documents" \
  -H "Content-Type: application/json" \
  -d '{
    "doc_id": "test-ai-marketing-john",
    "title": "AI Applications in Marketing",
    "author": "John Doe",
    "published_date": "2024-01-15",
    "tags": ["AI", "Marketing", "Business"],
    "description": "How AI transforms marketing strategies",
    "raw": "Artificial intelligence is revolutionizing marketing. AI-powered tools help marketers analyze customer behavior, personalize campaigns, and predict trends. Machine learning algorithms can segment audiences more effectively. Chatbots powered by AI improve customer service. Content generation using AI saves time and resources. Predictive analytics help optimize marketing budgets and ROI.",
    "url": "https://example.com/ai-marketing"
  }' > /dev/null
echo "✓ Uploaded"

# Document 2: Jane Smith - Marketing
echo "2️⃣ Uploading: Digital Marketing Guide by Jane Smith"
curl -s -X POST "$API_BASE/documents" \
  -H "Content-Type: application/json" \
  -d '{
    "doc_id": "test-digital-marketing-jane",
    "title": "Digital Marketing Complete Guide",
    "author": "Jane Smith",
    "published_date": "2024-02-20",
    "tags": ["Marketing", "Digital", "Strategy"],
    "description": "Comprehensive guide to digital marketing",
    "raw": "Digital marketing encompasses various online channels including social media, email, SEO, and content marketing. Successful campaigns require understanding target audiences and creating engaging content. Analytics tools help measure campaign performance. Social media platforms offer powerful targeting options. Email marketing remains highly effective for customer retention and conversion.",
    "url": "https://example.com/digital-marketing"
  }' > /dev/null
echo "✓ Uploaded"

# Document 3: John Doe - Technology
echo "3️⃣ Uploading: Cloud Computing by John Doe"
curl -s -X POST "$API_BASE/documents" \
  -H "Content-Type: application/json" \
  -d '{
    "doc_id": "test-cloud-computing-john",
    "title": "Cloud Computing Fundamentals",
    "author": "John Doe",
    "published_date": "2024-03-10",
    "tags": ["Cloud", "Technology", "Infrastructure"],
    "description": "Introduction to cloud computing concepts",
    "raw": "Cloud computing provides on-demand access to computing resources. Major providers include AWS, Azure, and Google Cloud. Benefits include scalability, cost efficiency, and flexibility. Cloud services are categorized as IaaS, PaaS, and SaaS. Organizations can migrate workloads to the cloud for better resource management. Security and compliance remain important considerations.",
    "url": "https://example.com/cloud-computing"
  }' > /dev/null
echo "✓ Uploaded"

# Document 4: Mike Johnson - Marketing
echo "4️⃣ Uploading: Content Marketing by Mike Johnson"
curl -s -X POST "$API_BASE/documents" \
  -H "Content-Type: application/json" \
  -d '{
    "doc_id": "test-content-marketing-mike",
    "title": "Content Marketing Best Practices",
    "author": "Mike Johnson",
    "published_date": "2024-04-05",
    "tags": ["Marketing", "Content", "SEO"],
    "description": "Strategies for effective content marketing",
    "raw": "Content marketing focuses on creating valuable content to attract and retain customers. Blog posts, videos, and infographics are popular formats. SEO optimization helps content reach target audiences. Consistent publishing schedules build audience trust. Storytelling techniques make content more engaging. Measuring content performance through analytics guides strategy improvements.",
    "url": "https://example.com/content-marketing"
  }' > /dev/null
echo "✓ Uploaded"

# Wait for processing
echo ""
echo "⏳ Đợi 5 giây để xử lý embeddings..."
sleep 5
echo ""

# Step 2: Test searches with filters
echo "🔍 Bước 2: Test tìm kiếm với filters"
echo "======================================"
echo ""

# Test 1: Search WITHOUT filters (baseline)
echo "📊 TEST 1: Tìm 'marketing' KHÔNG có filter"
echo "-------------------------------------------"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "marketing strategies and campaigns",
    "topK": 5
  }' | jq '.[] | {
    title,
    author,
    tags,
    score: (.score | tonumber | . * 100 | round / 100)
  }'
echo ""

# Test 2: Filter by author "John Doe"
echo "📊 TEST 2: Tìm 'marketing' CHỈ của tác giả 'John Doe'"
echo "------------------------------------------------------"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "marketing strategies and campaigns",
    "topK": 5,
    "filters": {
      "author": "John Doe"
    }
  }' | jq '.[] | {
    title,
    author,
    tags,
    score: (.score | tonumber | . * 100 | round / 100),
    preview: (.content | .[0:80] + "...")
  }'
echo ""

# Test 3: Filter by tag "Marketing"
echo "📊 TEST 3: Tìm 'AI tools' CHỈ có tag 'Marketing'"
echo "-------------------------------------------------"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "AI tools and technology",
    "topK": 5,
    "filters": {
      "tags": ["Marketing"]
    }
  }' | jq '.[] | {
    title,
    author,
    tags,
    score: (.score | tonumber | . * 100 | round / 100)
  }'
echo ""

# Test 4: Filter by author AND tags
echo "📊 TEST 4: Tìm 'technology' của 'John Doe' VÀ tag 'Technology'"
echo "---------------------------------------------------------------"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "technology and computing",
    "topK": 5,
    "filters": {
      "author": "John Doe",
      "tags": ["Technology"]
    }
  }' | jq '.[] | {
    title,
    author,
    tags,
    score: (.score | tonumber | . * 100 | round / 100)
  }'
echo ""

# Test 5: Filter by multiple tags
echo "📊 TEST 5: Tìm tài liệu có tag 'Marketing' HOẶC 'Business'"
echo "-----------------------------------------------------------"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "business strategies",
    "topK": 5,
    "filters": {
      "tags": ["Marketing", "Business"]
    }
  }' | jq '.[] | {
    title,
    author,
    tags,
    score: (.score | tonumber | . * 100 | round / 100)
  }'
echo ""

# Test 6: Filter by date range
echo "📊 TEST 6: Tìm tài liệu xuất bản sau 01/03/2024"
echo "-----------------------------------------------"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "marketing content",
    "topK": 5,
    "filters": {
      "published_after": "2024-03-01"
    }
  }' | jq '.[] | {
    title,
    author,
    published_date,
    score: (.score | tonumber | . * 100 | round / 100)
  }'
echo ""

# Test 7: Complex filters
echo "📊 TEST 7: Filter phức tạp (Author + Tags + Date)"
echo "--------------------------------------------------"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "AI and marketing",
    "topK": 5,
    "filters": {
      "author": "John Doe",
      "tags": ["Marketing", "AI"],
      "published_after": "2024-01-01",
      "published_before": "2024-12-31"
    }
  }' | jq '.[] | {
    title,
    author,
    published_date,
    tags,
    score: (.score | tonumber | . * 100 | round / 100)
  }'
echo ""

# Summary
echo "======================================"
echo "✅ HOÀN THÀNH TEST FILTERS"
echo "======================================"
echo ""
echo "📋 TÓM TẮT:"
echo "   - Test 1: No filter → Tất cả tài liệu liên quan"
echo "   - Test 2: Author filter → Chỉ John Doe"
echo "   - Test 3: Tag filter → Chỉ Marketing"
echo "   - Test 4: Author + Tag → Giao của cả 2"
echo "   - Test 5: Multiple tags → Có 1 trong các tags"
echo "   - Test 6: Date filter → Sau ngày cụ thể"
echo "   - Test 7: Complex → Kết hợp nhiều filters"
echo ""
echo "🧹 Để xóa test data:"
echo "   curl -X DELETE $API_BASE/documents/test-ai-marketing-john"
echo "   curl -X DELETE $API_BASE/documents/test-digital-marketing-jane"
echo "   curl -X DELETE $API_BASE/documents/test-cloud-computing-john"
echo "   curl -X DELETE $API_BASE/documents/test-content-marketing-mike"










