#!/bin/bash

# Test script for idea selection workflow
# This tests the complete flow: generate → list → select → verify

API_URL="http://localhost:3001"

echo "==================================="
echo "Testing Idea Selection Workflow"
echo "==================================="
echo ""

# Test 1: List all ideas
echo "Test 1: List all ideas"
echo "-----------------------------------"
curl -s "${API_URL}/api/ideas" | jq '. | length as $total | map(select(.status == "selected")) | length as $selected | {total: $total, selected: $selected}'
echo ""
echo ""

# Test 2: Get first proposed idea
echo "Test 2: Get first proposed idea"
echo "-----------------------------------"
IDEA_ID=$(curl -s "${API_URL}/api/ideas" | jq -r 'map(select(.status == "proposed" or .status != "selected")) | .[0].idea_id')
echo "Found idea_id: $IDEA_ID"
echo ""

if [ "$IDEA_ID" == "null" ] || [ -z "$IDEA_ID" ]; then
    echo "No proposed ideas found. Generating new ideas..."
    echo ""
    
    # Generate new ideas
    curl -s -X POST "${API_URL}/api/ideas/generate" \
        -H "Content-Type: application/json" \
        -H "x-user-id: demo-user" \
        -H "x-user-role: CL" \
        -d '{
            "persona": "Marketing Manager at B2B SaaS",
            "industry": "SaaS",
            "count": 5,
            "language": "en",
            "temperature": 0.8
        }' | jq '.ideas | length'
    
    echo "Generated new ideas. Getting first one..."
    IDEA_ID=$(curl -s "${API_URL}/api/ideas" | jq -r '.[0].idea_id')
    echo "New idea_id: $IDEA_ID"
    echo ""
fi

# Test 3: Select the idea
echo "Test 3: Select idea $IDEA_ID"
echo "-----------------------------------"
curl -s -X POST "${API_URL}/api/ideas/${IDEA_ID}/select" \
    -H "Content-Type: application/json" \
    -H "x-user-id: demo-user" \
    -H "x-user-role: CL" | jq '.'
echo ""
echo ""

# Test 4: Verify the idea is now selected
echo "Test 4: Verify idea is selected"
echo "-----------------------------------"
curl -s "${API_URL}/api/ideas" | jq ".[] | select(.idea_id == \"${IDEA_ID}\")"
echo ""
echo ""

# Test 5: List all selected ideas
echo "Test 5: Count selected ideas"
echo "-----------------------------------"
curl -s "${API_URL}/api/ideas" | jq 'map(select(.status == "selected")) | length as $count | "Selected ideas: \($count)"'
echo ""
echo ""

# Test 6: Show all ideas with their statuses
echo "Test 6: Show all ideas with statuses"
echo "-----------------------------------"
curl -s "${API_URL}/api/ideas" | jq '.[] | {idea_id: .idea_id, title: .one_liner, status: .status}'
echo ""
echo ""

echo "==================================="
echo "All tests completed!"
echo "==================================="

