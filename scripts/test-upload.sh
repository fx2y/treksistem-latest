#!/bin/bash

# Test script for driver photo upload API
# This script tests the new upload endpoints

echo "Testing Driver Photo Upload API"
echo "================================"

# Variables - you'll need to update these with actual IDs from your database
DRIVER_ID="your_driver_cuid_here"
ORDER_ID="your_order_cuid_here"
WORKER_URL="http://localhost:8787"

echo "1. Testing request upload URL endpoint..."

# Step 1: Request upload URL/token
RESPONSE=$(curl -s -X POST \
  "${WORKER_URL}/api/driver/${DRIVER_ID}/orders/${ORDER_ID}/request-upload-url" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "proof.jpg",
    "contentType": "image/jpeg"
  }')

echo "Response: $RESPONSE"

# Extract upload URL and token (you'd parse JSON in a real script)
# For now, we'll show the manual process

echo ""
echo "2. To test file upload, use the uploadUrl from the response above:"
echo "   curl -X POST 'UPLOAD_URL_FROM_RESPONSE' \\"
echo "        -H 'Content-Type: image/jpeg' \\"
echo "        --data-binary '@path/to/your/image.jpg'"

echo ""
echo "3. After successful upload, use the r2ObjectKey in your update-status call:"
echo "   curl -X POST '${WORKER_URL}/api/driver/${DRIVER_ID}/orders/${ORDER_ID}/update-status' \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"newStatus\":\"PICKED_UP\", \"photoR2Key\":\"R2_OBJECT_KEY_FROM_UPLOAD\"}'"

echo ""
echo "Test script completed. Update the DRIVER_ID and ORDER_ID variables with real values to test." 