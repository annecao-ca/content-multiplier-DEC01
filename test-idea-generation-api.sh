#!/bin/bash

echo "🚀 Testing Idea Generation API..."

curl -X POST http://localhost:3001/api/ideas/generate \
  -H "Content-Type: application/json" \
  -d '{
    "persona": "Startup Founders",
    "industry": "SaaS",
    "count": 3,
    "temperature": 0.8
  }'

echo -e "\n\n✅ Request completed."
