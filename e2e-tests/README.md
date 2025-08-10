# End-to-End Testing Suite

This directory contains comprehensive end-to-end tests for the ProjectStatus web application using Playwright.

## Test Overview

The e2e test suite consists of **14 tests** across **2 test files** that validate the complete user experience from dashboard to project details.

### Test Files

1. **`e2e-project-cards.spec.ts`** - Core project card functionality and navigation
2. **`e2e-ui-interactions.spec.ts`** - UI interactions, edge cases, and accessibility

## Test Coverage

### Core Functionality (7 tests)

1. **Dashboard cards are clickable and navigate to detail page**
   - Validates that project cards are interactive
   - Ensures proper navigation to detail pages
   - Tests URL parameter handling

2. **Each clicked card renders real details (or hides placeholders)**
   - Verifies meaningful content is displayed
   - Tests progress bar accuracy
   - Validates feature and technical lists
   - Ensures no placeholder content is shown when data is available

3. **Dashboard shows loading state and then populated cards**
   - Tests loading state visibility
   - Validates transition from loading to populated state
   - Ensures proper card structure

4. **Project detail page handles invalid project IDs gracefully**
   - Tests error handling for invalid URLs
   - Ensures graceful degradation

5. **Project cards have proper accessibility attributes**
   - Validates interactive behavior
   - Tests keyboard navigation support

6. **Project detail page action buttons are functional**
   - Tests refresh functionality
   - Validates edit button behavior
   - Ensures proper event handling

7. **Navigation breadcrumbs work correctly**
   - Tests breadcrumb navigation
   - Validates context preservation
   - Ensures proper return to dashboard

### UI Interactions & Edge Cases (7 tests)

8. **Mobile menu toggle works correctly**
   - Tests responsive design
   - Validates mobile menu functionality
   - Tests viewport-specific behavior

9. **Keyboard shortcuts work on project detail page**
   - Tests Ctrl+R refresh shortcut
   - Validates Ctrl+E edit shortcut
   - Ensures keyboard accessibility

10. **Project cards show proper hover effects**
    - Tests CSS hover animations
    - Validates visual feedback
    - Ensures smooth transitions

11. **Project detail page handles network errors gracefully**
    - Tests error handling for network failures
    - Validates graceful degradation
    - Ensures application remains functional

12. **Project cards have consistent styling across different projects**
    - Tests visual consistency
    - Validates layout uniformity
    - Ensures proper dimensions

13. **Breadcrumb navigation preserves project context**
    - Tests context preservation
    - Validates navigation flow
    - Ensures proper state management

14. **Project detail page sections are collapsible**
    - Tests interactive sections
    - Validates animation behavior
    - Ensures proper state changes

## Running the Tests

### Prerequisites

- Node.js and npm installed
- Python 3 for the web server
- Playwright browsers installed

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all tests
npx playwright test

# Run tests with browser visible
npx playwright test --headed

# Run specific test file
npx playwright test e2e-project-cards.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium

# Run tests with debug mode
npx playwright test --debug
```

### Test Configuration

The tests are configured in `playwright.config.ts`:

- **Base URL**: `http://localhost:8000`
- **Web Server**: Python HTTP server on port 8000
- **Browser**: Chromium
- **Retries**: 1 retry on failure
- **Timeout**: 30 seconds per test
- **Parallel**: Tests run in parallel for efficiency

### Environment Variables

- `TEST_MAX_CARDS`: Maximum number of project cards to test (default: 2)
- `PLAYWRIGHT_HEADLESS`: Set to false to run with browser visible

## Test Data

The tests use live data from GitHub repositories defined in the application. The test suite:

- Loads real project data from GitHub
- Tests with actual project content
- Validates data parsing and rendering
- Ensures meaningful content display

## Test Results

### Success Criteria

All tests should pass with:
- ✅ **14/14 tests passing**
- ✅ **No flaky tests**
- ✅ **Consistent behavior across runs**
- ✅ **Proper error handling**
- ✅ **Accessibility compliance**

### Debugging Failed Tests

1. **View test traces**:
   ```bash
   npx playwright show-trace test-results/[test-name]/trace.zip
   ```

2. **Run in debug mode**:
   ```bash
   npx playwright test --debug
   ```

3. **Check error context**:
   - Review `test-results/[test-name]/error-context.md`
   - Examine page snapshots and console logs

## Continuous Integration

The test suite is designed for CI/CD integration:

- **Fast execution** (~20 seconds for full suite)
- **Reliable results** with proper retry logic
- **Parallel execution** for efficiency
- **Comprehensive coverage** of user workflows

## Maintenance

### Adding New Tests

1. Create test in appropriate spec file
2. Follow existing patterns and naming conventions
3. Include proper error handling and timeouts
4. Test both success and failure scenarios

### Updating Tests

When the application changes:

1. Update selectors if DOM structure changes
2. Adjust timeouts for slower operations
3. Update expected content for new features
4. Maintain backward compatibility where possible

### Best Practices

- Use descriptive test names
- Include proper assertions
- Handle async operations correctly
- Test edge cases and error scenarios
- Maintain test independence
- Use appropriate wait strategies

## Performance

- **Total execution time**: ~20 seconds
- **Parallel workers**: 4
- **Memory usage**: Optimized for CI environments
- **Network efficiency**: Minimal external requests

## Troubleshooting

### Common Issues

1. **Server not starting**: Ensure Python 3 is available
2. **Tests timing out**: Check network connectivity to GitHub
3. **Selector failures**: Verify DOM structure hasn't changed
4. **Flaky tests**: Increase timeouts or add retry logic

### Getting Help

- Check test logs for detailed error information
- Review browser console for JavaScript errors
- Examine network requests for API issues
- Use Playwright's debugging tools for step-by-step analysis
