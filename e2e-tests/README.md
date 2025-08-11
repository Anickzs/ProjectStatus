# Project Detail E2E Tests

This directory contains comprehensive end-to-end tests for the ProjectStatus application, specifically focusing on project detail page functionality and data population.

## 🧪 Test Suites

### 1. Project Detail Features (`e2e-project-detail-features.spec.ts`)
Tests all interactive features of the project detail page:

- **Navigation & Structure**: Verifies proper navigation from dashboard to detail pages
- **Task Management**: Tests task categories, collapsible sections, and add task functionality
- **Project Timeline**: Validates timeline events display and structure
- **Recent Activity**: Tests activity log functionality and toggle features
- **Project Actions**: Tests all action buttons (refresh, edit, delete, export, share)
- **File Management**: Tests file upload modal and file display
- **Breadcrumb Navigation**: Verifies proper navigation back to dashboard
- **Mobile Menu**: Tests mobile responsiveness and sidebar functionality
- **Keyboard Shortcuts**: Tests keyboard navigation (Ctrl+E, Ctrl+T, Ctrl+U, Escape)

### 2. Data Population & Validation (`e2e-data-population.spec.ts`)
Focuses on verifying that all data is correctly populated from GitHub:

- **Project Overview**: Tests title, description, and metadata display
- **Task Sections**: Validates tasks are properly categorized and displayed
- **Timeline Events**: Ensures timeline shows meaningful project events
- **Activity Log**: Verifies recent activities are properly displayed
- **Project Metadata**: Tests status, phase, progress, and last updated fields
- **Files Section**: Validates file management structure

### 3. Project Cards Basic (`e2e-project-cards.spec.ts`)
Tests basic project card functionality:

- **Card Navigation**: Verifies cards are clickable and navigate properly
- **Data Rendering**: Tests that detail pages show real data instead of placeholders
- **Loading States**: Validates proper loading and error handling
- **Accessibility**: Tests basic accessibility features
- **Error Handling**: Tests graceful handling of invalid project IDs

## 🚀 Running the Tests

### Prerequisites

1. **Start the development server**:
   ```bash
   # Option 1: Use the start script
   ./start-server.sh
   
   # Option 2: Manual server start
   cd web-app && python3 server.py 8000
   ```

2. **Install Playwright** (if not already installed):
   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```

### Running All Tests

```bash
cd e2e-tests
./run-project-detail-tests.sh
```

### Running Specific Test Suites

```bash
# Run only feature tests
./run-project-detail-tests.sh --features

# Run only data population tests
./run-project-detail-tests.sh --data

# Run only project cards tests
./run-project-detail-tests.sh --cards

# Run all tests (default)
./run-project-detail-tests.sh --all
```

### Manual Test Execution

```bash
# Run specific test file
npx playwright test e2e-project-detail-features.spec.ts

# Run with specific browser
npx playwright test --project=chromium

# Run with headed mode (see browser)
npx playwright test --headed

# Run with debug mode
npx playwright test --debug
```

## ⚙️ Configuration

### Environment Variables

- `TEST_MAX_CARDS`: Number of project cards to test (default: 2)
- `NODE_ENV`: Test environment (default: test)

### Playwright Configuration

The tests use the configuration in `playwright.config.ts`:
- Base URL: `http://localhost:8000`
- Browser: Chromium
- Timeout: 30 seconds for web server startup
- Retries: 1 on failure

## 📊 Test Coverage

### Project Detail Page Features Tested

| Feature | Test Coverage | Status |
|---------|---------------|--------|
| Project Overview | ✅ Complete | All sections validated |
| Task Management | ✅ Complete | Categories, collapsible, add task |
| Project Timeline | ✅ Complete | Events, structure, content |
| Recent Activity | ✅ Complete | Log display, toggle functionality |
| Project Actions | ✅ Complete | All buttons functional |
| File Management | ✅ Complete | Upload modal, file display |
| Navigation | ✅ Complete | Breadcrumbs, mobile menu |
| Keyboard Shortcuts | ✅ Complete | All shortcuts tested |
| Data Population | ✅ Complete | GitHub data validation |
| Error Handling | ✅ Complete | Invalid IDs, loading states |

### Data Validation

| Data Type | Validation | Status |
|-----------|------------|--------|
| Project Title | Meaningful content, no loading states | ✅ |
| Project Description | Proper formatting, meaningful content | ✅ |
| Project Status | Valid status values | ✅ |
| Project Phase | Valid phase information | ✅ |
| Progress Bar | Consistent width and text values | ✅ |
| Task Lists | Proper categorization, meaningful content | ✅ |
| Timeline Events | Valid events with dates and descriptions | ✅ |
| Activity Log | Meaningful activities with timestamps | ✅ |
| File Structure | Proper file display and actions | ✅ |

## 🔧 Troubleshooting

### Common Issues

1. **Server Not Running**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:8000
   ```
   **Solution**: Start the development server first using `./start-server.sh`

2. **Tests Timeout**
   ```
   Error: Timeout 15000ms exceeded
   ```
   **Solution**: Increase timeout in test or check server performance

3. **No Project Cards Found**
   ```
   Error: Expected 0 to be greater than 0
   ```
   **Solution**: Ensure GitHub data is available and server is serving content

4. **Playwright Not Installed**
   ```
   Error: command not found: playwright
   ```
   **Solution**: Run `npm install -D @playwright/test && npx playwright install`

### Debug Mode

Run tests in debug mode to step through them:
```bash
npx playwright test --debug
```

### View Test Reports

After running tests, view detailed reports:
```bash
npx playwright show-report
```

## 📝 Test Development

### Adding New Tests

1. Create a new test file: `e2e-new-feature.spec.ts`
2. Follow the existing test structure
3. Use helper functions for common operations
4. Add proper error handling and timeouts

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

### Best Practices

1. **Use meaningful test names** that describe the expected behavior
2. **Wait for elements** before interacting with them
3. **Handle loading states** properly
4. **Use helper functions** for common operations
5. **Add proper assertions** to validate behavior
6. **Handle errors gracefully** with try-catch blocks
7. **Use environment variables** for configuration

## 🎯 Test Goals

These e2e tests ensure:

1. **Functionality**: All project detail features work correctly
2. **Data Integrity**: Information is properly populated from GitHub
3. **User Experience**: Navigation and interactions are smooth
4. **Reliability**: Features work consistently across different projects
5. **Accessibility**: Basic accessibility features are functional
6. **Error Handling**: Graceful handling of edge cases and errors

## 📈 Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: |
    cd e2e-tests
    ./run-project-detail-tests.sh
  env:
    TEST_MAX_CARDS: 1
```

## 🤝 Contributing

When adding new features to the project detail page:

1. **Add corresponding tests** to the appropriate test suite
2. **Update this README** with new test coverage
3. **Ensure tests pass** before submitting changes
4. **Follow existing patterns** for consistency

## 📞 Support

For issues with the e2e tests:

1. Check the troubleshooting section above
2. Review test logs and reports
3. Run tests in debug mode for detailed investigation
4. Ensure the development server is running correctly
