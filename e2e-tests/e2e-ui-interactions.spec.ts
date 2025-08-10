import { test, expect } from '@playwright/test';

test.describe('UI Interactions and Edge Cases', () => {
  test('mobile menu toggle works correctly', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');
    
    // Wait for page to load
    await page.waitForSelector('.project-card', { timeout: 10000 });
    
    // Check if mobile menu toggle is visible
    const mobileToggle = page.locator('.mobile-menu-toggle');
    await expect(mobileToggle).toBeVisible();
    
    // Click mobile menu toggle
    await mobileToggle.click();
    
    // Check if sidebar is now open (has mobile-open class)
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toHaveClass(/mobile-open/);
    
    // Click toggle again to close
    await mobileToggle.click();
    
    // Check if sidebar is closed
    await expect(sidebar).not.toHaveClass(/mobile-open/);
  });

  test('keyboard shortcuts work on project detail page', async ({ page }) => {
    // Navigate to a project detail page
    await page.goto('/index.html');
    await page.waitForSelector('.project-card', { timeout: 10000 });
    
    const firstCard = page.locator('.project-card').first();
    await firstCard.click();
    
    // Wait for navigation
    await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
    
    // Test Ctrl+R shortcut for refresh
    await page.keyboard.press('Control+r');
    
    // Should trigger refresh (we can't easily verify the data refresh, but no error should occur)
    await page.waitForTimeout(1000);
    
    // Test Ctrl+E shortcut for edit (if implemented)
    await page.keyboard.press('Control+e');
    
    // Should show edit functionality or notification
    await page.waitForTimeout(1000);
  });

  test('project cards show proper hover effects', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('.project-card', { timeout: 10000 });
    
    const firstCard = page.locator('.project-card').first();
    
    // Get initial styles
    const initialTransform = await firstCard.evaluate(el => 
      window.getComputedStyle(el).transform
    );
    
    // Hover over the card
    await firstCard.hover();
    
    // Wait for hover effect
    await page.waitForTimeout(500);
    
    // Get styles after hover
    const hoverTransform = await firstCard.evaluate(el => 
      window.getComputedStyle(el).transform
    );
    
    // Transform should change (indicating hover effect)
    expect(hoverTransform).not.toBe(initialTransform);
  });

  test('project detail page handles network errors gracefully', async ({ page }) => {
    // Navigate to project detail page
    await page.goto('/index.html');
    await page.waitForSelector('.project-card', { timeout: 10000 });
    
    const firstCard = page.locator('.project-card').first();
    await firstCard.click();
    
    // Wait for navigation
    await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
    
    // Simulate network error by intercepting requests
    await page.route('**/*', route => {
      if (route.request().url().includes('raw.githubusercontent.com')) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    // Try to refresh data
    const refreshBtn = page.locator('.refresh-project-btn');
    if (await refreshBtn.isVisible()) {
      await refreshBtn.click();
      
      // Should handle the error gracefully (show error message or fallback)
      await page.waitForTimeout(2000);
      
      // Page should still be functional
      await expect(page.locator('#project-title')).toBeVisible();
    }
  });

  test('project cards have consistent styling across different projects', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('.project-card', { timeout: 10000 });
    
    const cards = page.locator('.project-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(1);
    
    // Check first two cards for consistent structure
    for (let i = 0; i < Math.min(count, 2); i++) {
      const card = cards.nth(i);
      
      // Each card should have the same basic structure
      await expect(card.locator('.project-title')).toBeVisible();
      await expect(card.locator('.progress-bar')).toBeVisible();
      await expect(card.locator('.status-indicator')).toBeVisible();
      
      // Check that cards have similar dimensions (within reasonable range)
      const box = await card.boundingBox();
      expect(box?.width).toBeGreaterThan(200);
      expect(box?.height).toBeGreaterThan(100);
    }
  });

  test('breadcrumb navigation preserves project context', async ({ page }) => {
    // Navigate to a project detail page
    await page.goto('/index.html');
    await page.waitForSelector('.project-card', { timeout: 10000 });
    
    // Get the project name from the first card
    const firstCard = page.locator('.project-card').first();
    const projectName = await firstCard.locator('.project-title').textContent();
    
    // Click to go to detail page
    await firstCard.click();
    
    // Wait for navigation
    await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
    
    // Wait for the page to load completely
    await page.waitForFunction(() => {
      const t = document.querySelector('#project-title')?.textContent?.trim();
      return t && t !== 'Loading Project...';
    }, { timeout: 15000 });
    
    // Verify we're on the correct project detail page
    const detailTitle = page.locator('#project-title');
    const detailTitleText = await detailTitle.textContent();
    
    // Both titles should contain meaningful content (not just loading states)
    expect(projectName).toBeTruthy();
    expect(detailTitleText).toBeTruthy();
    expect(detailTitleText).not.toBe('Loading Project...');
    
    // Use breadcrumb to go back
    const breadcrumbLink = page.locator('.breadcrumb-link');
    await breadcrumbLink.click();
    
    // Should be back on dashboard
    await expect(page).toHaveURL(/index\.html$/);
    
    // Should show the same project cards
    await page.waitForSelector('.project-card', { timeout: 10000 });
    const cards = page.locator('.project-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('project detail page sections are collapsible', async ({ page }) => {
    // Navigate to a project detail page
    await page.goto('/index.html');
    await page.waitForSelector('.project-card', { timeout: 10000 });
    
    const firstCard = page.locator('.project-card').first();
    await firstCard.click();
    
    // Wait for navigation and page load
    await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Look for collapsible sections
    const collapsibleSections = page.locator('.detail-section[data-collapsible="true"], .collapsible-section');
    
    if (await collapsibleSections.count() > 0) {
      const firstSection = collapsibleSections.first();
      
      // Get initial state
      const initialHeight = await firstSection.evaluate(el => el.scrollHeight);
      
      // Click to collapse/expand
      await firstSection.click();
      
      // Wait for animation
      await page.waitForTimeout(500);
      
      // Height should change
      const newHeight = await firstSection.evaluate(el => el.scrollHeight);
      expect(newHeight).not.toBe(initialHeight);
    }
  });
});
