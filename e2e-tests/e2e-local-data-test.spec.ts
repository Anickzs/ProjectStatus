import { test, expect } from '@playwright/test';

test.describe('Local Data Loading Test', () => {
  test('should test local data loading directly', async ({ page }) => {
    // Test 1: Check if the local PROJECTS.md file is accessible
    const response = await page.goto('http://localhost:8000/data/PROJECTS.md');
    console.log('=== LOCAL FILE ACCESS TEST ===');
    console.log('Response status:', response?.status());
    console.log('Response ok:', response?.ok());
    
    if (response?.ok()) {
      const content = await response.text();
      console.log('File content length:', content.length);
      console.log('File content preview:', content.substring(0, 500));
      
      // Check if it contains the DIY project
      const hasDIYProject = content.includes('## At Home DIY');
      console.log('Contains DIY project:', hasDIYProject);
      
      // Check if it contains completed features
      const hasCompletedFeatures = content.includes('### Completed Features');
      console.log('Contains completed features section:', hasCompletedFeatures);
      
      // Count ## headings
      const headingMatches = content.match(/^##\s+/gm);
      console.log('Number of ## headings:', headingMatches?.length || 0);
    } else {
      console.log('❌ Local PROJECTS.md file not accessible');
    }
    
    // Test 2: Check browser console for parsing logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    // Navigate to the main page to trigger data loading
    await page.goto('http://localhost:8000/index.html');
    await page.waitForTimeout(3000);
    
    console.log('\n=== CONSOLE LOGS ===');
    consoleLogs.forEach(log => {
      if (log.includes('PARSING') || log.includes('local') || log.includes('PROJECTS.md')) {
        console.log(log);
      }
    });
    
    // Test 3: Check if the GitHub data manager is trying to load local data
    const loadLocalDataCalled = await page.evaluate(() => {
      return window.githubDataManager && window.githubDataManager.sessionData.size > 0;
    });
    
    console.log('\n=== DATA MANAGER STATUS ===');
    console.log('GitHub data manager exists:', !!window.githubDataManager);
    console.log('Session data size:', await page.evaluate(() => window.githubDataManager?.sessionData.size || 0));
    console.log('Cache data size:', await page.evaluate(() => window.githubDataManager?.dataCache.size || 0));
  });
});
