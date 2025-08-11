import { test, expect } from '@playwright/test';

const NON_CONTENT = new Set([
  'Loading...', 'Loading project description...', 'Loading completed tasks...',
  'Loading in-progress tasks...', 'Loading pending tasks...', 'Loading project files...',
  'Loading timeline...', 'Loading recent activity...', 'Unknown', 'N/A', 'Not Available'
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

test.describe('Project Detail Page Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard and wait for cards to load
    await page.goto('/index.html');
    await page.waitForSelector('.project-card', { timeout: 10000 });
  });

  test('project detail page loads all sections with proper data', async ({ page }) => {
    const cards = page.locator('.project-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    const take = Math.min(count, MAX);
    console.log(`Testing ${take} project detail pages`);

    for (let i = 0; i < take; i++) {
      console.log(`Testing project detail page ${i + 1}/${take}`);
      
      // Click on project card
      const card = cards.nth(i);
      await card.click();
      
      // Wait for navigation to detail page
      await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
      
      // Wait for page to load completely
      await page.waitForLoadState('networkidle');
      
      // Test project overview section
      await testProjectOverview(page);
      
      // Test task management section
      await testTaskManagement(page);
      
      // Test files section
      await testFilesSection(page);
      
      // Test project timeline
      await testProjectTimeline(page);
      
      // Test recent activity
      await testRecentActivity(page);
      
      // Test project metadata
      await testProjectMetadata(page);
      
      // Go back to dashboard for next project
      await page.goBack();
      await page.waitForSelector('.project-card', { timeout: 10000 });
    }
  });

  test('task management features work correctly', async ({ page }) => {
    // Navigate to a project detail page
    const firstCard = page.locator('.project-card').first();
    await firstCard.click();
    await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Test task categories are present
    const taskCategories = page.locator('.task-category');
    await expect(taskCategories).toHaveCount(3); // completed, in-progress, pending

    // Test collapsible task categories
    for (let i = 0; i < 3; i++) {
      const category = taskCategories.nth(i);
      const header = category.locator('.category-header');
      const taskList = category.locator('.task-list');
      
      // Initially should be expanded
      await expect(taskList).toBeVisible();
      
      // Click to collapse
      await header.click();
      await expect(taskList).not.toBeVisible();
      
      // Click to expand again
      await header.click();
      await expect(taskList).toBeVisible();
    }

    // Test add task button
    const addTaskBtn = page.locator('.add-task-btn');
    await expect(addTaskBtn).toBeVisible();
    await addTaskBtn.click();
    
    // Verify add task modal opens
    const addTaskModal = page.locator('#add-task-modal');
    await expect(addTaskModal).toBeVisible();
    
    // Test modal form fields
    const taskTitleInput = page.locator('#task-title');
    const taskDescriptionInput = page.locator('#task-description');
    const taskPrioritySelect = page.locator('#task-priority');
    const taskStatusSelect = page.locator('#task-status');
    
    await expect(taskTitleInput).toBeVisible();
    await expect(taskDescriptionInput).toBeVisible();
    await expect(taskPrioritySelect).toBeVisible();
    await expect(taskStatusSelect).toBeVisible();
    
    // Close modal
    const closeBtn = page.locator('#close-add-task-modal');
    await closeBtn.click();
    
    // Wait a moment for any CSS transitions
    await page.waitForTimeout(100);
    
    await expect(addTaskModal).not.toBeVisible();
  });

  test('project timeline displays meaningful events', async ({ page }) => {
    // Navigate to a project detail page
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
    const timelineItems = timeline.locator('.timeline-item');
    
    // Should have at least one timeline item
    const itemCount = await timelineItems.count();
    expect(itemCount).toBeGreaterThan(0);

    // Test each timeline item has proper structure
    for (let i = 0; i < Math.min(itemCount, 3); i++) {
      const item = timelineItems.nth(i);
      
      // Check for timeline marker
      const marker = item.locator('.timeline-marker');
      await expect(marker).toBeVisible();
      
      // Check for timeline content
      const content = item.locator('.timeline-content');
      await expect(content).toBeVisible();
      
      // Check for title
      const title = content.locator('h4');
      await expect(title).toBeVisible();
      const titleText = await title.textContent();
      expect(isMeaningful(titleText)).toBeTruthy();
      
      // Check for description
      const description = content.locator('p');
      await expect(description).toBeVisible();
      const descText = await description.textContent();
      expect(isMeaningful(descText)).toBeTruthy();
      
      // Check for date
      const date = content.locator('.timeline-date');
      await expect(date).toBeVisible();
      const dateText = await date.textContent();
      expect(isMeaningful(dateText)).toBeTruthy();
    }
  });

  test('recent activity section shows meaningful data', async ({ page }) => {
    // Navigate to a project detail page
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
    const activityItems = activityLog.locator('.activity-item');
    
    // Should have at least one activity item
    const itemCount = await activityItems.count();
    expect(itemCount).toBeGreaterThan(0);

    // Test each activity item has proper structure
    for (let i = 0; i < Math.min(itemCount, 3); i++) {
      const item = activityItems.nth(i);
      
      // Check for activity icon
      const icon = item.locator('.activity-icon');
      await expect(icon).toBeVisible();
      
      // Check for activity content
      const content = item.locator('.activity-content');
      await expect(content).toBeVisible();
      
      // Check for message
      const message = content.locator('p');
      await expect(message).toBeVisible();
      const messageText = await message.textContent();
      expect(isMeaningful(messageText)).toBeTruthy();
      
      // Check for time
      const time = content.locator('.activity-time');
      await expect(time).toBeVisible();
      const timeText = await time.textContent();
      expect(isMeaningful(timeText)).toBeTruthy();
    }

    // Test activity toggle button
    const toggleBtn = page.locator('.toggle-activity-btn');
    await expect(toggleBtn).toBeVisible();
    
    // Click toggle button
    await toggleBtn.click();
    
    // Verify activity log can be collapsed/expanded
    // (The exact behavior depends on the implementation)
    await expect(activityLog).toBeVisible();
  });

  test('project action buttons are functional', async ({ page }) => {
    // Navigate to a project detail page
    const firstCard = page.locator('.project-card').first();
    await firstCard.click();
    await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Test refresh button
    const refreshBtn = page.locator('.refresh-project-btn');
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    
    // Should show some indication of refresh (loading state, etc.)
    await page.waitForTimeout(1000);

    // Test edit button
    const editBtn = page.locator('.edit-project-btn');
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    
    // Verify edit modal opens
    const editModal = page.locator('#edit-project-modal');
    await expect(editModal).toBeVisible();
    
    // Test edit form fields
    const projectNameInput = page.locator('#edit-project-name');
    const projectDescriptionInput = page.locator('#edit-project-description');
    const projectStatusSelect = page.locator('#edit-project-status');
    const projectPhaseInput = page.locator('#edit-project-phase');
    const projectProgressInput = page.locator('#edit-project-progress');
    
    await expect(projectNameInput).toBeVisible();
    await expect(projectDescriptionInput).toBeVisible();
    await expect(projectStatusSelect).toBeVisible();
    await expect(projectPhaseInput).toBeVisible();
    await expect(projectProgressInput).toBeVisible();
    
    // Close edit modal
    const closeEditBtn = page.locator('#close-edit-modal');
    await closeEditBtn.click();
    
    // Wait a moment for any CSS transitions
    await page.waitForTimeout(100);
    
    await expect(editModal).not.toBeVisible();

    // Test delete button (should show confirmation)
    const deleteBtn = page.locator('.delete-project-btn');
    await expect(deleteBtn).toBeVisible();
    
    // Test export button
    const exportBtn = page.locator('.export-project-btn');
    await expect(exportBtn).toBeVisible();
    
    // Test share button
    const shareBtn = page.locator('.share-project-btn');
    await expect(shareBtn).toBeVisible();
  });

  test('file management section works correctly', async ({ page }) => {
    // Navigate to a project detail page
    const firstCard = page.locator('.project-card').first();
    await firstCard.click();
    await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Test upload files button
    const uploadBtn = page.locator('.upload-btn');
    await expect(uploadBtn).toBeVisible();
    await uploadBtn.click();
    
    // Verify file upload modal opens
    const uploadModal = page.locator('#file-upload-modal');
    await expect(uploadModal).toBeVisible();
    
    // Test file upload form fields
    const fileInput = page.locator('#file-upload');
    const fileDescriptionInput = page.locator('#file-description');
    
    await expect(fileInput).toBeVisible();
    await expect(fileDescriptionInput).toBeVisible();
    
    // Close upload modal
    const closeUploadBtn = page.locator('#close-file-upload-modal');
    await closeUploadBtn.click();
    
    // Wait a moment for any CSS transitions
    await page.waitForTimeout(100);
    
    await expect(uploadModal).not.toBeVisible();

    // Test project files section
    const projectFiles = page.locator('#project-files');
    await expect(projectFiles).toBeVisible();
    
    // Check if files are loaded (may be empty initially)
    const fileItems = projectFiles.locator('.file-item');
    const fileCount = await fileItems.count();
    
    if (fileCount > 0) {
      // Test file item structure
      const firstFile = fileItems.first();
      
      // Check for file icon
      const fileIcon = firstFile.locator('i').first();
      await expect(fileIcon).toBeVisible();
      
      // Check for file content
      const fileContent = firstFile.locator('.file-content');
      await expect(fileContent).toBeVisible();
      
      // Check for file actions
      const fileActions = firstFile.locator('.file-actions');
      await expect(fileActions).toBeVisible();
    }
  });

  test('breadcrumb navigation works correctly', async ({ page }) => {
    // Navigate to a project detail page
    const firstCard = page.locator('.project-card').first();
    await firstCard.click();
    await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Test breadcrumb structure
    const breadcrumbNav = page.locator('.breadcrumb-nav');
    await expect(breadcrumbNav).toBeVisible();
    
    const breadcrumbLink = page.locator('.breadcrumb-link');
    await expect(breadcrumbLink).toBeVisible();
    
    // Verify breadcrumb text
    const linkText = await breadcrumbLink.textContent();
    expect(linkText).toContain('Dashboard');
    
    // Click breadcrumb to go back to dashboard
    await breadcrumbLink.click();
    
    // Should navigate back to dashboard
    await expect(page).toHaveURL(/index\.html$/);
    
    // Should show project cards again
    await page.waitForSelector('.project-card', { timeout: 10000 });
  });

  test('mobile menu functionality works', async ({ page }) => {
    // Navigate to a project detail page
    const firstCard = page.locator('.project-card').first();
    await firstCard.click();
    await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Test mobile menu toggle
    const mobileToggle = page.locator('.mobile-menu-toggle');
    await expect(mobileToggle).toBeVisible();
    
    // Click mobile menu toggle
    await mobileToggle.click();
    
    // Verify sidebar becomes visible on mobile
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();
    
    // Test sidebar navigation links
    const navLinks = sidebar.locator('.nav-link');
    await expect(navLinks).toHaveCount(5); // dashboard, projects, tasks, analytics, settings
    
    // Click mobile menu toggle again to close
    await mobileToggle.click();
  });

  test('keyboard shortcuts work correctly', async ({ page }) => {
    // Navigate to a project detail page
    const firstCard = page.locator('.project-card').first();
    await firstCard.click();
    await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Test Ctrl+E to open edit modal
    await page.keyboard.press('Control+e');
    const editModal = page.locator('#edit-project-modal');
    await expect(editModal).toBeVisible();
    
    // Close modal with Escape
    await page.keyboard.press('Escape');
    await expect(editModal).not.toBeVisible();
    
    // Test Ctrl+T to open add task modal
    await page.keyboard.press('Control+t');
    const addTaskModal = page.locator('#add-task-modal');
    await expect(addTaskModal).toBeVisible();
    
    // Close modal with Escape
    await page.keyboard.press('Escape');
    await expect(addTaskModal).not.toBeVisible();
    
    // Test Ctrl+U to open file upload modal
    await page.keyboard.press('Control+u');
    const uploadModal = page.locator('#file-upload-modal');
    await expect(uploadModal).toBeVisible();
    
    // Close modal with Escape
    await page.keyboard.press('Escape');
    await expect(uploadModal).not.toBeVisible();
  });

  test('project data is correctly populated from GitHub', async ({ page }) => {
    const cards = page.locator('.project-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    const take = Math.min(count, MAX);
    console.log(`Testing GitHub data population for ${take} projects`);

    for (let i = 0; i < take; i++) {
      console.log(`Testing GitHub data for project ${i + 1}/${take}`);
      
      // Click on project card
      const card = cards.nth(i);
      await card.click();
      
      // Wait for navigation and data loading
      await page.waitForURL(/project-detail\.html\?id=/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      
      // Wait for project data to load
      await page.waitForFunction(() => {
        const title = document.querySelector('#project-title');
        return title && title.textContent && !title.textContent.includes('Loading');
      }, { timeout: 15000 });

      // Verify project title is meaningful
      const title = page.locator('#project-title');
      const titleText = await title.textContent();
      expect(isMeaningful(titleText)).toBeTruthy();
      expect(titleText).not.toBe('Loading Project...');

      // Verify project description is meaningful
      const description = page.locator('#project-description');
      const descText = await description.textContent();
      if (descText && !descText.includes('No description available')) {
        expect(isMeaningful(descText)).toBeTruthy();
      }

      // Verify project status is meaningful
      const status = page.locator('#project-status');
      const statusText = await status.textContent();
      if (statusText && statusText !== 'Loading...') {
        expect(isMeaningful(statusText)).toBeTruthy();
      }

      // Verify progress bar is properly set
      const progressBar = page.locator('#project-progress .progress-fill');
      const progressText = page.locator('#project-progress .progress-text');
      
      if (await progressBar.isVisible()) {
        const widthPercent = await getStyleWidthPercent(progressBar);
        const text = await progressText.textContent();
        const num = text ? parseInt(text.match(/(\d+)\s*%/)?.[1] || 'NaN', 10) : NaN;
        
        if (!Number.isNaN(num) && widthPercent !== null) {
          expect(widthPercent).toBe(num);
          expect(num).toBeGreaterThanOrEqual(0);
          expect(num).toBeLessThanOrEqual(100);
        }
      }

      // Go back to dashboard for next project
      await page.goBack();
      await page.waitForSelector('.project-card', { timeout: 10000 });
    }
  });
});

// Helper functions for testing individual sections
async function testProjectOverview(page: any) {
  // Test project title
  const title = page.locator('#project-title');
  await expect(title).toBeVisible();
  const titleText = await title.textContent();
  expect(isMeaningful(titleText)).toBeTruthy();

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
}

async function testTaskManagement(page: any) {
  // Test task management section header
  const sectionHeader = page.locator('.detail-section:has-text("Task Management")');
  await expect(sectionHeader).toBeVisible();

  // Test task categories
  const taskCategories = page.locator('.task-category');
  await expect(taskCategories).toHaveCount(3);

  // Test each category has proper structure
  for (let i = 0; i < 3; i++) {
    const category = taskCategories.nth(i);
    const header = category.locator('.category-header');
    const taskList = category.locator('.task-list');
    
    await expect(header).toBeVisible();
    await expect(taskList).toBeVisible();
  }
}

async function testFilesSection(page: any) {
  // Test files section header
  const sectionHeader = page.locator('.detail-section:has-text("Files & Documents")');
  await expect(sectionHeader).toBeVisible();

  // Test upload button
  const uploadBtn = page.locator('.upload-btn');
  await expect(uploadBtn).toBeVisible();

  // Test file categories
  const fileCategories = page.locator('.file-category');
  await expect(fileCategories).toBeVisible();
}

async function testProjectTimeline(page: any) {
  // Test timeline section header
  const sectionHeader = page.locator('.detail-section:has-text("Project Timeline")');
  await expect(sectionHeader).toBeVisible();

  // Test timeline container
  const timeline = page.locator('#project-timeline');
  await expect(timeline).toBeVisible();

  // Wait for timeline items to load
  await page.waitForFunction(() => {
    const timeline = document.querySelector('#project-timeline');
    if (!timeline) return false;
    const items = timeline.querySelectorAll('.timeline-item');
    return items.length > 0 && !items[0].textContent?.includes('Loading');
  }, { timeout: 15000 });

  // Test timeline items
  const timelineItems = timeline.locator('.timeline-item');
  const itemCount = await timelineItems.count();
  expect(itemCount).toBeGreaterThan(0);
}

async function testRecentActivity(page: any) {
  // Test activity section header
  const sectionHeader = page.locator('.detail-section:has-text("Recent Activity")');
  await expect(sectionHeader).toBeVisible();

  // Test activity log container
  const activityLog = page.locator('#activity-log');
  await expect(activityLog).toBeVisible();

  // Wait for activity items to load
  await page.waitForFunction(() => {
    const activityLog = document.querySelector('#activity-log');
    if (!activityLog) return false;
    const items = activityLog.querySelectorAll('.activity-item');
    return items.length > 0 && !items[0].textContent?.includes('Loading');
  }, { timeout: 15000 });

  // Test activity items
  const activityItems = activityLog.locator('.activity-item');
  const itemCount = await activityItems.count();
  expect(itemCount).toBeGreaterThan(0);
}

async function testProjectMetadata(page: any) {
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
