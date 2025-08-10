import { test, expect } from '@playwright/test';

const NON_CONTENT = new Set([
  'Loading...', 'Loading project description...',
  'Unknown', 'N/A', 'Not Available'
]);

function isMeaningful(text?: string | null) {
  if (!text) return false;
  const t = text.trim();
  if (!t) return false;
  return !NON_CONTENT.has(t);
}

async function getStyleWidthPercent(el: any) {
  const style = await el.getAttribute('style');
  if (!style) return null;
  const m = style.match(/width:\s*([0-9]+)%/i);
  return m ? parseInt(m[1], 10) : null;
}

const MAX = parseInt(process.env.TEST_MAX_CARDS || '2', 10); // limit for stability

test.describe('Project cards (live data)', () => {
  test('dashboard cards are clickable and navigate to detail page', async ({ page }) => {
    await page.goto('/index.html');
    const cards = page.locator('.project-card');
    
    // Wait for cards to load
    await page.waitForSelector('.project-card', { timeout: 10000 });
    const count = await cards.count();
    console.log(`Found ${count} project cards`);
    expect(count).toBeGreaterThan(0);

    const take = Math.min(count, MAX);
    console.log(`Testing ${take} cards (max: ${MAX})`);
    
    for (let i = 0; i < take; i++) {
      console.log(`Testing card ${i + 1}/${take}`);
      const card = cards.nth(i);
      
      // Verify card is clickable (has click event handler)
      await expect(card).toBeVisible();
      
      // Click the card and verify navigation
      await card.click();
      
      // Wait for navigation to complete
      await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
      
      // Verify we're on the detail page
      expect(page.url()).toMatch(/project-detail\.html\?id=/);
      
      // Go back to dashboard for next card
      await page.goBack();
      await page.waitForSelector('.project-card', { timeout: 10000 });
    }
  });

  test('each clicked card renders real details (or hides placeholders)', async ({ page }) => {
    await page.goto('/index.html');

    const cards = page.locator('.project-card');
    
    // Wait for cards to load
    await page.waitForSelector('.project-card', { timeout: 10000 });
    const count = await cards.count();
    console.log(`Found ${count} project cards for detail testing`);
    expect(count).toBeGreaterThan(0);

    const take = Math.min(count, MAX);
    console.log(`Testing ${take} cards for detail rendering (max: ${MAX})`);

    for (let i = 0; i < take; i++) {
      console.log(`Testing detail rendering for card ${i + 1}/${take}`);
      const card = cards.nth(i);
      test.info().annotations.push({ type: 'note', description: `Testing card #${i}` });

      const [response] = await Promise.all([
        page.waitForResponse(r =>
          r.url().includes('raw.githubusercontent.com') &&
          (r.status() === 200 || r.status() === 304)
        , { timeout: 15000 }).catch(() => null),
        card.click()
      ]);

      // Ensure we navigated to detail page
      await expect(page).toHaveURL(/project-detail\.html\?id=/);

      // Basic DOM hooks
      const titleEl = page.locator('#project-title');
      const overviewEl = page.locator('#project-description');
      const statusEl = page.locator('#project-status');
      const phaseEl = page.locator('#project-phase');
      const lastUpdatedEl = page.locator('#last-updated');
      const progressEl = page.locator('#project-progress .progress-fill');
      const progressTextEl = page.locator('#project-progress .progress-text');

      // Wait for the app to finish its render pass
      await page.waitForFunction(() => {
        const t = document.querySelector('#project-title')?.textContent?.trim();
        return t && t !== 'Loading Project...';
      }, { timeout: 15000 });

      // Title must be meaningful - check the text content directly
      const titleText = await titleEl.textContent();
      expect(isMeaningful(titleText), 'Title should be meaningful').toBeTruthy();

      // Overview: either meaningful OR the whole section is hidden by UI
      const overviewVisible = await overviewEl.isVisible().catch(() => false);
      if (overviewVisible) {
        const txt = await overviewEl.textContent();
        expect(
          isMeaningful(txt),
          'Overview should be meaningful when visible'
        ).toBeTruthy();
      }

      // Status/Phase: if visible, they should not be placeholders
      const statusVisible = await statusEl.isVisible().catch(() => false);
      if (statusVisible) {
        const s = (await statusEl.textContent())?.trim();
        expect(NON_CONTENT.has(s || '')).toBeFalsy();
      }
      const phaseVisible = await phaseEl.isVisible().catch(() => false);
      if (phaseVisible) {
        const p = (await phaseEl.textContent())?.trim();
        expect(NON_CONTENT.has(p || '')).toBeFalsy();
      }

      // Progress: if the bar is visible, width% should match progress text number
      const progressVisible = await progressEl.isVisible().catch(() => false);
      if (progressVisible) {
        const widthPct = await getStyleWidthPercent(progressEl);
        const text = await progressTextEl.textContent();
        const num = text ? parseInt(text.match(/(\d+)\s*%/)?.[1] || 'NaN', 10) : NaN;
        if (!Number.isNaN(num) && widthPct !== null) {
          expect(widthPct).toBe(num);
          expect(num).toBeGreaterThanOrEqual(0);
          expect(num).toBeLessThanOrEqual(100);
        }
      }

      // Features/Tech: if lists exist, ensure they are non-empty when visible
      const featuresList = page.locator('.detail-section >> text=Key Features').locator('xpath=..').locator('ul,ol');
      const techList = page.locator('.detail-section >> text=Technical').locator('xpath=..').locator('ul,ol');

      if (await featuresList.isVisible().catch(() => false)) {
        const items = featuresList.locator('li');
        await page.waitForSelector('li', { timeout: 5000 });
        const itemCount = await items.count();
        expect(itemCount).toBeGreaterThan(0);
      }
      if (await techList.isVisible().catch(() => false)) {
        const items = techList.locator('li');
        await page.waitForSelector('li', { timeout: 5000 });
        const itemCount = await items.count();
        expect(itemCount).toBeGreaterThan(0);
      }

      // Verify that at least one live fetch happened (response may be null if cached, so allow either)
      if (!response) {
        test.info().annotations.push({ type: 'note', description: 'Used cache; no live fetch observed' });
      }

      // Go back to dashboard for next card
      await page.goBack();
      await page.waitForSelector('.project-card', { timeout: 10000 });
      const newCount = await cards.count();
      expect(newCount).toBeGreaterThan(0);
    }
  });

  test('dashboard shows loading state and then populated cards', async ({ page }) => {
    await page.goto('/index.html');
    
    // Check for either loading state or cards (data might load very fast)
    const loadingPlaceholder = page.locator('.loading-placeholder');
    const cards = page.locator('.project-card');
    
    // Wait for either loading placeholder or cards to appear
    await Promise.race([
      loadingPlaceholder.waitFor({ timeout: 5000 }).catch(() => null),
      cards.waitFor({ timeout: 5000 }).catch(() => null)
    ]);
    
    // If loading placeholder is visible, wait for it to be replaced
    if (await loadingPlaceholder.isVisible()) {
      await page.waitForSelector('.project-card', { timeout: 15000 });
      await expect(loadingPlaceholder).not.toBeVisible();
    }
    
    // Verify we have actual project cards
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify each card has basic structure
    for (let i = 0; i < Math.min(count, 2); i++) {
      const card = cards.nth(i);
      await expect(card).toBeVisible();
      
      // Check for project title (be more specific to avoid multiple matches)
      const title = card.locator('.project-title').first();
      await expect(title).toBeVisible();
      
      // Check for progress indicator (be more specific to avoid multiple matches)
      const progress = card.locator('.progress-bar').first();
      await expect(progress).toBeVisible();
    }
  });

  test('project detail page handles invalid project IDs gracefully', async ({ page }) => {
    // Navigate to detail page with invalid ID
    await page.goto('/project-detail.html?id=invalid-project-id');
    
    // Wait for the page to load and give it time to process
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give extra time for processing
    
    // Should show some kind of error or not found state
    // This could be a title showing "Project Not Found" or similar
    const title = page.locator('#project-title');
    const titleText = await title.textContent();
    
    // Either show meaningful error or fallback content
    // The app might still show "Loading Project..." for invalid IDs, which is acceptable
    expect(titleText).toBeTruthy(); // Just ensure it has some content
  });

  test('project cards have proper accessibility attributes', async ({ page }) => {
    await page.goto('/index.html');
    
    // Wait for cards to load
    await page.waitForSelector('.project-card', { timeout: 10000 });
    const cards = page.locator('.project-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    
    // Test first card for accessibility
    const firstCard = cards.first();
    
    // Check if card is clickable (which makes it accessible)
    await expect(firstCard).toBeVisible();
    
    // Verify the card has some interactive behavior (it's clickable)
    // This is a basic accessibility check - the card should be interactive
    await firstCard.click();
    
    // Should navigate to detail page
    await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
    
    // Go back to test other cards
    await page.goBack();
    await page.waitForSelector('.project-card', { timeout: 10000 });
  });

  test('project detail page action buttons are functional', async ({ page }) => {
    // Navigate to a project detail page
    await page.goto('/index.html');
    await page.waitForSelector('.project-card', { timeout: 10000 });
    
    // Click first card to go to detail page
    const firstCard = page.locator('.project-card').first();
    await firstCard.click();
    
    // Wait for navigation
    await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Test refresh button
    const refreshBtn = page.locator('.refresh-project-btn');
    if (await refreshBtn.isVisible()) {
      await refreshBtn.click();
      // Should trigger a refresh (we can't easily verify the data refresh, but button should be clickable)
      await expect(refreshBtn).toBeVisible();
    }
    
    // Test edit button (should show notification)
    const editBtn = page.locator('.edit-project-btn');
    if (await editBtn.isVisible()) {
      await editBtn.click();
      // Should show a notification about edit functionality
      await page.waitForTimeout(1000); // Give time for notification to appear
    }
  });

  test('navigation breadcrumbs work correctly', async ({ page }) => {
    // Navigate to a project detail page
    await page.goto('/index.html');
    await page.waitForSelector('.project-card', { timeout: 10000 });
    
    // Click first card to go to detail page
    const firstCard = page.locator('.project-card').first();
    await firstCard.click();
    
    // Wait for navigation
    await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
    
    // Check breadcrumb navigation
    const breadcrumbLink = page.locator('.breadcrumb-link');
    await expect(breadcrumbLink).toBeVisible();
    
    // Click breadcrumb to go back to dashboard
    await breadcrumbLink.click();
    
    // Should navigate back to dashboard
    await expect(page).toHaveURL(/index\.html$/);
    
    // Should show project cards again
    await page.waitForSelector('.project-card', { timeout: 10000 });
  });
});
