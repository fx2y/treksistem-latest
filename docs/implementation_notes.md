# Driver Photo Upload API Implementation Notes

## Overview
Implemented TREK-IMPL-API-FILE-001: Driver Proof Photo Upload API for R2 storage.

## Design Decision: Proxy Upload vs Pre-signed URLs
Instead of using S3-style pre-signed URLs (which would require R2 API tokens), implemented a proxy upload approach using R2 bindings. This is more secure and simpler for the MVP.

## API Endpoints

### POST /api/driver/:driverId/orders/:orderId/request-upload-url
**Purpose**: Generate a temporary upload token and endpoint URL for photo upload.

**Request Body**:
```json
{
  "filename": "proof.jpg",
  "contentType": "image/jpeg"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "uploadUrl": "/api/driver/{driverId}/orders/{orderId}/upload/{uploadToken}",
    "uploadToken": "cuid_upload_token",
    "r2ObjectKey": "proofs/{mitraId}/{orderId}/{uniqueId}-{filename}",
    "expiresAt": 1640995200000
  }
}
```

### POST /api/driver/:driverId/orders/:orderId/upload/:uploadToken
**Purpose**: Handle the actual file upload to R2 storage.

**Request**: Raw image file in request body with `Content-Type: image/*`

**Response**:
```json
{
  "success": true,
  "data": {
    "r2ObjectKey": "proofs/{mitraId}/{orderId}/{uploadToken}-upload.jpg",
    "etag": "\"abc123def456...\"",
    "size": 123456,
    "uploaded": "2024-01-01T12:00:00.000Z",
    "message": "File uploaded successfully. Use the r2ObjectKey in your status update."
  }
}
```

## R2 Object Key Structure
```
proofs/{mitraId}/{orderId}/{uniqueId}-{originalFilename}
```

This structure provides:
- Organization by Mitra for easy management
- Order-specific grouping
- Collision prevention via unique IDs
- Original filename preservation

## Integration with Order Status Updates
After successful upload, drivers use the returned `r2ObjectKey` in the `update-status` endpoint:

```bash
curl -X POST '/api/driver/{driverId}/orders/{orderId}/update-status' \
  -H 'Content-Type: application/json' \
  -d '{
    "newStatus": "PICKED_UP",
    "photoR2Key": "proofs/mitra123/order456/upload789-proof.jpg"
  }'
```

## Security Features
1. **Driver Authentication**: All endpoints protected by driver middleware
2. **Order Ownership**: Verification that order is assigned to requesting driver
3. **File Type Validation**: Only image/* content types allowed
4. **Token Expiration**: Upload tokens expire after 5 minutes
5. **Unique Tokens**: CUID-based tokens prevent guessing

## Configuration
- R2 bucket binding: `TREKSISTEM_R2` → `treksistem-proofs`
- CORS must be configured in R2 bucket for frontend uploads

## Dependencies
- Uses existing R2 binding (no additional packages required)
- Integrates with existing driver authentication middleware
- Compatible with existing order event logging system

## Future Enhancements
1. **KV Storage**: Store upload context in KV for better token validation
2. **File Size Limits**: Add configurable file size restrictions
3. **Image Processing**: Add thumbnail generation or image optimization
4. **Cleanup Jobs**: Implement cleanup of expired/unused uploads

## Testing
Use the provided `test-upload.sh` script to test the endpoints manually. 