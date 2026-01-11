# Contributing to BHC Markets

Thank you for your interest in contributing to BHC Markets! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Examples of behavior that contributes to a positive environment:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**
- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team. All complaints will be reviewed and investigated and will result in a response that is deemed necessary and appropriate to the circumstances.

## Getting Started

### Prerequisites

Before contributing, ensure you have:
- **Bun** 1.3.5+ installed
- **PostgreSQL** 15+ running locally
- **Redis** 7+ (optional but recommended)
- **Git** configured with your GitHub account

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/bhcmarkets.git
   cd bhcmarkets
   ```
3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/zshmeta/bhcmarkets.git
   ```

### Set Up Development Environment

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your local settings
   ```

3. **Initialize database:**
   ```bash
   bun run db:migrate
   bun run db:seed
   ```

4. **Verify setup:**
   ```bash
   bun run dev
   ```

## Development Process

### Creating a Feature Branch

Always create a new branch for your work:

```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Branch Naming Conventions

- `feature/` - New features (e.g., `feature/add-margin-trading`)
- `fix/` - Bug fixes (e.g., `fix/order-matching-race-condition`)
- `refactor/` - Code refactoring (e.g., `refactor/auth-service`)
- `docs/` - Documentation updates (e.g., `docs/improve-api-docs`)
- `test/` - Test improvements (e.g., `test/add-integration-tests`)
- `chore/` - Build/dependency updates (e.g., `chore/update-dependencies`)

### Making Changes

1. **Make your changes** in small, logical commits
2. **Write tests** for new functionality
3. **Update documentation** if necessary
4. **Run linters and tests:**
   ```bash
   bun run lint
   bun run typecheck
   bun run test
   ```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Build process or auxiliary tool changes

**Examples:**
```
feat(order-engine): add stop-loss order support

Implements stop-loss orders that automatically trigger
when price reaches specified threshold.

Closes #123
```

```
fix(ledger): prevent negative balance in concurrent transactions

Use row-level locking to prevent race condition when
multiple transactions update the same balance simultaneously.

Fixes #456
```

### Keeping Your Branch Updated

Regularly sync with upstream:

```bash
git fetch upstream
git rebase upstream/main
```

If conflicts occur, resolve them and continue:

```bash
# After resolving conflicts
git add .
git rebase --continue
```

## Pull Request Process

### Before Submitting

Ensure your PR meets these requirements:

- [ ] Code follows project style guidelines
- [ ] All tests pass locally
- [ ] TypeScript compiles without errors
- [ ] New code has appropriate test coverage
- [ ] Documentation is updated (if applicable)
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main

### Creating a Pull Request

1. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR on GitHub:**
   - Go to your fork on GitHub
   - Click "Compare & pull request"
   - Fill out the PR template

3. **PR Title:**
   Follow commit message convention:
   ```
   feat(order-engine): add stop-loss order support
   ```

4. **PR Description:**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   Describe how you tested the changes

   ## Checklist
   - [ ] Tests pass
   - [ ] Documentation updated
   - [ ] No breaking changes (or documented)

   ## Related Issues
   Closes #123
   ```

### Review Process

1. **Automated checks** run on your PR:
   - Linting
   - Type checking
   - Unit tests
   - Integration tests
   - Build verification

2. **Code review** by maintainers:
   - At least one approval required
   - Address review comments
   - Update PR as needed

3. **Merge:**
   - Maintainer will merge when approved
   - PR will be squashed and merged

### After Merge

1. **Delete your feature branch:**
   ```bash
   git checkout main
   git pull upstream main
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

2. **Update your fork:**
   ```bash
   git push origin main
   ```

## Coding Standards

### TypeScript

**Type Safety:**
```typescript
// Good - Explicit types
function calculateFee(amount: number, rate: number): number {
  return amount * rate;
}

// Avoid - Implicit any
function calculateFee(amount, rate) {
  return amount * rate;
}
```

**Interfaces vs Types:**
```typescript
// Prefer interfaces for objects
interface User {
  id: string;
  email: string;
}

// Use types for unions/intersections
type OrderStatus = 'open' | 'filled' | 'cancelled';
type AdminUser = User & { role: 'admin' };
```

**Null Handling:**
```typescript
// Good - Explicit null checks
function getUser(id: string): User | null {
  const user = database.findUser(id);
  return user ?? null;
}

// Use optional chaining
const email = user?.profile?.email;
```

### Code Style

**Formatting:**
- Use Prettier for automatic formatting
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Max line length: 100 characters

**Naming:**
```typescript
// Variables and functions: camelCase
const userId = '123';
function getUserBalance() { }

// Classes and interfaces: PascalCase
class OrderManager { }
interface OrderService { }

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;

// Private fields: _camelCase
class Example {
  private _internalState: string;
}
```

**File Organization:**
```typescript
// 1. Imports (external, then internal)
import { describe, it, expect } from 'vitest';
import { createOrderService } from '../order.service';

// 2. Type definitions
interface ServiceConfig {
  // ...
}

// 3. Constants
const DEFAULT_CONFIG = { /* ... */ };

// 4. Main code
export function createService(config: ServiceConfig) {
  // ...
}

// 5. Helper functions
function helperFunction() {
  // ...
}
```

### Error Handling

**Create descriptive errors:**
```typescript
export class InsufficientBalanceError extends Error {
  constructor(
    public readonly available: number,
    public readonly required: number,
  ) {
    super(`Insufficient balance. Available: ${available}, Required: ${required}`);
    this.name = 'InsufficientBalanceError';
  }
}
```

**Handle errors appropriately:**
```typescript
try {
  await placeOrder(order);
} catch (error) {
  if (error instanceof InsufficientBalanceError) {
    logger.warn({ error }, 'Insufficient balance');
    return { success: false, error: 'INSUFFICIENT_FUNDS' };
  } else if (error instanceof ValidationError) {
    logger.warn({ error }, 'Invalid order');
    return { success: false, error: 'INVALID_ORDER' };
  } else {
    logger.error({ error }, 'Unexpected error');
    throw error;
  }
}
```

## Testing Guidelines

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('OrderService', () => {
  let orderService: OrderService;

  beforeEach(() => {
    // Set up test environment
    orderService = createOrderService({ /* ... */ });
  });

  afterEach(() => {
    // Clean up
  });

  describe('placeOrder', () => {
    it('should place a valid limit order', async () => {
      // Arrange
      const order = {
        symbol: 'BTC/USD',
        side: 'buy',
        type: 'limit',
        quantity: 1,
        price: 50000,
      };

      // Act
      const result = await orderService.placeOrder(order);

      // Assert
      expect(result.success).toBe(true);
      expect(result.order.status).toBe('open');
    });

    it('should reject order with insufficient balance', async () => {
      // ...
    });
  });
});
```

### Test Coverage

Aim for:
- **Unit tests**: 80%+ coverage
- **Integration tests**: Critical paths
- **E2E tests**: Main user flows

### What to Test

**Do test:**
- Business logic
- Edge cases
- Error handling
- Data validation
- Integration points

**Don't test:**
- Third-party libraries
- Framework internals
- Trivial getters/setters

## Documentation

### Code Documentation

**JSDoc for public APIs:**
```typescript
/**
 * Places a new order in the order book.
 * 
 * @param order - The order to place
 * @returns The placed order with assigned ID and status
 * @throws {InsufficientBalanceError} If account has insufficient balance
 * @throws {ValidationError} If order parameters are invalid
 * 
 * @example
 * ```typescript
 * const order = await placeOrder({
 *   symbol: 'BTC/USD',
 *   side: 'buy',
 *   type: 'limit',
 *   quantity: 1,
 *   price: 50000,
 * });
 * ```
 */
export async function placeOrder(order: Order): Promise<OrderResult> {
  // ...
}
```

### README Updates

When adding new features, update relevant READMEs:
- Package README for new functionality
- Main README for new packages/apps
- Architecture docs for design changes

## Issue Reporting

### Bug Reports

Include:
- **Description**: Clear description of the bug
- **Steps to Reproduce**: Detailed steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: OS, Node version, etc.
- **Screenshots**: If applicable
- **Logs**: Relevant error logs

**Template:**
```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- OS: macOS 13.0
- Node: 18.17.0
- Bun: 1.3.5

## Additional Context
Any other relevant information
```

### Feature Requests

Include:
- **Problem**: What problem does this solve?
- **Solution**: Proposed solution
- **Alternatives**: Alternative solutions considered
- **Additional Context**: Any other relevant information

## Questions?

If you have questions, you can:
- Open a GitHub Discussion
- Join our Discord server
- Email: dev@bhcmarkets.com

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (Private - BHC Markets).

---

Thank you for contributing to BHC Markets! 🚀
