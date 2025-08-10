import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearDOM } from './setup.js';

// Mock GitHubDataManager class
class MockGitHubDataManager {
  constructor() {
    this.initialized = true;
    this._index = {
      byId: new Map(),
      byTitle: new Map(),
      aliases: new Map()
    };
    this.dataCache = new Map();
    this.sessionData = new Map();
    
    this.setupTestData();
  }

  setupTestData() {
    const testProjects = {
      'at-home-diy-project-statistics-status': {
        id: 'at-home-diy-project-statistics-status',
        title: 'AT HOME DIY - PROJECT STATISTICS & STATUS',
        name: 'AT HOME DIY - PROJECT STATISTICS & STATUS',
        metadata: { 
          status: 'In Progress', 
          phase: 'Planning', 
          progress: 45, 
          lastUpdated: '2025-08-10' 
        },
        description: 'Next.js 14 DIY project planning app with build planner and responsive design.',
        completed_features: ['Basic UI setup', 'Project structure', 'Database schema'],
        in_progress_features: ['User authentication', 'File upload system'],
        todo_features: ['Advanced reporting', 'Mobile app', 'API documentation'],
        last_updated: '2025-08-10',
        aliases: ['diyapp', 'diy-project']
      },
      'businesslocalai-project-details': {
        id: 'businesslocalai-project-details',
        title: 'BusinessLocalAI Project Details',
        name: 'BusinessLocalAI Project Details',
        details: { 
          status: 'In Progress', 
          phase: 'Design', 
          percentComplete: '60%', 
          last_updated: '2025-08-09' 
        },
        description: 'Infrastructure server setup for family business operations and management.',
        completed_features: ['Server architecture design', 'Database planning'],
        in_progress_features: ['API development', 'Security implementation'],
        todo_features: ['Deployment setup', 'Monitoring tools', 'Backup systems'],
        last_updated: '2025-08-09',
        aliases: ['businesslocalai', 'business-ai']
      }
    };

    // Add to indexes and caches
    Object.entries(testProjects).forEach(([id, project]) => {
      this._index.byId.set(id, project);
      this._index.byTitle.set(project.title, project);
      this.dataCache.set(id, project);
      this.sessionData.set(id, project);
      
      // Add aliases
      if (project.aliases) {
        project.aliases.forEach(alias => {
          this._index.aliases.set(alias, id);
        });
      }
    });
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
    
    // Try slug of the query
    const slug = this.slugify(q);
    if (this._index.byId.has(slug)) return slug;
    if (this._index.aliases.has(slug)) return this._index.aliases.get(slug);
    
    return null;
  }

  slugify(input) {
    if (!input) return "";
    const noEmoji = input.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "");
    const ascii = noEmoji.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    const cleaned = ascii.replace(/[^a-zA-Z0-9 _-]+/g, " ");
    return cleaned
      .toLowerCase()
      .replace(/[_\s]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  getProjectData(query) {
    if (!this.initialized) {
      console.warn('GitHubDataManager not initialized. Call initialize() first.');
      return null;
    }
    
    const id = this._resolveProjectId(query);
    if (!id) {
      console.warn("[Projects] No match for query:", query, "Known IDs:", [...this._index.byId.keys()]);
      return null;
    }
    
    return this.dataCache.get(id) || null;
  }

  getById(id) {
    if (!this.initialized) {
      console.warn('GitHubDataManager not initialized. Call initialize() first.');
      return null;
    }
    
    return this.dataCache.get(id) || null;
  }

  getByAlias(alias) {
    if (!this.initialized) {
      console.warn('GitHubDataManager not initialized. Call initialize() first.');
      return null;
    }
    
    const targetId = this._index.aliases.get(alias);
    if (!targetId) {
      return null;
    }
    
    return this.dataCache.get(targetId) || null;
  }

  getByTitle(title) {
    if (!this.initialized) {
      console.warn('GitHubDataManager not initialized. Call initialize() first.');
      return null;
    }
    
    const projectData = this._index.byTitle.get(title);
    if (!projectData) {
      return null;
    }
    
    return this.dataCache.get(projectData.id) || null;
  }

  getAllProjects() {
    if (!this.initialized) {
      console.warn('GitHubDataManager not initialized. Call initialize() first.');
      return [];
    }
    
    return Array.from(this.dataCache.values()).map(project => {
      if (!project.id && project.name) {
        project.id = this.slugify(project.name);
      }
      if (!project.title && project.name) {
        project.title = project.name;
      }
      return project;
    });
  }
}

describe('GitHubDataManager Lookup', () => {
  let manager;

  beforeEach(() => {
    clearDOM();
    manager = new MockGitHubDataManager();
  });

  describe('getById', () => {
    it('should get project by exact ID', () => {
      const project = manager.getById('at-home-diy-project-statistics-status');
      
      expect(project).toBeDefined();
      expect(project.id).toBe('at-home-diy-project-statistics-status');
      expect(project.title).toBe('AT HOME DIY - PROJECT STATISTICS & STATUS');
    });

    it('should return null for unknown ID', () => {
      const project = manager.getById('unknown-project-id');
      
      expect(project).toBeNull();
    });

    it('should handle case-sensitive ID lookup', () => {
      const project = manager.getById('AT-HOME-DIY-PROJECT-STATISTICS-STATUS');
      
      expect(project).toBeNull(); // Should be case-sensitive
    });
  });

  describe('getByAlias', () => {
    it('should get project by alias', () => {
      const project = manager.getByAlias('diyapp');
      
      expect(project).toBeDefined();
      expect(project.id).toBe('at-home-diy-project-statistics-status');
      expect(project.title).toBe('AT HOME DIY - PROJECT STATISTICS & STATUS');
    });

    it('should get project by another alias', () => {
      const project = manager.getByAlias('businesslocalai');
      
      expect(project).toBeDefined();
      expect(project.id).toBe('businesslocalai-project-details');
      expect(project.title).toBe('BusinessLocalAI Project Details');
    });

    it('should return null for unknown alias', () => {
      const project = manager.getByAlias('unknown-alias');
      
      expect(project).toBeNull();
    });

    it('should handle multiple aliases for same project', () => {
      const project1 = manager.getByAlias('diyapp');
      const project2 = manager.getByAlias('diy-project');
      
      expect(project1).toBeDefined();
      expect(project2).toBeDefined();
      expect(project1.id).toBe(project2.id);
    });
  });

  describe('getByTitle', () => {
    it('should get project by exact title', () => {
      const project = manager.getByTitle('AT HOME DIY - PROJECT STATISTICS & STATUS');
      
      expect(project).toBeDefined();
      expect(project.id).toBe('at-home-diy-project-statistics-status');
      expect(project.title).toBe('AT HOME DIY - PROJECT STATISTICS & STATUS');
    });

    it('should get project by another title', () => {
      const project = manager.getByTitle('BusinessLocalAI Project Details');
      
      expect(project).toBeDefined();
      expect(project.id).toBe('businesslocalai-project-details');
      expect(project.title).toBe('BusinessLocalAI Project Details');
    });

    it('should return null for unknown title', () => {
      const project = manager.getByTitle('Unknown Project Title');
      
      expect(project).toBeNull();
    });

    it('should be case-sensitive for title lookup', () => {
      const project = manager.getByTitle('at home diy - project statistics & status');
      
      expect(project).toBeNull(); // Should be case-sensitive
    });
  });

  describe('getProjectData (main lookup method)', () => {
    it('should resolve by ID', () => {
      const project = manager.getProjectData('at-home-diy-project-statistics-status');
      
      expect(project).toBeDefined();
      expect(project.id).toBe('at-home-diy-project-statistics-status');
    });

    it('should resolve by alias', () => {
      const project = manager.getProjectData('diyapp');
      
      expect(project).toBeDefined();
      expect(project.id).toBe('at-home-diy-project-statistics-status');
    });

    it('should resolve by title', () => {
      const project = manager.getProjectData('AT HOME DIY - PROJECT STATISTICS & STATUS');
      
      expect(project).toBeDefined();
      expect(project.id).toBe('at-home-diy-project-statistics-status');
    });

    it('should handle whitespace and case in query', () => {
      const project = manager.getProjectData('  DIYApp  ');
      
      expect(project).toBeDefined();
      expect(project.id).toBe('at-home-diy-project-statistics-status');
    });

    it('should return null for unknown query', () => {
      const project = manager.getProjectData('unknown-query');
      
      expect(project).toBeNull();
    });

    it('should handle empty query', () => {
      const project = manager.getProjectData('');
      
      expect(project).toBeNull();
    });

    it('should handle null query', () => {
      const project = manager.getProjectData(null);
      
      expect(project).toBeNull();
    });
  });

  describe('getAllProjects', () => {
    it('should return all projects', () => {
      const projects = manager.getAllProjects();
      
      expect(projects).toHaveLength(2);
      expect(projects.map(p => p.id)).toContain('at-home-diy-project-statistics-status');
      expect(projects.map(p => p.id)).toContain('businesslocalai-project-details');
    });

    it('should ensure all projects have id and title fields', () => {
      const projects = manager.getAllProjects();
      
      projects.forEach(project => {
        expect(project.id).toBeDefined();
        expect(project.title).toBeDefined();
      });
    });
  });

  describe('ID Resolution Logic', () => {
    it('should resolve project ID through multiple methods', () => {
      // Test direct ID
      expect(manager._resolveProjectId('at-home-diy-project-statistics-status'))
        .toBe('at-home-diy-project-statistics-status');
      
      // Test alias
      expect(manager._resolveProjectId('diyapp'))
        .toBe('at-home-diy-project-statistics-status');
      
      // Test title
      expect(manager._resolveProjectId('AT HOME DIY - PROJECT STATISTICS & STATUS'))
        .toBe('at-home-diy-project-statistics-status');
    });

    it('should handle slugification', () => {
      const slug = manager.slugify('AT HOME DIY - PROJECT STATISTICS & STATUS');
      expect(slug).toBe('at-home-diy-project-statistics-status');
    });

    it('should return null for unresolvable queries', () => {
      expect(manager._resolveProjectId('nonexistent')).toBeNull();
      expect(manager._resolveProjectId('')).toBeNull();
      expect(manager._resolveProjectId(null)).toBeNull();
    });
  });

  describe('Data Structure Validation', () => {
    it('should have correct data structure for DIY project', () => {
      const project = manager.getById('at-home-diy-project-statistics-status');
      
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('title');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('metadata');
      expect(project).toHaveProperty('description');
      expect(project).toHaveProperty('completed_features');
      expect(project).toHaveProperty('in_progress_features');
      expect(project).toHaveProperty('todo_features');
      expect(project).toHaveProperty('last_updated');
      expect(project).toHaveProperty('aliases');
    });

    it('should have correct data structure for BusinessLocalAI project', () => {
      const project = manager.getById('businesslocalai-project-details');
      
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('title');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('details');
      expect(project).toHaveProperty('description');
      expect(project).toHaveProperty('completed_features');
      expect(project).toHaveProperty('in_progress_features');
      expect(project).toHaveProperty('todo_features');
      expect(project).toHaveProperty('last_updated');
      expect(project).toHaveProperty('aliases');
    });
  });
});
