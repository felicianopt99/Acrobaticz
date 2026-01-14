# 🤝 Contributing to Acrobaticz

Thank you for your interest in contributing to Acrobaticz! This guide will help you get started.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** ([download](https://nodejs.org))
- **Git** ([download](https://git-scm.com))
- **PostgreSQL 14+** or [Supabase](https://supabase.com)
- **VS Code** (recommended) or any code editor

### Development Setup (10 minutes)

```bash
# 1. Clone repository
git clone https://github.com/yourusername/acrobaticz.git
cd acrobaticz

# 2. Install dependencies
npm install

# 3. Create development environment
cp env .env.local

# 4. Setup database
npx prisma migrate dev
npx prisma db seed

# 5. Start development server
npm run dev

# 6. Open http://localhost:3000
```

---

## 📋 Code Standards

### TypeScript
- Always use TypeScript (no JavaScript in src/)
- Strict type checking enabled
- No `any` types without justification
- Export types for public APIs

```typescript
// ✅ Good
interface EquipmentProps {
  id: string;
  name: string;
  price: number;
}

function Equipment({ id, name, price }: EquipmentProps) {
  return <div>{name}</div>;
}

// ❌ Avoid
function Equipment(props: any) {
  return <div>{props.name}</div>;
}
```

### Component Structure
- One component per file
- Descriptive file names (PascalCase)
- Clear prop interfaces
- Proper documentation

```typescript
// src/components/Equipment/EquipmentCard.tsx
interface EquipmentCardProps {
  equipment: Equipment;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Displays equipment card with actions
 * @param equipment - Equipment data
 * @param onEdit - Edit callback
 * @param onDelete - Delete callback
 */
export function EquipmentCard({
  equipment,
  onEdit,
  onDelete
}: EquipmentCardProps) {
  return (
    <div className="card">
      <h3>{equipment.name}</h3>
      {/* Implementation */}
    </div>
  );
}
```

### Naming Conventions
```
Components:     PascalCase (Button, EquipmentCard)
Files:          PascalCase (Button.tsx, EquipmentCard.tsx)
Functions:      camelCase (handleClick, fetchEquipment)
Constants:      UPPER_SNAKE_CASE (MAX_ITEMS, API_URL)
Types/Interfaces: PascalCase (EquipmentProps, ApiResponse)
```

### File Organization
```
src/
├── components/
│   ├── Equipment/
│   │   ├── EquipmentCard.tsx       # Component
│   │   ├── EquipmentForm.tsx       # Related component
│   │   ├── index.ts                # Exports
│   │   └── Equipment.test.tsx      # Tests
│   └── Common/
│       ├── Button.tsx
│       └── index.ts
├── hooks/
│   ├── useEquipment.ts             # Custom hook
│   └── index.ts
├── lib/
│   ├── repositories/
│   │   └── equipment.repository.ts
│   └── services/
│       └── equipment.service.ts
└── types/
    └── index.ts
```

---

## 🔄 Development Workflow

### 1. Create Branch
```bash
# Checkout main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/equipment-filtering

# Branch naming:
feature/description    # New feature
bugfix/description     # Bug fix
docs/description       # Documentation
chore/description      # Maintenance
```

### 2. Make Changes
```bash
# Edit files
# Follow code standards above
# Add tests for new code
# Test locally: npm run dev
```

### 3. Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode (while developing)
npm run test:watch

# Check test coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check
```

### 4. Commit Code
```bash
# Stage changes
git add .

# Commit with clear message
git commit -m "feat: add equipment filtering by category"

# Commit message format:
# feat:  New feature
# fix:   Bug fix
# docs:  Documentation
# test:  Test additions
# chore: Maintenance
# refactor: Code restructure
```

### 5. Push & Create PR
```bash
# Push to remote
git push origin feature/equipment-filtering

# Create Pull Request on GitHub
# Write clear description of changes
# Reference any related issues (#123)
# Request review from maintainers
```

### 6. Code Review
- Respond to review feedback
- Make requested changes
- Push updates (PR auto-updates)
- Wait for approval

### 7. Merge
- Squash commits (keep history clean)
- Merge to main
- Delete feature branch

---

## 🧪 Testing Guidelines

### Writing Tests
```typescript
// src/components/Equipment/EquipmentCard.test.tsx
import { render, screen } from '@testing-library/react';
import { EquipmentCard } from './EquipmentCard';

describe('EquipmentCard', () => {
  it('renders equipment name', () => {
    const equipment = { id: '1', name: 'LED Panel' };
    render(
      <EquipmentCard
        equipment={equipment}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    );

    expect(screen.getByText('LED Panel')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    const equipment = { id: '1', name: 'LED Panel' };
    render(
      <EquipmentCard
        equipment={equipment}
        onEdit={onEdit}
        onDelete={() => {}}
      />
    );

    // Find and click edit button
    // Assert onEdit was called
  });
});
```

### Test Coverage Goals
- Components: 80%+ coverage
- Utilities: 90%+ coverage
- Services: 85%+ coverage
- Overall: 70%+ coverage

### Test Types
- **Unit Tests** - Individual functions/components
- **Integration Tests** - Component interactions
- **Snapshot Tests** - UI consistency (use sparingly)

---

## 📝 Documentation

### Code Comments
- Comment complex logic
- Document public APIs
- Use JSDoc for functions

```typescript
/**
 * Calculates equipment rental price
 * @param basePrice - Daily rental rate
 * @param days - Number of rental days
 * @param discount - Discount percentage (0-100)
 * @returns Calculated total price
 */
function calculateRentalPrice(
  basePrice: number,
  days: number,
  discount: number = 0
): number {
  return basePrice * days * (1 - discount / 100);
}
```

### Markdown Documentation
- Keep docs updated with code changes
- Add examples for complex features
- Use clear, concise language
- Link to relevant files

---

## 🐛 Reporting Issues

### Before Creating Issue
1. Search existing issues first
2. Check documentation
3. Try latest development version
4. Verify reproduction steps

### Creating Issue
```markdown
### Description
Brief description of the issue

### Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

### Expected Behavior
What should happen

### Actual Behavior
What actually happens

### Environment
- OS: Windows/Mac/Linux
- Node version: 18.x.x
- Browser: Chrome/Firefox

### Additional Context
Any other relevant information
```

---

## 🔍 Code Review Checklist

Before submitting PR, ensure:

- [ ] Code follows style guide
- [ ] Tests written and passing
- [ ] No console warnings
- [ ] No `console.log()` statements
- [ ] TypeScript strict mode passes
- [ ] No unused imports
- [ ] Comments are clear
- [ ] Commit messages are descriptive
- [ ] Branch is up-to-date with main
- [ ] No breaking changes (or documented)

---

## 🚀 Deployment Checklist

For release managers only:

- [ ] All tests passing
- [ ] Changelog updated
- [ ] Version bumped (semantic versioning)
- [ ] Database migrations reviewed
- [ ] Performance tested
- [ ] Security review complete
- [ ] Documentation updated
- [ ] Tag created on git
- [ ] Release notes written
- [ ] Deployment completed

---

## 💡 Best Practices

### Do's
✅ Write tests for new features
✅ Keep functions small and focused
✅ Use descriptive variable names
✅ Comment complex logic
✅ Test across browsers
✅ Update documentation
✅ Use TypeScript strict mode
✅ Handle errors gracefully
✅ Optimize database queries
✅ Cache appropriately

### Don'ts
❌ Commit without testing
❌ Use `any` type
❌ Leave console.log() in code
❌ Make breaking changes without discussion
❌ Ignore linting errors
❌ Create overly large PRs
❌ Modify unrelated code
❌ Use magic numbers/strings
❌ Skip error handling
❌ Commit secrets/keys

---

## 🤔 Questions?

- 📚 Read the [README.md](../README.md)
- 📖 Check [ARCHITECTURE.md](ARCHITECTURE.md)
- 🔧 See [Configuration Guide](SETUP/CONFIGURATION.md)
- 💬 Open a discussion on GitHub

---

## ✨ Recognition

Contributors are recognized in:
- GitHub CONTRIBUTORS file
- Release notes
- Project documentation

Thank you for helping make Acrobaticz better! 🙏

---

**Last Updated:** January 14, 2026
**Status:** Active
