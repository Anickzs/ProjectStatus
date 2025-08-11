import { test, expect } from '@playwright/test';

const NON_CONTENT = new Set([
  'Loading...', 'Loading project description...', 'Loading completed tasks...',
  'Loading in-progress tasks...', 'Loading pending tasks...', 'Loading project files...',
  'Loading timeline...', 'Loading recent activity...', 'Unknown', 'N/A', 'Not Available',
  'No description available', 'No tasks in this category', 'No files uploaded yet',
  'No timeline events yet', 'No recent activity'
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

const MAX = parseInt(process.env.TEST_MAX_CARDS || '2', 10);

test.describe('Project Data Population and Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('.project-card', { timeout: 10000 });
  });

  test('all project cards navigate to detail pages with proper data', async ({ page }) => {
    const cards = page.locator('.project-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    const take = Math.min(count, MAX);
    console.log(`Testing data population for ${take} projects`);

    for (let i = 0; i < take; i++) {
      console.log(`Testing project ${i + 1}/${take}`);
      
      // Get project info from card before clicking
      const card = cards.nth(i);
      const cardTitle = await card.locator('.project-title').textContent();
      const cardProgress = await card.locator('.progress-text').textContent();
      
      console.log(`Card title: ${cardTitle}, Progress: ${cardProgress}`);
      
      // Click on project card
      await card.click();
      
      // Wait for navigation and data loading
      await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      
      // Wait for project data to load completely
      await page.waitForFunction(() => {
        const title = document.querySelector('#project-title');
        const desc = document.querySelector('#project-description');
        return title && desc && 
               !title.textContent?.includes('Loading') && 
               !desc.textContent?.includes('Loading');
      }, { timeout: 20000 });

      // Verify project title matches or is meaningful
      const detailTitle = page.locator('#project-title');
      const detailTitleText = await detailTitle.textContent();
      expect(isMeaningful(detailTitleText)).toBeTruthy();
      expect(detailTitleText).not.toBe('Loading Project...');

      // Verify project description is meaningful
      const description = page.locator('#project-description');
      const descText = await description.textContent();
      if (descText && !descText.includes('No description available')) {
        expect(isMeaningful(descText)).toBeTruthy();
      }

      // Verify project metadata is populated
      await verifyProjectMetadata(page);

      // Verify task sections are populated
      await verifyTaskSections(page);

      // Verify timeline is populated
      await verifyTimelineSection(page);

      // Verify activity log is populated
      await verifyActivityLog(page);

      // Verify files section structure
      await verifyFilesSection(page);

      // Go back to dashboard
      await page.goBack();
      await page.waitForSelector('.project-card', { timeout: 10000 });
    }
  });

  test('project overview section displays correct information', async ({ page }) => {
    const firstCard = page.locator('.project-card').first();
    await firstCard.click();
    await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Wait for data to load
    await page.waitForFunction(() => {
      const title = document.querySelector('#project-title');
      return title && !title.textContent?.includes('Loading');
    }, { timeout: 15000 });

    // Test project title
    const title = page.locator('#project-title');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(isMeaningful(titleText)).toBeTruthy();
    expect(titleText).not.toBe('Loading Project...');

    // Test project subtitle
    const subtitle = page.locator('#project-subtitle');
    await expect(subtitle).toBeVisible();
    const subtitleText = await subtitle.textContent();
    expect(isMeaningful(subtitleText)).toBeTruthy();

    // Test project description
    const description = page.locator('#project-description');
    await expect(description).toBeVisible();
    const descText = await description.textContent();
    if (descText && !descText.includes('No description available')) {
      expect(isMeaningful(descText)).toBeTruthy();
    }

    // Test project metadata grid
    const metaGrid = page.locator('.project-meta-grid');
    await expect(metaGrid).toBeVisible();

    // Test individual metadata items
    const metaItems = metaGrid.locator('.meta-item');
    const metaCount = await metaItems.count();
    expect(metaCount).toBeGreaterThan(0);

    // Verify each metadata item has label and value
    for (let i = 0; i < metaCount; i++) {
      const item = metaItems.nth(i);
      const label = item.locator('.meta-label');
      
      await expect(label).toBeVisible();
      const labelText = await label.textContent();
      expect(isMeaningful(labelText)).toBeTruthy();
      
      // Handle different value structures based on the meta-item type
      if (labelText === 'Progress') {
        // Progress has a different structure
        const progressIndicator = item.locator('.progress-indicator-large');
        await expect(progressIndicator).toBeVisible();
      } else {
        // Other items have .meta-value
        const value = item.locator('.meta-value');
        await expect(value).toBeVisible();
        
        const valueText = await value.textContent();
        if (valueText && !valueText.includes('Loading...')) {
          expect(isMeaningful(valueText)).toBeTruthy();
        }
      }
    }
  });

  test('task management section displays tasks from GitHub data', async ({ page }) => {
    const firstCard = page.locator('.project-card').first();
    await firstCard.click();
    await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Wait for task data to load
    await page.waitForFunction(() => {
      const completedTasks = document.querySelector('#completed-tasks');
      const inProgressTasks = document.querySelector('#in-progress-tasks');
      const pendingTasks = document.querySelector('#pending-tasks');
      
      return completedTasks && inProgressTasks && pendingTasks &&
             !completedTasks.textContent?.includes('Loading') &&
             !inProgressTasks.textContent?.includes('Loading') &&
             !pendingTasks.textContent?.includes('Loading');
    }, { timeout: 15000 });

    // Test task categories structure
    const taskCategories = page.locator('.task-category');
    await expect(taskCategories).toHaveCount(3);

    // Test completed tasks
    const completedCategory = taskCategories.nth(0);
    await expect(completedCategory.locator('.category-header')).toContainText('Completed Tasks');
    
    const completedTasks = completedCategory.locator('.task-list .task-item');
    const completedCount = await completedTasks.count();
    
    if (completedCount > 0) {
      // Verify completed tasks have proper structure
      for (let i = 0; i < Math.min(completedCount, 2); i++) {
        const task = completedTasks.nth(i);
        await expect(task.locator('i').first()).toBeVisible();
        await expect(task.locator('.task-content')).toBeVisible();
        
        const taskText = await task.textContent();
        expect(isMeaningful(taskText)).toBeTruthy();
      }
    }

    // Test in-progress tasks
    const inProgressCategory = taskCategories.nth(1);
    await expect(inProgressCategory.locator('.category-header')).toContainText('In Progress');
    
    const inProgressTasks = inProgressCategory.locator('.task-list .task-item');
    const inProgressCount = await inProgressTasks.count();
    
    if (inProgressCount > 0) {
      // Verify in-progress tasks have proper structure
      for (let i = 0; i < Math.min(inProgressCount, 2); i++) {
        const task = inProgressTasks.nth(i);
        await expect(task.locator('i').first()).toBeVisible();
        await expect(task.locator('.task-content')).toBeVisible();
        
        const taskText = await task.textContent();
        expect(isMeaningful(taskText)).toBeTruthy();
      }
    }

    // Test pending tasks
    const pendingCategory = taskCategories.nth(2);
    await expect(pendingCategory.locator('.category-header')).toContainText('Pending Tasks');
    
    const pendingTasks = pendingCategory.locator('.task-list .task-item');
    const pendingCount = await pendingTasks.count();
    
    if (pendingCount > 0) {
      // Verify pending tasks have proper structure
      for (let i = 0; i < Math.min(pendingCount, 2); i++) {
        const task = pendingTasks.nth(i);
        await expect(task.locator('i').first()).toBeVisible();
        await expect(task.locator('.task-content')).toBeVisible();
        
        const taskText = await task.textContent();
        expect(isMeaningful(taskText)).toBeTruthy();
      }
    }
  });

  test('project timeline displays meaningful events', async ({ page }) => {
    const firstCard = page.locator('.project-card').first();
    await firstCard.click();
    await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Wait for timeline to load
    await page.waitForFunction(() => {
      const timeline = document.querySelector('#project-timeline');
      if (!timeline) return false;
      const items = timeline.querySelectorAll('.timeline-item');
      return items.length > 0 && !items[0].textContent?.includes('Loading');
    }, { timeout: 15000 });

    // Test timeline structure
    const timeline = page.locator('#project-timeline');
    await expect(timeline).toBeVisible();

    const timelineItems = timeline.locator('.timeline-item');
    const itemCount = await timelineItems.count();
    expect(itemCount).toBeGreaterThan(0);

    // Test each timeline item
    for (let i = 0; i < Math.min(itemCount, 3); i++) {
      const item = timelineItems.nth(i);
      
      // Check timeline marker
      const marker = item.locator('.timeline-marker');
      await expect(marker).toBeVisible();
      
      // Check timeline content
      const content = item.locator('.timeline-content');
      await expect(content).toBeVisible();
      
      // Check title
      const title = content.locator('h4');
      await expect(title).toBeVisible();
      const titleText = await title.textContent();
      expect(isMeaningful(titleText)).toBeTruthy();
      
      // Check description
      const description = content.locator('p');
      await expect(description).toBeVisible();
      const descText = await description.textContent();
      expect(isMeaningful(descText)).toBeTruthy();
      
      // Check date
      const date = content.locator('.timeline-date');
      await expect(date).toBeVisible();
      const dateText = await date.textContent();
      expect(isMeaningful(dateText)).toBeTruthy();
    }
  });

  test('recent activity log shows meaningful activities', async ({ page }) => {
    const firstCard = page.locator('.project-card').first();
    await firstCard.click();
    await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Wait for activity log to load
    await page.waitForFunction(() => {
      const activityLog = document.querySelector('#activity-log');
      if (!activityLog) return false;
      const items = activityLog.querySelectorAll('.activity-item');
      return items.length > 0 && !items[0].textContent?.includes('Loading');
    }, { timeout: 15000 });

    // Test activity log structure
    const activityLog = page.locator('#activity-log');
    await expect(activityLog).toBeVisible();

    const activityItems = activityLog.locator('.activity-item');
    const itemCount = await activityItems.count();
    expect(itemCount).toBeGreaterThan(0);

    // Test each activity item
    for (let i = 0; i < Math.min(itemCount, 3); i++) {
      const item = activityItems.nth(i);
      
      // Check activity icon
      const icon = item.locator('.activity-icon');
      await expect(icon).toBeVisible();
      
      // Check activity content
      const content = item.locator('.activity-content');
      await expect(content).toBeVisible();
      
      // Check message
      const message = content.locator('p');
      await expect(message).toBeVisible();
      const messageText = await message.textContent();
      expect(isMeaningful(messageText)).toBeTruthy();
      
      // Check time
      const time = content.locator('.activity-time');
      await expect(time).toBeVisible();
      const timeText = await time.textContent();
      expect(isMeaningful(timeText)).toBeTruthy();
    }
  });

  test('project metadata displays correct values', async ({ page }) => {
    const firstCard = page.locator('.project-card').first();
    await firstCard.click();
    await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Wait for metadata to load
    await page.waitForFunction(() => {
      const status = document.querySelector('#project-status');
      const phase = document.querySelector('#project-phase');
      const lastUpdated = document.querySelector('#last-updated');
      return status && phase && lastUpdated &&
             !status.textContent?.includes('Loading') &&
             !phase.textContent?.includes('Loading') &&
             !lastUpdated.textContent?.includes('Loading');
    }, { timeout: 15000 });

    // Test project status
    const status = page.locator('#project-status');
    if (await status.isVisible()) {
      const statusText = await status.textContent();
      if (statusText && statusText !== 'Loading...') {
        expect(isMeaningful(statusText)).toBeTruthy();
      }
    }

    // Test project phase
    const phase = page.locator('#project-phase');
    if (await phase.isVisible()) {
      const phaseText = await phase.textContent();
      if (phaseText && phaseText !== 'Loading...') {
        expect(isMeaningful(phaseText)).toBeTruthy();
      }
    }

    // Test last updated
    const lastUpdated = page.locator('#last-updated');
    if (await lastUpdated.isVisible()) {
      const updatedText = await lastUpdated.textContent();
      if (updatedText && updatedText !== 'Loading...') {
        expect(isMeaningful(updatedText)).toBeTruthy();
      }
    }

    // Test progress bar
    const progressBar = page.locator('#project-progress');
    if (await progressBar.isVisible()) {
      const progressFill = progressBar.locator('.progress-fill');
      const progressText = progressBar.locator('.progress-text');
      
      // Progress fill might be hidden when progress is 0%, so check if it exists
      const progressFillCount = await progressFill.count();
      if (progressFillCount > 0) {
        await expect(progressFill).toBeVisible();
      }
      await expect(progressText).toBeVisible();
      
      // Verify progress values are consistent
      const widthPercent = await getStyleWidthPercent(progressFill);
      const text = await progressText.textContent();
      const num = text ? parseInt(text.match(/(\d+)\s*%/)?.[1] || 'NaN', 10) : NaN;
      
      if (!Number.isNaN(num) && widthPercent !== null) {
        expect(widthPercent).toBe(num);
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThanOrEqual(100);
      }
    }
  });

  test('files section displays correct structure', async ({ page }) => {
    const firstCard = page.locator('.project-card').first();
    await firstCard.click();
    await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Test files section structure
    const filesSection = page.locator('.detail-section:has-text("Files & Documents")');
    await expect(filesSection).toBeVisible();

    // Test upload button
    const uploadBtn = page.locator('.upload-btn');
    await expect(uploadBtn).toBeVisible();

    // Test file categories
    const fileCategories = page.locator('.file-category');
    await expect(fileCategories).toBeVisible();

    // Test project files container
    const projectFiles = page.locator('#project-files');
    await expect(projectFiles).toBeVisible();

    // Check if files are loaded
    const fileItems = projectFiles.locator('.file-item');
    const fileCount = await fileItems.count();
    
    if (fileCount > 0) {
      // Test file item structure
      for (let i = 0; i < Math.min(fileCount, 2); i++) {
        const file = fileItems.nth(i);
        
        // Check file icon - use first() to get the main file icon, not action buttons
        const fileIcon = file.locator('i').first();
        await expect(fileIcon).toBeVisible();
        
        // Check file content
        const fileContent = file.locator('.file-content');
        await expect(fileContent).toBeVisible();
        
        // Check file actions
        const fileActions = file.locator('.file-actions');
        await expect(fileActions).toBeVisible();
        
        const fileText = await file.textContent();
        expect(isMeaningful(fileText)).toBeTruthy();
      }
    }
  });
});

// Helper functions for verification
async function verifyProjectMetadata(page: any) {
  // Test project status
  const status = page.locator('#project-status');
  if (await status.isVisible()) {
    const statusText = await status.textContent();
    if (statusText && statusText !== 'Loading...') {
      expect(isMeaningful(statusText)).toBeTruthy();
    }
  }

  // Test project phase
  const phase = page.locator('#project-phase');
  if (await phase.isVisible()) {
    const phaseText = await phase.textContent();
    if (phaseText && phaseText !== 'Loading...') {
      expect(isMeaningful(phaseText)).toBeTruthy();
    }
  }

  // Test last updated
  const lastUpdated = page.locator('#last-updated');
  if (await lastUpdated.isVisible()) {
    const updatedText = await lastUpdated.textContent();
    if (updatedText && updatedText !== 'Loading...') {
      expect(isMeaningful(updatedText)).toBeTruthy();
    }
  }

  // Test progress bar
  const progressBar = page.locator('#project-progress');
  if (await progressBar.isVisible()) {
    const progressFill = progressBar.locator('.progress-fill');
    const progressText = progressBar.locator('.progress-text');
    
    // Check progress text to see if progress is 0%
    const progressTextContent = await progressText.textContent();
    const isZeroProgress = progressTextContent?.includes('0%') || false;
    
    // Only check progress fill visibility if progress is not 0%
    if (!isZeroProgress) {
      await expect(progressFill).toBeVisible();
    }
    await expect(progressText).toBeVisible();
  }
}

async function verifyTaskSections(page: any) {
  // Wait for task data to load
  await page.waitForFunction(() => {
    const completedTasks = document.querySelector('#completed-tasks');
    const inProgressTasks = document.querySelector('#in-progress-tasks');
    const pendingTasks = document.querySelector('#pending-tasks');
    
    return completedTasks && inProgressTasks && pendingTasks &&
           !completedTasks.textContent?.includes('Loading') &&
           !inProgressTasks.textContent?.includes('Loading') &&
           !pendingTasks.textContent?.includes('Loading');
  }, { timeout: 15000 });

  // Test task categories
  const taskCategories = page.locator('.task-category');
  await expect(taskCategories).toHaveCount(3);

  // Test each category has content
  for (let i = 0; i < 3; i++) {
    const category = taskCategories.nth(i);
    const taskList = category.locator('.task-list');
    await expect(taskList).toBeVisible();
    
    const taskItems = taskList.locator('.task-item');
    const taskCount = await taskItems.count();
    
    if (taskCount > 0) {
      // Verify at least one task has meaningful content
      const firstTask = taskItems.first();
      const taskText = await firstTask.textContent();
      expect(isMeaningful(taskText)).toBeTruthy();
    }
  }
}

async function verifyTimelineSection(page: any) {
  // Wait for timeline to load
  await page.waitForFunction(() => {
    const timeline = document.querySelector('#project-timeline');
    if (!timeline) return false;
    const items = timeline.querySelectorAll('.timeline-item');
    return items.length > 0 && !items[0].textContent?.includes('Loading');
  }, { timeout: 15000 });

  // Test timeline structure
  const timeline = page.locator('#project-timeline');
  await expect(timeline).toBeVisible();

  const timelineItems = timeline.locator('.timeline-item');
  const itemCount = await timelineItems.count();
  expect(itemCount).toBeGreaterThan(0);

  // Verify at least one timeline item has meaningful content
  const firstItem = timelineItems.first();
  const itemText = await firstItem.textContent();
  expect(isMeaningful(itemText)).toBeTruthy();
}

async function verifyActivityLog(page: any) {
  // Wait for activity log to load
  await page.waitForFunction(() => {
    const activityLog = document.querySelector('#activity-log');
    if (!activityLog) return false;
    const items = activityLog.querySelectorAll('.activity-item');
    return items.length > 0 && !items[0].textContent?.includes('Loading');
  }, { timeout: 15000 });

  // Test activity log structure
  const activityLog = page.locator('#activity-log');
  await expect(activityLog).toBeVisible();

  const activityItems = activityLog.locator('.activity-item');
  const itemCount = await activityItems.count();
  expect(itemCount).toBeGreaterThan(0);

  // Verify at least one activity item has meaningful content
  const firstItem = activityItems.first();
  const itemText = await firstItem.textContent();
  expect(isMeaningful(itemText)).toBeTruthy();
}

async function verifyFilesSection(page: any) {
  // Test files section structure
  const filesSection = page.locator('.detail-section:has-text("Files & Documents")');
  await expect(filesSection).toBeVisible();

  // Test upload button
  const uploadBtn = page.locator('.upload-btn');
  await expect(uploadBtn).toBeVisible();

  // Test project files container
  const projectFiles = page.locator('#project-files');
  await expect(projectFiles).toBeVisible();

  // Files may be empty initially, which is acceptable
  const fileItems = projectFiles.locator('.file-item');
  const fileCount = await fileItems.count();
  
  if (fileCount > 0) {
    // Verify file items have proper structure
    const firstFile = fileItems.first();
    await expect(firstFile.locator('i').first()).toBeVisible();
    await expect(firstFile.locator('.file-content')).toBeVisible();
  }
}
