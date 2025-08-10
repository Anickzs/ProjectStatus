# E2E (Live Data) Tests

## Install
```bash
npm i -D @playwright/test
npx playwright install
```

## Run headless (fast)
```bash
npm run test:e2e
```

## Run headed (debug)
```bash
npm run test:e2e:headed
```

## Run with UI (interactive)
```bash
npm run test:e2e:ui
```

## Debug mode (step through)
```bash
npm run test:e2e:debug
```

## Limit cards to speed up the run
```bash
TEST_MAX_CARDS=2 npm run test:e2e
```

## What the tests do

The E2E tests perform the following actions:

1. **Dashboard Navigation**: Visit `/index.html` and verify project cards are loaded
2. **Card Validation**: Check that project cards have proper href attributes pointing to detail pages
3. **Detail Page Navigation**: Click each project card and navigate to `project-detail.html?id=...`
4. **Live Data Fetching**: Wait for GitHub API responses from `raw.githubusercontent.com`
5. **Content Validation**: Assert that:
   - Project titles are meaningful (not "Loading..." or "Unknown")
   - Project descriptions are meaningful when visible
   - Status and phase information are not placeholders when visible
   - Progress bars match their displayed percentages
   - Feature and technology lists have items when visible
6. **Cache Handling**: Tests work with both live fetches and cached responses

## Test Stability Features

- **Retries**: Tests retry once on failure
- **Tolerant Assertions**: Tests allow sections to be hidden instead of showing placeholders
- **Configurable Limits**: Use `TEST_MAX_CARDS` to limit the number of cards tested
- **Timeout Handling**: 15-second timeouts for network requests
- **Error Recovery**: Graceful handling of missing elements or network issues

## Browser Support

Currently configured for Chromium (Chrome) only. The tests use:
- Desktop Chrome viewport
- Full browser automation
- Network request interception
- DOM manipulation and validation
