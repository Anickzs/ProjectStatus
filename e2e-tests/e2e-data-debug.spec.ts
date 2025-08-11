import { test, expect } from '@playwright/test';

test.describe('Data Loading Debug', () => {
  test('should debug what data is being loaded', async ({ page }) => {
    // Navigate to the main dashboard
    await page.goto('http://localhost:8000/index.html');
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Execute JavaScript to get the actual project data
    const projectData = await page.evaluate(() => {
      if (window.githubDataManager) {
        const projects = window.githubDataManager.getAllProjects();
        return projects.map(project => ({
          name: project.name,
          description: project.description,
          status: project.status,
          progress: project.progress,
          completed_features: project.completed_features,
          todo_features: project.todo_features,
          technical_stack: project.technical_stack,
          key_features: project.key_features,
          last_updated: project.last_updated
        }));
      }
      return [];
    });
    
    console.log('=== PROJECT DATA DEBUG ===');
    console.log('Number of projects:', projectData.length);
    
    projectData.forEach((project, index) => {
      console.log(`\n--- Project ${index + 1}: ${project.name} ---`);
      console.log('Description:', project.description);
      console.log('Status:', project.status);
      console.log('Progress:', project.progress);
      console.log('Completed features count:', project.completed_features?.length || 0);
      console.log('Todo features count:', project.todo_features?.length || 0);
      console.log('Tech stack count:', project.technical_stack?.length || 0);
      console.log('Key features count:', project.key_features?.length || 0);
      console.log('Last updated:', project.last_updated);
      
      if (project.completed_features && project.completed_features.length > 0) {
        console.log('First 3 completed features:');
        project.completed_features.slice(0, 3).forEach(feature => console.log('  -', feature));
      }
      
      if (project.todo_features && project.todo_features.length > 0) {
        console.log('First 3 todo features:');
        project.todo_features.slice(0, 3).forEach(feature => console.log('  -', feature));
      }
      
      if (project.technical_stack && project.technical_stack.length > 0) {
        console.log('Tech stack:');
        project.technical_stack.forEach(tech => console.log('  -', tech));
      }
      
      if (project.key_features && project.key_features.length > 0) {
        console.log('Key features:');
        project.key_features.slice(0, 3).forEach(feature => console.log('  -', feature));
      }
    });
    
    console.log('=== END DEBUG ===');
    
    // Also check if the GitHub data manager is initialized
    const isInitialized = await page.evaluate(() => {
      return window.githubDataManager && window.githubDataManager.initialized;
    });
    
    console.log('GitHub Data Manager initialized:', isInitialized);
    
    // Check if there are any console errors
    const consoleLogs = await page.evaluate(() => {
      return window.consoleLogs || [];
    });
    
    console.log('Console logs:', consoleLogs);
  });
});
