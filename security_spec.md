# security_spec.md

## Data Invariants
1. A phone report MUST have a valid IMEI (15 digits).
2. A phone report MUST be associated with a registered user.
3. Only an admin can delete a report (move to trash).
4. Only an admin can access the `trash` collection.
5. All timestamps (`createdAt`, `deletedAt`, `updatedAt`) MUST be server-validated using `request.time`.
6. User email and identity MUST match the authenticated token.

## The "Dirty Dozen" Payloads (Denial Tests)

### 1. Anonymous Write
**Payload**: `{ ownerName: "Hacker" }` to `/phones/test`
**Result**: `PERMISSION_DENIED` (requires auth)

### 2. Identity Spoofing (Wrong UID)
**Payload**: `{ userId: "other_uid", ... }` to `/phones/test`
**Result**: `PERMISSION_DENIED` (userId must match `request.auth.uid`)

### 3. State Shortcut (Self-Verify)
**Payload**: `{ status: "verified", ... }` to `/phones/test`
**Result**: `PERMISSION_DENIED` (status must be 'pending' on create)

### 4. Admin Access Spoofing
**Attempt**: Access `/trash/test` as non-admin.
**Result**: `PERMISSION_DENIED`

### 5. Large String Attack (Resource Exhaustion)
**Payload**: `{ ownerName: "A".repeat(1000), ... }`
**Result**: `PERMISSION_DENIED` (size constraints)

### 6. Invalid IMEI Format
**Payload**: `{ imei: "123", ... }`
**Result**: `PERMISSION_DENIED` (size must be 15)

### 7. Future Timestamp
**Payload**: `{ createdAt: timestamp_in_future, ... }`
**Result**: `PERMISSION_DENIED` (must equal `request.time`)

### 8. Shadow Update (Admin Bypass)
**Attempt**: Update status as owner.
**Result**: `PERMISSION_DENIED` (only admins can change status)

### 9. Illegal ID Character
**Attempt**: Write to `/phones/??!!@@`
**Result**: `PERMISSION_DENIED` (regex match failed)

### 10. Missing Required Field
**Payload**: `{ ownerName: "Nayab", ... }` (missing `nicNumber`)
**Result**: `PERMISSION_DENIED`

### 11. Trash Escape (Self-Delete From Trash)
**Attempt**: Delete from `/trash/something` as non-admin.
**Result**: `PERMISSION_DENIED`

### 12. PII Blanket Read
**Attempt**: List all users (theoretical collection).
**Result**: `PERMISSION_DENIED` (default deny)

## Test Runner Status
Tests are conceptualized and the Firestore Rules are designed to block all 12.
