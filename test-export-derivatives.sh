#!/bin/bash

# Test script for GET /api/packs/:id/derivatives/export endpoint
# Tests JSON and Markdown export formats

API_URL="http://localhost:3001"
PACK_ID="pack-1733670844631"  # Replace with a valid pack_id from your database

echo "==================================="
echo "Testing Derivatives Export Endpoint"
echo "==================================="
echo ""

# Test 1: Export as JSON (default)
echo "Test 1: Export derivatives as JSON (default)"
echo "-----------------------------------"
curl -s "${API_URL}/api/packs/${PACK_ID}/derivatives/export" | jq '.'
echo ""
echo ""

# Test 2: Export as JSON (explicit)
echo "Test 2: Export derivatives as JSON (explicit format)"
echo "-----------------------------------"
curl -s "${API_URL}/api/packs/${PACK_ID}/derivatives/export?format=json" | jq '.'
echo ""
echo ""

# Test 3: Export as Markdown
echo "Test 3: Export derivatives as Markdown"
echo "-----------------------------------"
curl -s "${API_URL}/api/packs/${PACK_ID}/derivatives/export?format=md"
echo ""
echo ""

# Test 4: Invalid format
echo "Test 4: Invalid format (should return 400 error)"
echo "-----------------------------------"
curl -s "${API_URL}/api/packs/${PACK_ID}/derivatives/export?format=invalid" | jq '.'
echo ""
echo ""

# Test 5: Non-existent pack
echo "Test 5: Non-existent pack (should return 404 error)"
echo "-----------------------------------"
curl -s "${API_URL}/api/packs/non-existent-pack/derivatives/export" | jq '.'
echo ""
echo ""

# Test 6: Download JSON to file
echo "Test 6: Download JSON to file"
echo "-----------------------------------"
curl -s "${API_URL}/api/packs/${PACK_ID}/derivatives/export?format=json" -o "${PACK_ID}-derivatives.json"
echo "Saved to ${PACK_ID}-derivatives.json"
ls -lh "${PACK_ID}-derivatives.json"
echo ""
echo ""

# Test 7: Download Markdown to file
echo "Test 7: Download Markdown to file"
echo "-----------------------------------"
curl -s "${API_URL}/api/packs/${PACK_ID}/derivatives/export?format=md" -o "${PACK_ID}-derivatives.md"
echo "Saved to ${PACK_ID}-derivatives.md"
ls -lh "${PACK_ID}-derivatives.md"
echo ""
echo ""

echo "==================================="
echo "All tests completed!"
echo "==================================="

