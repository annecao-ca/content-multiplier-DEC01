#!/bin/bash

# Script để cập nhật Facebook Page Access Token
# Usage: ./update-facebook-token.sh "YOUR_NEW_PAGE_ACCESS_TOKEN"

if [ -z "$1" ]; then
    echo "❌ Error: Please provide the new Page Access Token"
    echo "Usage: ./update-facebook-token.sh \"YOUR_NEW_PAGE_ACCESS_TOKEN\""
    exit 1
fi

NEW_TOKEN="$1"

echo "🔄 Updating Facebook Page Access Token..."

curl -X POST http://localhost:3001/api/publishing/credentials/facebook \
  -H "Content-Type: application/json" \
  -d "{
    \"configName\": \"HỌC AI\",
    \"defaultHashtags\": \"\",
    \"timezone\": \"Asia/Ho_Chi_Minh\",
    \"appId\": \"834487612817282\",
    \"appSecret\": \"e9c553f382fd061b2a0b9950235b7e35\",
    \"pageAccessToken\": \"$NEW_TOKEN\",
    \"pageId\": \"830346346838304\",
    \"pageName\": \"HỌC AI\",
    \"enableLinkPreview\": true,
    \"defaultScheduling\": \"immediate\"
  }" | jq '.'

echo ""
echo "✅ Done! Token updated successfully."

