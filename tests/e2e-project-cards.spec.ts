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

const MAX = parseInt(process.env.TEST_MAX_CARDS || '4', 10); // limit for stability

test.describe('Project cards (live data)', () => {
  test('dashboard cards link to detail page with id param', async ({ page }) => {
    await page.goto('/index.html');
    const cards = page.locator('.project-card');
    await expect(cards).toHaveCountGreaterThan(0);

    const count = await cards.count();
    const take = Math.min(count, MAX);
    for (let i = 0; i < take; i++) {
      const href = await cards.nth(i).getAttribute('href');
      expect(href, `card ${i} href has id`).toMatch(/project-detail\.html\?id=[^&]+/);
    }
  });

  test('each clicked card renders real details (or hides placeholders)', async ({ page }) => {
    await page.goto('/index.html');

    const cards = page.locator('.project-card');
    await expect(cards).toHaveCountGreaterThan(0);

    const count = await cards.count();
    const take = Math.min(count, MAX);

    for (let i = 0; i < take; i++) {
      const href = await cards.nth(i).getAttribute('href');
      test.info().annotations.push({ type: 'note', description: `Testing card #${i}: ${href}` });

      const [response] = await Promise.all([
        page.waitForResponse(r =>
          r.url().includes('raw.githubusercontent.com') &&
          (r.status() === 200 || r.status() === 304)
        , { timeout: 15000 }).catch(() => null),
        cards.nth(i).click()
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

      // Title must be meaningful
      await expect(titleEl).toHaveText((t) => isMeaningful(t));

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
        await expect(items).toHaveCountGreaterThan(0);
      }
      if (await techList.isVisible().catch(() => false)) {
        const items = techList.locator('li');
        await expect(items).toHaveCountGreaterThan(0);
      }

      // Verify that at least one live fetch happened (response may be null if cached, so allow either)
      if (!response) {
        test.info().annotations.push({ type: 'note', description: 'Used cache; no live fetch observed' });
      }

      // Go back to dashboard for next card
      await page.goBack();
      await expect(cards).toHaveCountGreaterThan(0);
    }
  });
});
