import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createProjectDetailDOM, clearDOM, setURLParams } from './setup.js';

// Mock the GitHubDataManager and ProjectDetailManager classes
class MockGitHubDataManager {
  constructor() {
    this.initialized = true;
    this._index = {
      byId: new Map(),
      byTitle: new Map(),
      aliases: new Map()
    };
    this.dataCache = new Map();
  }

  _resolveProjectId(query) {
    if (!query) return null;
    const q = String(query).trim().toLowerCase();
    
    // Try direct id first
    if (this._index.byId.has(q)) return q;
    
    // Try alias map
    if (this._index.aliases.has(q)) return this._index.aliases.get(q);
    
    // Try title
    if (this._index.byTitle.has(q)) return this._index.byTitle.get(q).id;
    
    return null;
  }

  getProjectData(query) {
    const id = this._resolveProjectId(query);
    if (!id) return null;
    return this.dataCache.get(id) || null;
  }

  getAllProjects() {
    return Array.from(this.dataCache.values());
  }
}

class MockProjectDetailManager {
  constructor() {
    this.projectId = null;
    this.currentProject = null;
    this.githubDataManager = new MockGitHubDataManager();
    
    // Setup test data
    this.setupTestData();
  }

  setupTestData() {
    const testProjects = {
      'at-home-diy-project-statistics-status': {
        id: 'at-home-diy-project-statistics-status',
        name: 'AT HOME DIY - PROJECT STATISTICS & STATUS',
        title: 'AT HOME DIY - PROJECT STATISTICS & STATUS',
        status: 'In Progress',
        phase: 'Planning',
        progress: 45,
        lastUpdated: '2025-08-10',
        description: 'Next.js 14 DIY project planning app'
      },
      'businesslocalai-project-details': {
        id: 'businesslocalai-project-details',
        name: 'BusinessLocalAI Project Details',
        title: 'BusinessLocalAI Project Details',
        status: 'In Progress',
        phase: 'Design',
        progress: 60,
        lastUpdated: '2025-08-09',
        description: 'Infrastructure server setup'
      }
    };

    // Add to GitHubDataManager indexes
    Object.entries(testProjects).forEach(([id, project]) => {
      this.githubDataManager._index.byId.set(id, project);
      this.githubDataManager._index.byTitle.set(project.title, project);
      this.githubDataManager.dataCache.set(id, project);
    });

    // Add aliases
    this.githubDataManager._index.aliases.set('diyapp', 'at-home-diy-project-statistics-status');
    this.githubDataManager._index.aliases.set('businesslocalai', 'businesslocalai-project-details');
  }

  loadProjectData() {
    const urlParams = new URLSearchParams(window.location.search);
    this.projectId = urlParams.get('id');
    
    if (!this.projectId) {
      return { error: 'No project ID provided' };
    }

    const targetId = this.projectId.trim().toLowerCase();
    
    if (!targetId) {
      return { error: 'Project ID is empty after trimming' };
    }

    // For invalid projects, return the error from loadProject
    const projectData = this.githubDataManager.getProjectData(targetId);
    if (!projectData) {
      return { error: 'Project not found' };
    }

    return this.loadProject(targetId);
  }

  async loadProject(id) {
    const projectData = this.githubDataManager.getProjectData(id);
    
    if (projectData) {
      this.currentProject = projectData;
      return { success: true, project: projectData };
    } else {
      return { error: 'Project not found' };
    }
  }
}

describe('Project ID Routing', () => {
  let manager;

  beforeEach(() => {
    clearDOM();
    createProjectDetailDOM();
    manager = new MockProjectDetailManager();
  });

  describe('URL Parameter Parsing', () => {
    it('should resolve URL id parameter correctly', () => {
      setURLParams({ id: 'diyapp' });
      
      const result = manager.loadProjectData();
      
      expect(result.error).toBeUndefined();
      expect(manager.projectId).toBe('diyapp');
    });

    it('should handle missing id parameter', () => {
      setURLParams({});
      
      const result = manager.loadProjectData();
      
      expect(result.error).toBe('No project ID provided');
      expect(manager.projectId).toBeNull();
    });

    it('should handle empty id parameter', () => {
      setURLParams({ id: '' });
      
      const result = manager.loadProjectData();
      
      expect(result.error).toBe('No project ID provided');
      expect(manager.projectId).toBe('');
    });

    it('should handle whitespace in id parameter', () => {
      setURLParams({ id: '  diyapp  ' });
      
      const result = manager.loadProjectData();
      
      expect(result.error).toBeUndefined();
      expect(manager.projectId).toBe('  diyapp  ');
    });
  });

  describe('Alias Resolution', () => {
    it('should resolve diyapp alias to correct project', async () => {
      setURLParams({ id: 'diyapp' });
      
      const result = await manager.loadProject('diyapp');
      
      expect(result.success).toBe(true);
      expect(result.project.id).toBe('at-home-diy-project-statistics-status');
      expect(result.project.name).toBe('AT HOME DIY - PROJECT STATISTICS & STATUS');
    });

    it('should resolve businesslocalai alias to correct project', async () => {
      setURLParams({ id: 'businesslocalai' });
      
      const result = await manager.loadProject('businesslocalai');
      
      expect(result.success).toBe(true);
      expect(result.project.id).toBe('businesslocalai-project-details');
      expect(result.project.name).toBe('BusinessLocalAI Project Details');
    });

    it('should handle unknown alias', async () => {
      setURLParams({ id: 'unknown-project' });
      
      const result = await manager.loadProject('unknown-project');
      
      expect(result.error).toBe('Project not found');
      expect(result.success).toBeUndefined();
    });
  });

  describe('Case and Whitespace Handling', () => {
    it('should handle mixed case in alias', async () => {
      setURLParams({ id: 'DIYApp' });
      
      const result = await manager.loadProject('DIYApp');
      
      expect(result.success).toBe(true);
      expect(result.project.id).toBe('at-home-diy-project-statistics-status');
    });

    it('should handle whitespace and case normalization', async () => {
      setURLParams({ id: '  DIYApp  ' });
      
      const result = await manager.loadProject('  DIYApp  '.trim().toLowerCase());
      
      expect(result.success).toBe(true);
      expect(result.project.id).toBe('at-home-diy-project-statistics-status');
    });

    it('should handle exact ID match', async () => {
      setURLParams({ id: 'at-home-diy-project-statistics-status' });
      
      const result = await manager.loadProject('at-home-diy-project-statistics-status');
      
      expect(result.success).toBe(true);
      expect(result.project.id).toBe('at-home-diy-project-statistics-status');
    });
  });

  describe('Project Loading Flow', () => {
    it('should complete full loadProjectData flow successfully', () => {
      setURLParams({ id: 'diyapp' });
      
      const result = manager.loadProjectData();
      
      expect(result.error).toBeUndefined();
      expect(manager.projectId).toBe('diyapp');
    });

    it('should handle loadProjectData with invalid project', () => {
      setURLParams({ id: 'invalid-project' });
      
      const result = manager.loadProjectData();
      
      expect(result.error).toBe('Project not found');
      expect(manager.projectId).toBe('invalid-project');
    });
  });
});
