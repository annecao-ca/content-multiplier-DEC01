#!/bin/bash

# Test script for Document Management API
# Usage: ./test-document-api.sh

API_BASE="http://localhost:8080/rag"

echo "🧪 Testing Document Management API"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Create test document
echo -e "${YELLOW}1. Creating test document...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/documents" \
  -H "Content-Type: application/json" \
  -d '{
    "doc_id": "test-ml-2024",
    "title": "Machine Learning Fundamentals 2024",
    "author": "Dr. Jane Smith",
    "published_date": "2024-01-15",
    "tags": ["AI", "Machine Learning", "Tutorial", "Beginner"],
    "description": "A comprehensive introduction to machine learning concepts",
    "raw": "Machine learning is a subset of artificial intelligence that focuses on building systems that can learn from and make decisions based on data. Unlike traditional programming where explicit rules are defined, machine learning algorithms identify patterns in data. There are three main types: supervised learning (learning from labeled data), unsupervised learning (finding patterns in unlabeled data), and reinforcement learning (learning through trial and error). Common applications include image recognition, natural language processing, and recommendation systems.",
    "url": "https://example.com/ml-fundamentals"
  }')

echo "$CREATE_RESPONSE"
echo -e "${GREEN}✓ Document created${NC}"
echo ""

# Wait a bit for embeddings
sleep 2

# 2. List all documents
echo -e "${YELLOW}2. Listing all documents...${NC}"
curl -s "$API_BASE/documents" | jq '.'
echo -e "${GREEN}✓ Documents listed${NC}"
echo ""

# 3. Get document by ID
echo -e "${YELLOW}3. Getting document by ID...${NC}"
curl -s "$API_BASE/documents/test-ml-2024" | jq '.'
echo -e "${GREEN}✓ Document retrieved${NC}"
echo ""

# 4. Search with similarity
echo -e "${YELLOW}4. Similarity search: 'What is machine learning?'${NC}"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is machine learning?",
    "topK": 3
  }' | jq '.'
echo -e "${GREEN}✓ Search completed${NC}"
echo ""

# 5. Search with author filter
echo -e "${YELLOW}5. Search with author filter...${NC}"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "artificial intelligence",
    "topK": 3,
    "filters": {
      "author": "Dr. Jane Smith"
    }
  }' | jq '.'
echo -e "${GREEN}✓ Filtered search completed${NC}"
echo ""

# 6. Search with tags filter
echo -e "${YELLOW}6. Search with tags filter...${NC}"
curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "learning algorithms",
    "topK": 3,
    "filters": {
      "tags": ["Tutorial", "Beginner"]
    }
  }' | jq '.'
echo -e "${GREEN}✓ Tag filtered search completed${NC}"
echo ""

# 7. Get statistics
echo -e "${YELLOW}7. Getting statistics...${NC}"
curl -s "$API_BASE/stats" | jq '.'
echo -e "${GREEN}✓ Stats retrieved${NC}"
echo ""

# 8. Get authors
echo -e "${YELLOW}8. Getting all authors...${NC}"
curl -s "$API_BASE/authors" | jq '.'
echo -e "${GREEN}✓ Authors retrieved${NC}"
echo ""

# 9. Get tags
echo -e "${YELLOW}9. Getting all tags...${NC}"
curl -s "$API_BASE/tags" | jq '.'
echo -e "${GREEN}✓ Tags retrieved${NC}"
echo ""

# 10. List documents with filter
echo -e "${YELLOW}10. List documents by author...${NC}"
curl -s "$API_BASE/documents?author=Dr.%20Jane%20Smith" | jq '.'
echo -e "${GREEN}✓ Filtered list retrieved${NC}"
echo ""

# 11. Delete document (commented out to preserve data)
# echo -e "${YELLOW}11. Deleting test document...${NC}"
# curl -s -X DELETE "$API_BASE/documents/test-ml-2024" | jq '.'
# echo -e "${GREEN}✓ Document deleted${NC}"
# echo ""

echo "=================================="
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "Note: To delete the test document, run:"
echo "curl -X DELETE $API_BASE/documents/test-ml-2024"










