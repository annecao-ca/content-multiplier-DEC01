#!/bin/bash

# Paste Page Access Token vào đây (thay YOUR_PAGE_ACCESS_TOKEN):
PAGE_TOKEN="YOUR_PAGE_ACCESS_TOKEN"

echo "🔄 Updating Facebook Page Access Token for HỌC AI..."

curl -X POST http://localhost:3001/api/publishing/credentials/facebook \
  -H "Content-Type: application/json" \
  -d "{
    \"configName\": \"HỌC AI\",
    \"defaultHashtags\": \"\",
    \"timezone\": \"Asia/Ho_Chi_Minh\",
    \"appId\": \"834487612817282\",
    \"appSecret\": \"e9c553f382fd061b2a0b9950235b7e35\",
    \"pageAccessToken\": \"$PAGE_TOKEN\",
    \"pageId\": \"830346346838304\",
    \"pageName\": \"HỌC AI\",
    \"enableLinkPreview\": true,
    \"defaultScheduling\": \"immediate\"
  }"

echo ""
echo "✅ Done!"

