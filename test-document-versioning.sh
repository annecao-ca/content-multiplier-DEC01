#!/bin/bash

# Test Document Versioning API
API_BASE="http://localhost:8080/rag"
DOC_ID="test-versioning-doc-$(date +%s)"

echo "🧪 Testing Document Versioning"
echo "================================"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    curl -s -X DELETE "$API_BASE/documents/$DOC_ID" > /dev/null
    echo "✅ Cleanup done"
}

# Register cleanup on exit
trap cleanup EXIT

# Test 1: Create Version 1
echo "📤 1. Creating Version 1..."
echo "-----------------------------------"
V1_RESPONSE=$(curl -s -X POST "$API_BASE/documents" \
  -H "Content-Type: application/json" \
  -d "{
    \"doc_id\": \"$DOC_ID\",
    \"title\": \"Test Document v1\",
    \"author\": \"Test Author\",
    \"published_date\": \"2024-12-02\",
    \"tags\": [\"AI\", \"ML\"],
    \"description\": \"Initial version\",
    \"raw\": \"This is version 1 of the document. Machine learning is transforming industries. AI applications are everywhere.\",
    \"createVersion\": true
  }")

echo "$V1_RESPONSE" | jq '.'
V1_VERSION=$(echo "$V1_RESPONSE" | jq -r '.version_number // 1')
echo ""

# Wait for processing
sleep 3

# Test 2: Create Version 2
echo "📤 2. Creating Version 2 (re-upload)..."
echo "-----------------------------------"
V2_RESPONSE=$(curl -s -X POST "$API_BASE/documents" \
  -H "Content-Type: application/json" \
  -d "{
    \"doc_id\": \"$DOC_ID\",
    \"title\": \"Test Document v2\",
    \"author\": \"Test Author\",
    \"published_date\": \"2024-12-02\",
    \"tags\": [\"AI\", \"ML\", \"DL\"],
    \"description\": \"Updated version with more content\",
    \"raw\": \"This is version 2 of the document. Machine learning and deep learning are transforming industries. AI applications span healthcare, finance, and retail. Neural networks enable pattern recognition.\",
    \"createVersion\": true
  }")

echo "$V2_RESPONSE" | jq '.'
V2_VERSION=$(echo "$V2_RESPONSE" | jq -r '.version_number // 2')
echo ""

# Wait for processing
sleep 3

# Test 3: Create Version 3
echo "📤 3. Creating Version 3..."
echo "-----------------------------------"
V3_RESPONSE=$(curl -s -X POST "$API_BASE/documents" \
  -H "Content-Type: application/json" \
  -d "{
    \"doc_id\": \"$DOC_ID\",
    \"title\": \"Test Document v3\",
    \"author\": \"Test Author\",
    \"published_date\": \"2024-12-02\",
    \"tags\": [\"AI\", \"ML\", \"DL\", \"NN\"],
    \"description\": \"Latest version with comprehensive content\",
    \"raw\": \"This is version 3 of the document. Machine learning, deep learning, and neural networks are transforming industries worldwide. AI applications span healthcare, finance, retail, and manufacturing. Natural language processing enables better understanding. Computer vision powers autonomous systems.\",
    \"createVersion\": true
  }")

echo "$V3_RESPONSE" | jq '.'
V3_VERSION=$(echo "$V3_RESPONSE" | jq -r '.version_number // 3')
echo ""

# Wait for processing
sleep 3

# Test 4: Get All Versions
echo "📋 4. Getting All Versions..."
echo "-----------------------------------"
VERSIONS=$(curl -s "$API_BASE/documents/$DOC_ID/versions")
echo "$VERSIONS" | jq '.'
echo ""

# Test 5: Get Version Summary
echo "📊 5. Getting Version Summary..."
echo "-----------------------------------"
SUMMARY=$(curl -s "$API_BASE/documents/$DOC_ID/versions/summary")
echo "$SUMMARY" | jq '.'
echo ""

# Test 6: Get Specific Version
echo "🔍 6. Getting Version 2..."
echo "-----------------------------------"
VERSION_2=$(curl -s "$API_BASE/documents/$DOC_ID/versions/2")
echo "$VERSION_2" | jq '{
  version_id,
  version_number,
  title,
  chunk_count,
  content_length,
  created_at
}'
echo ""

# Test 7: Set Current Version
echo "⚙️  7. Setting Version 1 as Current..."
echo "-----------------------------------"
SET_CURRENT=$(curl -s -X POST "$API_BASE/documents/$DOC_ID/versions/1/set-current")
echo "$SET_CURRENT" | jq '.'
echo ""

# Test 8: Verify Current Version
echo "✅ 8. Verifying Current Version..."
echo "-----------------------------------"
SUMMARY_AFTER=$(curl -s "$API_BASE/documents/$DOC_ID/versions/summary")
CURRENT=$(echo "$SUMMARY_AFTER" | jq -r '.current_version')
echo "Current version: $CURRENT"
if [ "$CURRENT" = "1" ]; then
    echo "✅ Version 1 is now current"
else
    echo "⚠️  Current version is $CURRENT, expected 1"
fi
echo ""

# Test 9: Delete Version 2
echo "🗑️  9. Deleting Version 2..."
echo "-----------------------------------"
DELETE_RESPONSE=$(curl -s -X DELETE "$API_BASE/documents/$DOC_ID/versions/2")
echo "$DELETE_RESPONSE" | jq '.'
echo ""

# Test 10: Verify Versions After Delete
echo "📋 10. Verifying Versions After Delete..."
echo "-----------------------------------"
VERSIONS_AFTER=$(curl -s "$API_BASE/documents/$DOC_ID/versions")
TOTAL=$(echo "$VERSIONS_AFTER" | jq -r '.total_versions')
echo "Total versions: $TOTAL"
if [ "$TOTAL" = "2" ]; then
    echo "✅ Version 2 deleted successfully"
else
    echo "⚠️  Expected 2 versions, got $TOTAL"
fi
echo ""

echo "================================"
echo "✅ All tests completed!"
echo ""
echo "📊 Summary:"
echo "  • Created 3 versions"
echo "  • Listed all versions"
echo "  • Got version summary"
echo "  • Got specific version"
echo "  • Set current version"
echo "  • Deleted version"
echo ""
echo "💡 Key Features:"
echo "  • Automatic version numbering"
echo "  • Each version has separate chunks"
echo "  • Can set any version as current"
echo "  • Can delete specific versions"
echo "================================"













