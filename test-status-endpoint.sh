#!/bin/bash

echo "========== TESTING STATUS UPDATE ENDPOINT =========="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3001/api/packs"

# First, create a test pack in draft status
echo -e "${YELLOW}Creating test pack in draft status...${NC}"
PACK_ID="TEST-STATUS-$(date +%s)"

# We need a valid brief_id first
BRIEF_ID="TEST-BRIEF-001"

echo ""
echo -e "${YELLOW}Test 1: Valid transition (draft → review)${NC}"
curl -s -X POST "$API_URL/update-status" \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: test-user' \
  -H 'x-user-role: WR' \
  -d "{
    \"pack_id\": \"$PACK_ID\",
    \"status\": \"review\"
  }" | jq '.'

echo ""
echo -e "${YELLOW}Test 2: Invalid transition (draft → published)${NC}"
curl -s -X POST "$API_URL/update-status" \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: test-user' \
  -H 'x-user-role: WR' \
  -d "{
    \"pack_id\": \"$PACK_ID\",
    \"status\": \"published\"
  }" | jq '.'

echo ""
echo -e "${YELLOW}Test 3: Valid transition (review → approved)${NC}"
curl -s -X POST "$API_URL/update-status" \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: test-reviewer' \
  -H 'x-user-role: CL' \
  -d "{
    \"pack_id\": \"$PACK_ID\",
    \"status\": \"approved\"
  }" | jq '.'

echo ""
echo -e "${YELLOW}Test 4: Valid transition (approved → published)${NC}"
curl -s -X POST "$API_URL/update-status" \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: test-publisher' \
  -H 'x-user-role: MOps' \
  -d "{
    \"pack_id\": \"$PACK_ID\",
    \"status\": \"published\"
  }" | jq '.'

echo ""
echo -e "${YELLOW}Test 5: Invalid transition from published (published → draft)${NC}"
curl -s -X POST "$API_URL/update-status" \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: test-user' \
  -H 'x-user-role: WR' \
  -d "{
    \"pack_id\": \"$PACK_ID\",
    \"status\": \"draft\"
  }" | jq '.'

echo ""
echo -e "${YELLOW}Test 6: Missing pack_id${NC}"
curl -s -X POST "$API_URL/update-status" \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: test-user' \
  -H 'x-user-role: WR' \
  -d "{
    \"status\": \"review\"
  }" | jq '.'

echo ""
echo -e "${YELLOW}Test 7: Non-existent pack${NC}"
curl -s -X POST "$API_URL/update-status" \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: test-user' \
  -H 'x-user-role: WR' \
  -d "{
    \"pack_id\": \"DOES-NOT-EXIST\",
    \"status\": \"review\"
  }" | jq '.'

echo ""
echo "========== TESTS COMPLETED =========="















