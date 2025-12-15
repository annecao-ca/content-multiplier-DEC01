#!/bin/bash

echo "========== TESTING STATUS UPDATE API =========="
echo ""

API_URL="http://localhost:3001/api/packs"

# Test 1: Valid transition (draft → review) with existing pack
echo "Test 1: Valid transition (draft → review)"
echo "----------------------------------------"
curl -s -X POST "$API_URL/update-status" \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: test-user' \
  -H 'x-user-role: WR' \
  -d '{
    "pack_id": "PACK-001",
    "status": "review"
  }' | jq '.'

echo ""
echo "Test 2: Invalid transition (draft → published)"
echo "----------------------------------------------"
curl -s -X POST "$API_URL/update-status" \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: test-user' \
  -H 'x-user-role: WR' \
  -d '{
    "pack_id": "PACK-001",
    "status": "published"
  }' | jq '.'

echo ""
echo "Test 3: Missing pack_id"
echo "----------------------"
curl -s -X POST "$API_URL/update-status" \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: test-user' \
  -H 'x-user-role: WR' \
  -d '{
    "status": "review"
  }' | jq '.'

echo ""
echo "Test 4: Non-existent pack"
echo "------------------------"
curl -s -X POST "$API_URL/update-status" \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: test-user' \
  -H 'x-user-role: WR' \
  -d '{
    "pack_id": "DOES-NOT-EXIST-999",
    "status": "review"
  }' | jq '.'

echo ""
echo "Test 5: Invalid status value"
echo "---------------------------"
curl -s -X POST "$API_URL/update-status" \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: test-user' \
  -H 'x-user-role: WR' \
  -d '{
    "pack_id": "PACK-001",
    "status": "invalid_status"
  }' | jq '.'

echo ""
echo "========== TESTS COMPLETED =========="
echo ""
echo "Note: Thay 'PACK-001' bằng pack_id thực tế trong DB để test với data có sẵn"





















