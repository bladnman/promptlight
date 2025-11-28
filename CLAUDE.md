

## Core Principles

**Separation of Concerns**: Keep logic, presentation, and data handling in distinct layers. Components should have single responsibilities.

**Code Reuse**: Extract repeated patterns into shared utilities. Don't duplicate—consolidate.

**No Magic Numbers**: All literal values (numbers, strings, thresholds) must be extracted to configuration. If a value appears in code, it should be a named constant or config reference.

## Configuration Architecture

- Centralize configuration in dedicated config files/modules
- Layer-appropriate configs (app-level, feature-level, environment-level)
- All tunable values externalized—no hardcoded behavior buried in logic
- Use environment variables for deployment-specific values

## Design System

- **No inline design values**: Colors, spacing, typography, breakpoints live in a design system/theme, not in component code
- Define design tokens once, reference everywhere via variables
- Component styling references the design system—never raw hex codes or pixel values in components
- Maintain a single source of truth for visual language

## Code Quality

- **Lint compliance**: Code must pass linting without warnings
- **Consistent formatting**: Follow project formatter settings
- **Meaningful names**: Variables, functions, and files should be self-documenting
- **Clean imports**: No unused imports, logical grouping

## Testing

- Write tests where they provide value—critical paths, complex logic, edge cases
- Tests should be maintainable, not exhaustive for the sake of coverage
- Prefer integration tests for user-facing flows, unit tests for isolated logic

## File Organization

- Group by feature/domain, not by file type
- Colocate related files (component + styles + tests + types)
- Clear naming conventions that indicate purpose

