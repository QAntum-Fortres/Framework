# Security Policy

## 🔒 Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Yes             |
| < 1.0   | ❌ No              |

## 🐛 Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Email**: Send details to [security@QAntum.dev](mailto:papica777.eng@gmail.com)
2. **Subject**: "SECURITY: [Brief Description]"
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Response Time**: Within 48 hours
- **Fix Timeline**: Critical issues within 7 days
- **Credit**: We will credit you in the release notes (unless you prefer anonymity)

### Do NOT

- ❌ Disclose publicly before we've had time to fix
- ❌ Access other users' data
- ❌ Perform destructive testing

## 🛡️ Security Best Practices

When using QANTUM:

1. **Keep your license key secret** - Never commit it to version control
2. **Use environment variables** for sensitive data
3. **Keep dependencies updated** - Run `npm audit` regularly
4. **Use the latest version** of QANTUM

```javascript
// ✅ Good - Use environment variables
const mm = new QAntum({
  licenseKey: process.env.qantum_LICENSE
});

// ❌ Bad - Hardcoded license
const mm = new QAntum({
  licenseKey: 'MM-XXXX-XXXX-XXXX'
});
```

## 🔐 License Key Security

- License keys are validated server-side
- Keys are hashed and never stored in plain text
- Each key is tied to a specific email/account
- Keys can be revoked if compromised

Thank you for helping keep QANTUM secure! 🙏
