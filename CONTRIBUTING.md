# 🤝 Contributing to QANTUM

Thank you for your interest in contributing! This document provides guidelines and best practices.

## 📋 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- TypeScript knowledge

### Setup

```bash
# Clone the repo
git clone https://github.com/papica777-eng/QAntumQATool.git
cd QAntumQATool

# Install dependencies
npm install

# Build
npm run build

# Run tests
node test-all.js
```

## 💻 Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new prediction algorithm
fix: resolve license validation bug
docs: update API reference
test: add unit tests for audit function
```

### Pull Request Process

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`node test-all.js`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 Code Style

### TypeScript

```typescript
// ✅ Good
export interface AuditResult {
  url: string;
  timestamp: Date;
  performance: number;
}

// ✅ Use async/await
async function audit(url: string): Promise<AuditResult> {
  const result = await performAudit(url);
  return result;
}

// ❌ Avoid callbacks
function audit(url, callback) {
  performAudit(url, (err, result) => {
    callback(err, result);
  });
}
```

### Documentation

- Add JSDoc comments to all public functions
- Update README if adding features
- Add inline comments for complex logic

## 🧪 Testing

All new features must include tests:

```javascript
// Add to test-all.js
console.log('📋 TEST X: Your new feature');
try {
  const result = await mm.yourFeature();
  if (result.success) {
    console.log('   ✅ PASSED');
    passed++;
  }
} catch (e) {
  console.log('   ❌ FAILED -', e.message);
  failed++;
}
```

## 📦 Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a GitHub release
4. CI/CD automatically publishes to npm

## 💡 Ideas for Contribution

- [ ] Add more testing frameworks support
- [ ] Improve prediction algorithm accuracy
- [ ] Add more language SDKs (Python, Java)
- [ ] Create VSCode extension
- [ ] Add Docker support

## ❓ Questions?

- Open a [GitHub Issue](https://github.com/papica777-eng/QAntumQATool/issues)
- Email: papica777.eng@gmail.com

---

Thank you for contributing! 🎉
