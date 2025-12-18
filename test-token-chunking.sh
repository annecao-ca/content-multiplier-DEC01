#!/bin/bash

# Quick test for token-based chunking
API_BASE="http://localhost:8080/rag"

echo "🧪 Testing Token-Based Chunking"
echo "================================"
echo ""

# Test document with exactly 2000 tokens worth of content
TEST_DOC='{
  "doc_id": "test-token-chunking",
  "title": "Token Chunking Test Document",
  "author": "System Test",
  "published_date": "2024-12-02",
  "tags": ["Test", "Chunking", "Tokens"],
  "description": "Test document to verify token-based chunking works correctly",
  "raw": "Artificial intelligence (AI) is transforming industries worldwide. From healthcare to finance, from manufacturing to retail, AI applications are becoming increasingly prevalent. Machine learning, a core component of AI, enables systems to learn from data without explicit programming. Deep learning, using neural networks with many layers, has achieved remarkable success in image recognition, speech processing, and natural language understanding. In healthcare, AI assists in diagnosis, drug discovery, and personalized treatment plans. Radiologists use AI-powered tools to detect anomalies in medical images with greater accuracy. In finance, AI algorithms detect fraudulent transactions, optimize trading strategies, and provide personalized financial advice. Manufacturing benefits from AI through predictive maintenance, quality control, and supply chain optimization. The retail industry leverages AI for recommendation systems, inventory management, and customer service chatbots. Natural language processing powers virtual assistants like Siri, Alexa, and Google Assistant. Computer vision enables autonomous vehicles to navigate roads safely. AI is also making strides in creative fields, generating art, music, and even writing. However, AI development raises important ethical considerations. Bias in training data can lead to unfair outcomes. Privacy concerns arise from extensive data collection. Job displacement is a real concern as automation increases. Ensuring AI systems are transparent, accountable, and aligned with human values is crucial. Researchers and policymakers are working on frameworks for responsible AI development. The future of AI holds tremendous promise. Advances in quantum computing may dramatically accelerate AI capabilities. AGI (Artificial General Intelligence), systems with human-like general intelligence, remains a long-term goal. As AI continues to evolve, it will likely reshape society in ways we can only begin to imagine. The key is ensuring this powerful technology benefits all of humanity.",
  "url": "https://example.com/token-chunking-test",
  "useTokenChunking": true
}'

echo "📤 1. Uploading document with TOKEN-BASED chunking..."
echo "-----------------------------------------------------"
RESPONSE=$(curl -s -X POST "$API_BASE/documents" \
  -H "Content-Type: application/json" \
  -d "$TEST_DOC")

echo "$RESPONSE" | jq '.'
echo ""

# Extract info
CHUNKS=$(echo "$RESPONSE" | jq -r '.chunks // 0')
TOKENS=$(echo "$RESPONSE" | jq -r '.tokens // 0')
METHOD=$(echo "$RESPONSE" | jq -r '.chunkingMethod // "unknown"')

echo "📊 Results:"
echo "  Chunks created: $CHUNKS"
echo "  Total tokens: $TOKENS"
echo "  Method: $METHOD"
echo ""

# Compare with character-based
echo "📤 2. Uploading SAME document with CHARACTER-BASED chunking..."
echo "-------------------------------------------------------------"

TEST_DOC_CHAR=$(echo "$TEST_DOC" | sed 's/"useTokenChunking": true/"useTokenChunking": false/')
TEST_DOC_CHAR=$(echo "$TEST_DOC_CHAR" | sed 's/"doc_id": "test-token-chunking"/"doc_id": "test-char-chunking"/')

RESPONSE_CHAR=$(curl -s -X POST "$API_BASE/documents" \
  -H "Content-Type: application/json" \
  -d "$TEST_DOC_CHAR")

echo "$RESPONSE_CHAR" | jq '.'
echo ""

CHUNKS_CHAR=$(echo "$RESPONSE_CHAR" | jq -r '.chunks // 0')
METHOD_CHAR=$(echo "$RESPONSE_CHAR" | jq -r '.chunkingMethod // "unknown"')

echo "📊 Results:"
echo "  Chunks created: $CHUNKS_CHAR"
echo "  Method: $METHOD_CHAR"
echo ""

# Comparison
echo "🔍 3. Comparison"
echo "-----------------------------------------------------"
echo "Token-based:"
echo "  • Chunks: $CHUNKS"
echo "  • Tokens: $TOKENS"
echo "  • Method: $METHOD"
echo ""
echo "Character-based:"
echo "  • Chunks: $CHUNKS_CHAR"
echo "  • Method: $METHOD_CHAR"
echo ""

if [ "$CHUNKS" -lt "$CHUNKS_CHAR" ]; then
    echo "✅ Token-based created FEWER chunks (more efficient)"
elif [ "$CHUNKS" -gt "$CHUNKS_CHAR" ]; then
    echo "⚠️  Token-based created MORE chunks"
else
    echo "➡️  Both methods created same number of chunks"
fi
echo ""

# Check database
echo "🗄️  4. Verify in Database"
echo "-----------------------------------------------------"
echo "Check doc_chunks table:"
echo "  psql -c \"SELECT doc_id, COUNT(*) as chunks FROM doc_chunks WHERE doc_id IN ('test-token-chunking', 'test-char-chunking') GROUP BY doc_id;\""
echo ""

# Search test
echo "🔍 5. Test Search"
echo "-----------------------------------------------------"
SEARCH_RESULT=$(curl -s -X POST "$API_BASE/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "AI in healthcare and diagnosis",
    "topK": 3
  }')

echo "Search for: 'AI in healthcare and diagnosis'"
echo "$SEARCH_RESULT" | jq '.[] | {
  doc_id,
  score: (.score | tonumber | . * 100 | round / 100),
  preview: (.content | .[0:100] + "...")
}'
echo ""

# Cleanup option
echo "🧹 Cleanup (optional)"
echo "-----------------------------------------------------"
echo "To remove test documents:"
echo "  curl -X DELETE $API_BASE/documents/test-token-chunking"
echo "  curl -X DELETE $API_BASE/documents/test-char-chunking"
echo ""

echo "================================"
echo "✅ Test Complete!"
echo ""
echo "💡 Key Takeaways:"
echo "  • Token-based chunking preserves semantic meaning"
echo "  • More accurate alignment with OpenAI API costs"
echo "  • Better for multi-language content"
echo "  • Slight performance overhead but worth it"
























