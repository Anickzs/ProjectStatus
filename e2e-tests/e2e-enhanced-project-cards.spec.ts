import { test, expect } from '@playwright/test';

test.describe('Enhanced Project Cards Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main dashboard
    await page.goto('http://localhost:8000/index.html');
    
    // Wait for the page to load and projects to populate
    await page.waitForSelector('.project-card', { timeout: 10000 });
  });

  test('should display enhanced project cards with comprehensive information', async ({ page }) => {
    // Wait for projects to load
    await page.waitForTimeout(2000);
    
    // Get all project cards
    const projectCards = await page.locator('.project-card').all();
    expect(projectCards.length).toBeGreaterThan(0);
    
    console.log(`Found ${projectCards.length} project cards`);
    
    // Check the first project card (should be DIY project)
    const firstCard = projectCards[0];
    
    // Log the actual HTML content to see what's being displayed
    const cardHTML = await firstCard.innerHTML();
    console.log('=== ACTUAL PROJECT CARD HTML ===');
    console.log(cardHTML);
    console.log('=== END HTML ===');
    
    // Check for enhanced content sections
    const hasTechStack = await firstCard.locator('.tech-stack').count() > 0;
    const hasKeyFeatures = await firstCard.locator('.key-features').count() > 0;
    const hasProjectFooter = await firstCard.locator('.project-footer').count() > 0;
    
    console.log('Enhanced sections found:');
    console.log('- Tech Stack:', hasTechStack);
    console.log('- Key Features:', hasKeyFeatures);
    console.log('- Project Footer:', hasProjectFooter);
    
    // Check for feature counts in headers
    const completedHeader = await firstCard.locator('.content-section.completed h4').textContent();
    const nextStepsHeader = await firstCard.locator('.content-section.next-steps h4').textContent();
    
    console.log('Section headers:');
    console.log('- Completed:', completedHeader);
    console.log('- Next Steps:', nextStepsHeader);
    
    // Check for tech tags
    const techTags = await firstCard.locator('.tech-tag').all();
    console.log(`Tech tags found: ${techTags.length}`);
    
    for (let i = 0; i < Math.min(techTags.length, 3); i++) {
      const tagText = await techTags[i].textContent();
      console.log(`- Tech tag ${i + 1}:`, tagText);
    }
    
    // Check for action buttons
    const viewDetailsBtn = await firstCard.locator('.view-details-btn').count() > 0;
    const expandBtn = await firstCard.locator('.expand-card-btn').count() > 0;
    
    console.log('Action buttons:');
    console.log('- View Details:', viewDetailsBtn);
    console.log('- Expand/Collapse:', expandBtn);
  });

  test('should show more than 3 features in each section', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const firstCard = page.locator('.project-card').first();
    
    // Count completed features
    const completedFeatures = await firstCard.locator('.content-section.completed li').all();
    console.log(`Completed features found: ${completedFeatures.length}`);
    
    // Count next steps
    const nextSteps = await firstCard.locator('.content-section.next-steps li').all();
    console.log(`Next steps found: ${nextSteps.length}`);
    
    // Log the first few features
    console.log('First 3 completed features:');
    for (let i = 0; i < Math.min(completedFeatures.length, 3); i++) {
      const featureText = await completedFeatures[i].textContent();
      console.log(`- ${featureText}`);
    }
    
    console.log('First 3 next steps:');
    for (let i = 0; i < Math.min(nextSteps.length, 3); i++) {
      const stepText = await nextSteps[i].textContent();
      console.log(`- ${stepText}`);
    }
    
    // Should show more than 3 features (enhanced display)
    expect(completedFeatures.length).toBeGreaterThan(3);
    expect(nextSteps.length).toBeGreaterThan(3);
  });

  test('should have interactive expand/collapse functionality', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const firstCard = page.locator('.project-card').first();
    const expandBtn = firstCard.locator('.expand-card-btn');
    
    // Check if expand button exists
    const expandBtnExists = await expandBtn.count() > 0;
    console.log('Expand button exists:', expandBtnExists);
    
    if (expandBtnExists) {
      // Get initial button text
      const initialText = await expandBtn.textContent();
      console.log('Initial button text:', initialText);
      
      // Click expand button
      await expandBtn.click();
      await page.waitForTimeout(500);
      
      // Check if card is expanded
      const isExpanded = await firstCard.locator('.expanded').count() > 0;
      console.log('Card expanded:', isExpanded);
      
      // Get button text after click
      const afterClickText = await expandBtn.textContent();
      console.log('Button text after click:', afterClickText);
      
      // Should show "Show Less" when expanded
      expect(afterClickText).toContain('Show Less');
    }
  });

  test('should display technical stack information', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const firstCard = page.locator('.project-card').first();
    
    // Check for tech stack section
    const techStackSection = firstCard.locator('.tech-stack');
    const techStackExists = await techStackSection.count() > 0;
    console.log('Tech stack section exists:', techStackExists);
    
    if (techStackExists) {
      // Get tech stack header
      const techStackHeader = await techStackSection.locator('h4').textContent();
      console.log('Tech stack header:', techStackHeader);
      
      // Get tech tags
      const techTags = await techStackSection.locator('.tech-tag').all();
      console.log(`Tech tags found: ${techTags.length}`);
      
      // Log tech tag contents
      for (let i = 0; i < techTags.length; i++) {
        const tagText = await techTags[i].textContent();
        const isMoreTag = await techTags[i].locator('.more').count() > 0;
        console.log(`- Tech tag ${i + 1}: "${tagText}" (more tag: ${isMoreTag})`);
      }
      
      // Should have tech tags
      expect(techTags.length).toBeGreaterThan(0);
    }
  });

  test('should display key features section', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const firstCard = page.locator('.project-card').first();
    
    // Check for key features section
    const keyFeaturesSection = firstCard.locator('.key-features');
    const keyFeaturesExists = await keyFeaturesSection.count() > 0;
    console.log('Key features section exists:', keyFeaturesExists);
    
    if (keyFeaturesExists) {
      // Get key features header
      const keyFeaturesHeader = await keyFeaturesSection.locator('h4').textContent();
      console.log('Key features header:', keyFeaturesHeader);
      
      // Get key features list
      const keyFeatures = await keyFeaturesSection.locator('li').all();
      console.log(`Key features found: ${keyFeatures.length}`);
      
      // Log key features
      for (let i = 0; i < Math.min(keyFeatures.length, 5); i++) {
        const featureText = await keyFeatures[i].textContent();
        console.log(`- Key feature ${i + 1}: ${featureText}`);
      }
      
      // Should have key features
      expect(keyFeatures.length).toBeGreaterThan(0);
    }
  });

  test('should have navigation buttons', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const firstCard = page.locator('.project-card').first();
    
    // Check for project footer
    const projectFooter = firstCard.locator('.project-footer');
    const footerExists = await projectFooter.count() > 0;
    console.log('Project footer exists:', footerExists);
    
    if (footerExists) {
      // Check for view details button
      const viewDetailsBtn = projectFooter.locator('.view-details-btn');
      const viewDetailsExists = await viewDetailsBtn.count() > 0;
      console.log('View details button exists:', viewDetailsExists);
      
      if (viewDetailsExists) {
        const viewDetailsText = await viewDetailsBtn.textContent();
        console.log('View details button text:', viewDetailsText);
        expect(viewDetailsText).toContain('View Full Details');
      }
      
      // Check for expand button
      const expandBtn = projectFooter.locator('.expand-card-btn');
      const expandExists = await expandBtn.count() > 0;
      console.log('Expand button exists:', expandExists);
      
      if (expandExists) {
        const expandText = await expandBtn.textContent();
        console.log('Expand button text:', expandText);
        expect(expandText).toContain('Show More');
      }
    }
  });
});
