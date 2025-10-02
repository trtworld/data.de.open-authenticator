# Audit Log Actions - Comprehensive Guide

## Complete List of Audit Actions

### Authentication & Session Management
| Action | Description | Resource | Details Example |
|--------|-------------|----------|-----------------|
| `login_success` | Successful login | `auth` | "User logged in successfully (role: admin)" |
| `login_failed` | Failed login attempt | `auth` | "Failed login attempt for user: admin" |
| `logout` | User logout | `auth` | "User logged out" |
| `password_changed` | Password change | `auth` | "Password changed successfully" |

### TOTP Account Management
| Action | Description | Resource | Details Example |
|--------|-------------|----------|-----------------|
| `account_created` | New TOTP account created | `account_{id}` | "Created TOTP account: Google:user@example.com (team)" |
| `account_updated` | Account visibility changed | `account_{id}` | "Updated visibility: team → private for Google:user@example.com" |
| `account_deleted` | TOTP account deleted | `account_{id}` | "Deleted TOTP account: Google:user@example.com" |
| `totp_viewed` | TOTP code revealed/viewed | `account_{id}` | "Viewed TOTP code for Google:user@example.com" |

### User Management
| Action | Description | Resource | Details Example |
|--------|-------------|----------|-----------------|
| `user_created` | New user created | `{username}` | "Created admin user" |
| `user_deleted` | User deleted | `{username}` | "User deleted" |
| `user_role_changed` | User role modified | `{username}` | "Role changed from user to admin" |
| `users:list` | User list viewed | - | "User list accessed" |

### API Key Management
| Action | Description | Resource | Details Example |
|--------|-------------|----------|-----------------|
| `api_key_created` | New API key created | `api_key_{id}` | "Created API key: Production Key (expires in 90 days)" |
| `api_key_deleted` | API key deleted | `api_key_{id}` | "Deleted API key: Production Key" |
| `api_key_updated` | API key status changed | `api_key_{id}` | "Activated API key: Production Key" or "Deactivated API key: Production Key" |

### System Operations
| Action | Description | Resource | Details Example |
|--------|-------------|----------|-----------------|
| `backup_downloaded` | Database backup downloaded | `backup` | "Database backup downloaded" |
| `logo_uploaded` | Organization logo uploaded | `logo` | "Logo uploaded successfully" |
| `settings_changed` | System settings modified | `settings` | "Settings updated" |

## Filtering Examples

### By Action Type
```
# View all login attempts (successful and failed)
Action filter: "login"

# View all TOTP account operations
Action filter: "account_"

# View all API key operations
Action filter: "api_key_"

# View security-sensitive operations
Action filter: "delete" or "created" or "updated"
```

### By Resource
```
# View all operations on specific account
Resource filter: "account_5"

# View all operations on specific API key
Resource filter: "api_key_3"

# View all auth operations
Resource filter: "auth"
```

### By Username
```
# View all operations by specific user
Username filter: "admin"

# View all operations by specific role (requires combining with action)
Username filter: "viewer_user1"
```

### By Date Range
```
# View operations in specific date range
Start Date: 2025-10-01
End Date: 2025-10-02

# View today's operations
Start Date: [today]
End Date: [today]

# View last week's operations
Start Date: [7 days ago]
End Date: [today]
```

## Security Monitoring Scenarios

### 1. Detect Unauthorized Access Attempts
```
Filter: action = "login_failed"
Alert when: Multiple failed attempts from same username (>5 in 10 minutes)
```

### 2. Track TOTP Code Access
```
Filter: action = "totp_viewed"
Purpose: See who viewed which TOTP codes
Alert when: Unusual access patterns or after-hours access
```

### 3. Monitor Account Deletions
```
Filter: action contains "deleted"
Purpose: Track all deletion operations
Alert when: Multiple deletions in short timeframe
```

### 4. API Key Management Audit
```
Filter: action contains "api_key"
Purpose: Track API key lifecycle
Alert when: Key created with no expiration or deactivated unexpectedly
```

### 5. Privilege Escalation Detection
```
Filter: action = "user_role_changed"
Purpose: Monitor role changes
Alert when: Non-admin user role changed to admin
```

## Compliance Scenarios

### ISO 27001 / KVKK Compliance
```
Requirement: Access control audit trail
Filters:
  - action = "login_success" OR "login_failed"
  - action = "totp_viewed"
  - action contains "user_"
Retention: 30 days minimum (currently configured)
```

### Data Access Tracking
```
Requirement: Who accessed what data when
Filters:
  - action = "totp_viewed" (sensitive data access)
  - action = "backup_downloaded" (bulk data export)
  - resource = specific account ID
```

### Administrative Actions Audit
```
Requirement: Track privileged operations
Filters:
  - username = "admin" or role = "admin"
  - action contains "created" OR "deleted" OR "updated"
  - Date range: Monthly reports
```

## Integration with External Systems

### SIEM Integration
Export audit logs via API:
```bash
curl -X GET "https://totp.trt.net.tr/api/audit?startDate=1633046400&endDate=1633132800" \
  -H "Cookie: session=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json"
```

### Automated Alerts
Monitor specific actions programmatically:
```bash
# Check for failed login attempts
curl "https://totp.trt.net.tr/api/audit?action=login_failed&limit=100"

# Check TOTP views in last hour
HOUR_AGO=$(date -u -d '1 hour ago' +%s)
NOW=$(date -u +%s)
curl "https://totp.trt.net.tr/api/audit?action=totp_viewed&startDate=$HOUR_AGO&endDate=$NOW"
```

## Best Practices

### 1. Regular Audit Reviews
- Daily: Review failed login attempts
- Weekly: Review account/user creation and deletions
- Monthly: Comprehensive compliance report

### 2. Retention Policy
- Current setting: 30 days
- Recommendation: Export critical logs for long-term storage before deletion
- Compliance: Adjust based on regulatory requirements (GDPR: up to 6 years)

### 3. Alert Configuration
- Failed logins: > 5 attempts in 10 minutes per user
- After-hours access: TOTP views outside business hours
- Bulk operations: > 10 accounts created/deleted in 1 hour
- Privilege changes: Any role escalation

### 4. Access Control
- Only admins can view audit logs
- Audit logs themselves are audited (users:list action)
- No audit log modification capability (append-only)

## Action Categories Summary

**Authentication (4 actions)**:
- login_success, login_failed, logout, password_changed

**TOTP Accounts (4 actions)**:
- account_created, account_updated, account_deleted, totp_viewed

**User Management (4 actions)**:
- user_created, user_deleted, user_role_changed, users:list

**API Keys (3 actions)**:
- api_key_created, api_key_deleted, api_key_updated

**System (3 actions)**:
- backup_downloaded, logo_uploaded, settings_changed

**Total: 18 distinct audit actions**
