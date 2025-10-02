# Security Overview - Otto-TP

## Security Features

### 1. Authentication & Authorization
- **JWT-based Sessions**: 24-hour expiry with HttpOnly cookies
- **Role-Based Access Control (RBAC)**:
  - `admin`: Full access (user management, audit logs, settings)
  - `user`: Can create/delete own accounts, view team accounts
  - `viewer`: Read-only access to team accounts
- **Password Storage**: Bcrypt hashing with salt rounds
- **Session Security**: HttpOnly, Secure (in production), SameSite cookies

### 2. Data Protection
- **TOTP Secret Encryption**: AES-256-GCM encryption at rest
- **Encrypted Database Fields**: TOTP secrets are never stored in plaintext
- **Environment Variables**: Sensitive configuration via `.env` files
- **API Key Authentication**: SHA-256 hashed API keys for programmatic access

### 3. Audit Logging
- **Comprehensive Activity Tracking**: All user actions are logged
- **IP Address & User Agent**: Tracking for forensic analysis
- **TOTP View Tracking**: Logged when users view TOTP codes
- **Retention Policy**: Configurable retention (default: 30 days)
- **Admin-Only Access**: Only administrators can view audit logs

### 4. Input Validation & Sanitization
- **SQL Injection Protection**: Prepared statements with parameterized queries
- **XSS Prevention**: React automatic escaping + Content Security Policy
- **Input Validation**:
  - Date range validation (must be valid Unix timestamps)
  - Limit validation (max 1000 records per request)
  - Offset validation (min 0)
  - Resource filtering with LIKE pattern matching (safe with prepared statements)

### 5. API Security
- **Authentication Required**: All API endpoints require valid session or API key
- **Authorization Checks**: Role-based permissions enforced at endpoint level
- **Rate Limiting**: Consider implementing rate limiting for production (e.g., nginx)
- **CORS Configuration**: Restricted to same-origin by default

## Potential Security Concerns & Mitigations

### ⚠️ Known Issues to Address

#### 1. Rate Limiting
**Issue**: No rate limiting on API endpoints
**Risk**: Brute force attacks, DoS
**Mitigation**: Implement rate limiting via:
- Nginx `limit_req` module
- Application-level middleware (e.g., express-rate-limit)
- Cloudflare or similar CDN/WAF

#### 2. Password Policy
**Issue**: No enforced password complexity requirements
**Risk**: Weak passwords
**Mitigation**:
- Minimum 8 characters enforced
- Consider adding complexity requirements (uppercase, numbers, symbols)
- Password strength indicator in UI

#### 3. Session Fixation
**Issue**: Sessions not invalidated on password change
**Risk**: Session hijacking
**Mitigation**: Regenerate session tokens on password change

#### 4. CSRF Protection
**Issue**: Basic CSRF protection via SameSite cookies
**Risk**: Cross-site request forgery
**Current Mitigation**: SameSite=Lax cookies + credentials: "include"
**Enhancement**: Add CSRF tokens for state-changing operations

#### 5. Audit Log Injection
**Issue**: User-controlled data in audit logs (details field)
**Risk**: Log injection, log forging
**Mitigation**:
- Input sanitization on `details` field
- Log viewer escapes output (React handles this)
- Consider structured logging (JSON)

## Security Best Practices for Deployment

### 1. Environment Configuration
```bash
# Generate strong secrets
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For ENCRYPTION_KEY

# Use strong passwords
ADMIN_PASSWORD=<strong-password-here>
VIEWER_PASSWORD=<strong-password-here>
```

### 2. HTTPS/TLS Configuration
- Use TLS 1.2+ only
- Strong cipher suites (see `TRT_DEPLOYMENT.md`)
- HSTS headers enabled
- SSL certificate from trusted CA

### 3. Nginx Security Headers
```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### 4. Database Security
- SQLite file permissions: `chmod 600 /app/data/app.db`
- Regular backups with encryption
- Audit log retention policy enforced
- Database file outside web root

### 5. Docker Security
- Non-root user (consider adding `USER node`)
- Read-only filesystem where possible
- Network isolation (internal network for DB)
- Resource limits (memory, CPU)
- Regular image updates

### 6. Monitoring & Alerting
- Monitor failed login attempts
- Alert on suspicious audit log patterns
- Track API usage anomalies
- Log file monitoring (size, patterns)

## Vulnerability Reporting

If you discover a security vulnerability, please email: [security contact email]

**Please do NOT create public GitHub issues for security vulnerabilities.**

## Security Checklist for Production

- [ ] Strong JWT_SECRET and ENCRYPTION_KEY generated
- [ ] Default admin password changed
- [ ] HTTPS/TLS enabled with valid certificate
- [ ] Security headers configured in nginx
- [ ] Rate limiting implemented
- [ ] Database file permissions set correctly
- [ ] Audit log retention policy configured
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured
- [ ] Regular security updates scheduled
- [ ] Firewall rules configured (allow 80, 443, deny others)
- [ ] Docker image from trusted sources
- [ ] Environment variables not committed to git
- [ ] API keys rotated regularly
- [ ] Session timeout configured appropriately

## Compliance Considerations

### GDPR / KVKK
- Audit logs contain IP addresses (personal data)
- Data retention policy: 30 days (configurable)
- User data deletion: Manual process required
- Data export: Available via API

### ISO 27001
- Access control: Role-based
- Audit trail: Comprehensive logging
- Encryption: At rest (TOTP secrets) and in transit (HTTPS)
- Incident response: Audit log review

## Security Updates

Keep dependencies updated:
```bash
npm audit
npm audit fix
npm update
```

Regular security reviews recommended every 6 months.
