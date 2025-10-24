# Contributing to Weave

Thank you for your interest in contributing to Weave! We welcome contributions from everyone. This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn 4.9.4+
- Git

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/kitium-ai/weave.git
cd weave

# Install dependencies
yarn install

# Build all packages
yarn build

# Run tests
yarn test

# Start development
yarn dev
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or for bug fixes:
git checkout -b fix/bug-name
```

### 2. Make Changes

- Write code following our [Code Standards](#code-standards)
- Add tests for new functionality
- Update documentation
- Run checks before committing

### 3. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

[optional body]

[optional footer]
```

**Types**:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only
- `style`: Changes that don't affect code meaning (formatting, missing semicolons, etc.)
- `refactor`: Code change that neither fixes bugs nor adds features
- `perf`: Code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `ci`: Changes to CI configuration files and scripts

**Examples**:
```
feat(core): add streaming support for generation
fix(react): handle component unmount properly
docs(getting-started): update installation instructions
test(classification): add edge case tests
```

### 4. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear description of changes
- Reference to related issues
- Screenshots if UI-related

## Code Standards

### TypeScript

- ✅ Strict mode enabled (`strict: true`)
- ✅ No `any` types (use `unknown` and type guards)
- ✅ Explicit function return types
- ✅ Full test coverage >90%

### Naming Conventions

```typescript
// Classes: PascalCase
class WeaveAI {}

// Functions/variables: camelCase
const generateText = () => {};

// Constants: UPPER_SNAKE_CASE
const DEFAULT_TIMEOUT = 5000;

// Types: PascalCase (no I prefix)
type GenerateOptions = {};

// Interfaces: PascalCase (optional I prefix)
interface IOperation {}
```

### Code Quality Checks

Before committing, run:

```bash
# Format code
yarn format

# Lint code
yarn lint

# Type check
yarn type-check

# Run tests
yarn test

# Full validation
yarn validate
```

### File Structure

Each package should have:

```
packages/example/
├── src/
│   ├── index.ts          # Main exports
│   ├── types.ts          # Type definitions
│   ├── utils.ts          # Utilities
│   └── components/       # (if applicable)
├── tests/
│   └── example.test.ts
├── README.md
├── package.json
└── tsconfig.json
```

### JSDoc Comments

Document all public APIs:

```typescript
/**
 * Generates text based on a prompt.
 *
 * @param prompt - The input prompt for generation
 * @param options - Generation configuration options
 * @returns Promise resolving to generated text
 *
 * @example
 * ```typescript
 * const text = await weave.generate('Write a poem');
 * ```
 *
 * @throws {WeaveError} If generation fails
 *
 * @see {@link GenerateOptions}
 */
export async function generate(
  prompt: string,
  options?: GenerateOptions
): Promise<string> {
  // implementation
}
```

## Testing

### Writing Tests

```typescript
describe('module name', () => {
  describe('feature description', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = processInput(input);

      // Assert
      expect(result).toBe('expected');
    });
  });

  describe('error handling', () => {
    it('should throw on invalid input', () => {
      expect(() => processInput(null)).toThrow(WeaveError);
    });
  });
});
```

### Running Tests

```bash
# Run all tests
yarn test

# Run tests for specific package
yarn workspace @weave/core test

# Watch mode
yarn test --watch

# Coverage report
yarn test:coverage
```

### Coverage Requirements

- Minimum 90% coverage for new code
- All public APIs must be tested
- Include both positive and negative test cases

## Documentation

### README Requirements

Each package should have a README with:
- Description
- Installation instructions
- Quick start example
- API reference
- Examples
- Contributing section
- License

### Example Template

```markdown
# @weave/example

Brief description of what this package does.

## Installation

\`\`\`bash
yarn add @weave/example
\`\`\`

## Quick Start

\`\`\`typescript
// Example usage
\`\`\`

## API Reference

### functionName(param)

Description...

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

Apache 2.0 - See [LICENSE](../../LICENSE)
```

## Pull Request Process

1. **Title**: Follow conventional commits format
2. **Description**: Clearly describe the change and why it's needed
3. **Tests**: Include tests for all new functionality
4. **Documentation**: Update docs if behavior changes
5. **Breaking Changes**: Clearly indicate any breaking changes
6. **Checklist**: Verify:
   - ✅ Tests pass
   - ✅ ESLint passes
   - ✅ TypeScript strict mode passes
   - ✅ Documentation updated
   - ✅ No `any` types introduced
   - ✅ Code follows style guidelines

### Review Process

- At least one maintainer review required
- CI/CD must pass
- No merge conflicts
- Comprehensive test coverage

## Reporting Issues

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Code snippet if applicable

### Feature Requests

Include:
- Clear description of requested feature
- Use cases and examples
- Proposed API (if applicable)
- Why this feature is needed

## Architecture Decisions

For significant changes (new features, major refactors), please create an RFC (Request for Comments):

1. Discuss the change in a GitHub Issue first
2. Create an Architecture Decision Record (ADR)
3. Get community feedback
4. Implement after consensus

## Performance Considerations

- Benchmark before/after for performance changes
- Keep bundle sizes small (core <50KB gzipped)
- Lazy load providers and integrations
- Prefer composition over inheritance

## Security

- Never commit API keys or secrets
- Use environment variables for configuration
- Validate all user inputs
- Review dependencies for vulnerabilities

## Release Process

Releases are handled by maintainers using:

```bash
yarn version:major    # For breaking changes
yarn version:minor    # For new features
yarn version:patch    # For bug fixes
```

This automatically:
1. Updates version in package.json
2. Updates CHANGELOG.md
3. Creates git tag
4. Publishes to npm via GitHub Actions

## Need Help?

- **Documentation**: Check the [docs](./docs/)
- **Examples**: Look in [examples](./examples/)
- **Discussions**: Start a GitHub Discussion
- **Issues**: Search existing issues or create new one

## Recognition

Contributors will be:
- Added to CONTRIBUTORS.md
- Credited in release notes
- Recognized in monthly community call

---

Thank you for contributing to Weave! 🚀
