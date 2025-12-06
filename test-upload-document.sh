#!/bin/bash

# Test upload document with full metadata
API_BASE="http://localhost:8080/rag"

echo "📤 Đang tải lên tài liệu mới..."
echo "=================================="
echo ""

# Upload document
RESPONSE=$(curl -s -X POST "$API_BASE/documents" \
  -H "Content-Type: application/json" \
  -d '{
    "doc_id": "test-vietnam-ai-2024",
    "title": "Trí tuệ nhân tạo tại Việt Nam 2024",
    "author": "Nguyễn Văn An",
    "published_date": "2024-12-02",
    "tags": ["AI", "Việt Nam", "Công nghệ", "Nghiên cứu"],
    "description": "Tổng quan về tình hình phát triển AI tại Việt Nam năm 2024",
    "raw": "Trí tuệ nhân tạo (AI) đang phát triển mạnh mẽ tại Việt Nam. Nhiều công ty công nghệ đã đầu tư vào nghiên cứu và phát triển các giải pháp AI. Các trường đại học cũng đã mở nhiều chương trình đào tạo về machine learning và deep learning. Chính phủ Việt Nam đã ban hành chiến lược quốc gia về AI, nhằm thúc đẩy ứng dụng AI trong các lĩnh vực như y tế, giáo dục, nông nghiệp và giao thông. Startup AI tại Việt Nam đang thu hút nhiều vốn đầu tư từ trong và ngoài nước.",
    "url": "https://example.com/vietnam-ai-2024"
  }')

echo "Kết quả upload:"
echo "$RESPONSE" | jq '.'
echo ""

# Wait for processing
echo "⏳ Đang xử lý chunking và embeddings..."
sleep 3
echo ""

# List all documents
echo "📋 Danh sách tất cả tài liệu:"
echo "=================================="
curl -s "$API_BASE/documents" | jq '.[] | {
  doc_id,
  title,
  author,
  published_date,
  tags,
  created_at
}'
echo ""

# Get specific document
echo "📄 Chi tiết tài liệu vừa tải lên:"
echo "=================================="
curl -s "$API_BASE/documents/test-vietnam-ai-2024" | jq '.'
echo ""

# Get stats
echo "📊 Thống kê hệ thống:"
echo "=================================="
curl -s "$API_BASE/stats" | jq '.'
echo ""

echo "✅ Test hoàn tất!"










