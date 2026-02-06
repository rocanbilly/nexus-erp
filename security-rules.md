# Greptile Security Rules

Security-focused rules aligned with **OWASP Top 10 2024** and modern security best practices. Add to Greptile dashboard under **Settings → Custom Rules** or `greptile.json`.

> **Priority**: Security rules should be flagged at **strictness 3** (critical only) to ensure they're never missed.

---

## 1. Broken Access Control (OWASP #1)

### Authorization
- Protected API routes must include authentication middleware
- Admin functions require role-based access control (RBAC) checks
- Never trust client-side authorization — verify on server
- Resource access must verify the requesting user owns or has permission to access the resource
- Deny by default — explicitly grant access, don't explicitly deny
- API endpoints must validate user has permission for the specific action, not just authentication

### Access Patterns
- Direct object references must be validated against user permissions
- Avoid exposing internal IDs in URLs — use UUIDs or slugs
- File downloads must verify user authorization before serving
- Bulk operations must check permissions for each item

---

## 2. Cryptographic Failures (OWASP #2)

### Sensitive Data Protection
- Sensitive data should be encrypted at rest (AES-256 or equivalent)
- Use TLS 1.2+ for all data in transit — no HTTP for sensitive operations
- Passwords must be hashed with bcrypt, Argon2, or scrypt — never MD5/SHA1
- Never store plaintext passwords, API keys, or secrets

### Key Management
- No hardcoded secrets, API keys, or credentials in source code
- Encryption keys must be stored in secure key management (not environment variables in production)
- Use separate keys for different environments (dev/staging/prod)
- Implement key rotation mechanisms

### Data Classification
- PII (personally identifiable information) must be identified and protected
- Credit card data must follow PCI-DSS requirements
- Health data must follow HIPAA requirements where applicable
- Log files must not contain sensitive data

---

## 3. Injection (OWASP #3)

### SQL Injection
- SQL queries must use parameterized statements/prepared statements — never string concatenation
- ORMs should use their built-in parameterization, not raw queries
- Dynamic table/column names must be validated against allowlist
- Stored procedures must use parameterized inputs

### Command Injection
- Never pass user input directly to shell commands (`exec`, `system`, `subprocess`)
- Use allowlists for permitted commands, not denylists
- Avoid shell=True in subprocess calls
- Sanitize filenames before file system operations

### Other Injection Types
- NoSQL queries must sanitize input to prevent operator injection
- LDAP queries must escape special characters
- XML parsers must disable external entity processing (XXE prevention)
- Template engines must escape user input (prevent SSTI)

---

## 4. Insecure Design (OWASP #4)

### Threat Modeling
- Authentication flows must handle brute force protection (rate limiting, lockout)
- Password reset flows must use secure, time-limited tokens
- Multi-step processes must validate state at each step (not just final)
- Race conditions must be considered in concurrent operations

### Business Logic
- Financial calculations must use decimal types, not floating point
- Quantity/price fields must have reasonable limits
- Discount/coupon logic must prevent stacking exploits
- Referral systems must prevent self-referral

---

## 5. Security Misconfiguration (OWASP #5)

### Configuration
- Debug mode must be disabled in production
- Default credentials must never be used
- Error messages must not leak stack traces, SQL queries, or internal paths
- CORS must be explicitly configured — no wildcard (*) in production
- Security headers required: CSP, X-Frame-Options, X-Content-Type-Options

### Dependencies
- No dependencies with known critical vulnerabilities (check CVEs)
- Lock file (package-lock.json, poetry.lock) must be committed
- Unused dependencies should be removed
- Pin dependency versions in production

---

## 6. Vulnerable Components (OWASP #6)

- Flag imports of deprecated/vulnerable packages
- Check for outdated dependencies with known CVEs
- Avoid packages with low maintenance/no recent updates (>2 years)
- Verify package names carefully (typosquatting prevention)

---

## 7. Authentication Failures (OWASP #7)

### Session Management
- Session tokens must have expiration times set
- Sessions must be invalidated on logout
- Session tokens must be regenerated after authentication
- Use secure, httpOnly, sameSite cookies for session tokens

### Password Policy
- Enforce minimum password complexity (12+ chars, or check against breach databases)
- Implement account lockout after failed attempts
- Multi-factor authentication should be available for sensitive operations
- Password change must require current password verification

### Token Security
- JWTs must verify signature and expiration
- Refresh tokens must be stored securely (not localStorage)
- API tokens must have appropriate scopes and expiration
- Token revocation must be supported

---

## 8. Data Integrity Failures (OWASP #8)

### Input Validation
- All user inputs must be validated before processing
- Validate type, length, format, and range
- Use allowlists over denylists for validation
- File uploads require content type, extension, and size validation
- Sanitize filenames — prevent path traversal (`../`)

### Output Encoding
- HTML output must be encoded to prevent XSS
- JSON output must use proper serialization
- URLs must be encoded when including user input
- Use framework-provided escaping (don't roll your own)

### Integrity Checks
- Downloaded files/updates must verify signatures or checksums
- Deserialization of untrusted data must use safe parsers
- CI/CD pipelines must verify artifact integrity

---

## 9. Logging & Monitoring (OWASP #9)

### Audit Logging
- Personal data access must be logged for audit purposes
- Authentication events (login, logout, failed attempts) must be logged
- Authorization failures must be logged
- Administrative actions must be logged with actor identity

### Log Security
- Logs must not contain passwords, tokens, or secrets
- Logs must not contain full credit card numbers or SSNs
- Log injection must be prevented (sanitize newlines/control chars)
- Logs must include timestamp, user ID, action, and outcome

### Alerting
- Multiple failed login attempts should trigger alerts
- Unusual data access patterns should be flagged
- Error rate spikes should trigger alerts

---

## 10. Server-Side Request Forgery (OWASP #10)

### URL Validation
- User-provided URLs must be validated against allowlist of domains
- Block requests to internal/private IP ranges (127.0.0.1, 10.x, 172.16-31.x, 192.168.x)
- Validate URL scheme (allow only http/https)
- Follow redirects cautiously — revalidate destination

### Network Segmentation
- Backend services should not be accessible from user-provided URLs
- Use separate network for internal services
- Webhooks should validate callback URLs

---

## API-Specific Security

### Rate Limiting
- All public endpoints must have rate limiting
- Authentication endpoints need stricter limits
- Rate limits should be per-user and per-IP

### API Security
- API versioning must be explicit
- Deprecated API versions should warn before removal
- GraphQL must have query depth/complexity limits
- REST APIs should validate Content-Type headers

---

## Frontend Security

### XSS Prevention
- Never use `dangerouslySetInnerHTML` with user input
- Sanitize HTML if dynamic content is required (use DOMPurify)
- CSP headers must be configured to prevent inline scripts
- Avoid `eval()` and `new Function()` with user input

### Client Storage
- Never store sensitive data in localStorage/sessionStorage
- Tokens in memory are preferred over persistent storage
- Clear sensitive data on logout

---

## Infrastructure & Deployment

### Secrets Management
- Use environment variables or secret managers, not config files
- Rotate secrets regularly
- Different secrets per environment
- Audit access to secrets

### Container Security
- Don't run containers as root
- Use minimal base images
- Scan images for vulnerabilities
- Don't include secrets in images

---

## Quick Reference Checklist

**Always flag:**
- [ ] Hardcoded credentials/secrets
- [ ] SQL string concatenation
- [ ] Missing auth middleware
- [ ] User input in shell commands
- [ ] Debug mode in production config
- [ ] Missing input validation
- [ ] Sensitive data in logs
- [ ] Missing rate limiting on auth endpoints
- [ ] eval() or equivalent with user input
- [ ] Missing HTTPS enforcement
