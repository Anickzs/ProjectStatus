import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createProjectDetailDOM, clearDOM, setURLParams } from './setup.js';

// Mock the ProjectDetailManager for not found and empty scenarios
class MockProjectDetailManager {
  constructor() {
    this.projectId = null;
    this.currentProject = null;
    this.githubDataManager = new MockGitHubDataManager();
    this.notificationManager = new MockNotificationManager();
  }

  loadProjectData() {
    const urlParams = new URLSearchParams(window.location.search);
    this.projectId = urlParams.get('id');
    
    if (!this.projectId) {
      return this.showProjectSelector();
    }

    const targetId = this.projectId.trim().toLowerCase();
    
    if (!targetId) {
      return this.showProjectSelector();
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
      return this.showProjectNotFoundError();
    }
  }

  showProjectSelector() {
    const mainContent = document.querySelector('.main-wrapper');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="project-selector-container" style="text-align: center; padding: 4rem;">
          <i class="fas fa-folder-open" style="font-size: 4rem; color: #10b981; margin-bottom: 2rem;"></i>
          <h1>Select a Project</h1>
          <p style="font-size: 1.1rem; color: #6b7280; margin-bottom: 3rem;">
            Choose a project from the list below to view its details and manage tasks.
          </p>
          <div class="project-grid">
            <div class="project-card" onclick="projectDetail.selectProject('diyapp')">
              <h3>At Home DIY</h3>
              <p>Next.js 14 DIY project planning app</p>
            </div>
            <div class="project-card" onclick="projectDetail.selectProject('businesslocalai')">
              <h3>BusinessLocalAI</h3>
              <p>Infrastructure server setup</p>
            </div>
          </div>
        </div>
      `;
    }
    return { error: 'No project ID provided', action: 'showSelector' };
  }

  showProjectNotFoundError() {
    const availableProjects = this.githubDataManager.getAllProjects();
    
    const errorMessage = `
      <div class="error-container" style="text-align: center; padding: 2rem;">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f59e0b; margin-bottom: 1rem;"></i>
        </div>
        <h2>Project Not Found</h2>
        <p>The project "<strong>${this.projectId}</strong>" could not be found.</p>
        
        ${availableProjects.length > 0 ? `
          <div class="available-projects" style="margin-top: 2rem;">
            <h3>Available Projects:</h3>
            <div class="project-list">
              ${availableProjects.map(project => `
                <button class="project-select-btn" onclick="projectDetail.selectProject('${project.id}')">
                  <strong>${project.name}</strong>
                  <br>
                  <small>${project.description || 'No description available'}</small>
                </button>
              `).join('')}
            </div>
          </div>
        ` : `
          <p>No projects are currently available.</p>
        `}
        
        <div class="error-actions" style="margin-top: 2rem;">
          <button onclick="projectDetail.showProjectSelector()">
            <i class="fas fa-list"></i> Show All Projects
          </button>
          <button onclick="window.history.back()">
            <i class="fas fa-arrow-left"></i> Go Back
          </button>
        </div>
      </div>
    `;
    
    const projectDetailGrid = document.querySelector('.project-detail-grid');
    if (projectDetailGrid) {
      projectDetailGrid.innerHTML = errorMessage;
    } else {
      const mainContent = document.querySelector('.main-wrapper');
      if (mainContent) {
        mainContent.innerHTML = errorMessage;
      }
    }
    
    return { error: 'Project not found', action: 'showError' };
  }

  renderTasks(tasks) {
    const completedContainer = document.getElementById('completed-tasks');
    const inProgressContainer = document.getElementById('in-progress-tasks');
    const pendingContainer = document.getElementById('pending-tasks');
    
    if (tasks && typeof tasks === 'object' && !Array.isArray(tasks)) {
      const completedTasks = tasks.completed || [];
      const inProgressTasks = tasks.inProgress || [];
      const pendingTasks = tasks.pending || [];
      
      this.renderTaskList('completed-tasks', completedTasks);
      this.renderTaskList('in-progress-tasks', inProgressTasks);
      this.renderTaskList('pending-tasks', pendingTasks);
    } else if (Array.isArray(tasks)) {
      const completedTasks = tasks.filter(t => t.status === 'completed');
      const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
      const pendingTasks = tasks.filter(t => t.status === 'pending');
      
      this.renderTaskList('completed-tasks', completedTasks);
      this.renderTaskList('in-progress-tasks', inProgressTasks);
      this.renderTaskList('pending-tasks', pendingTasks);
    } else {
      this.renderTaskList('completed-tasks', []);
      this.renderTaskList('in-progress-tasks', []);
      this.renderTaskList('pending-tasks', []);
    }
  }

  renderTaskList(containerId, tasks) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Task container '${containerId}' not found`);
      return;
    }

    if (tasks.length === 0) {
      container.innerHTML = '<li class="task-item empty">No tasks in this category</li>';
      return;
    }

    container.innerHTML = tasks.map(task => `
      <li class="task-item ${task.status}" data-task-id="${task.id}">
        <i class="fas fa-${this.getTaskIcon(task.status)}"></i>
        <div class="task-content">
          <span class="task-title">${task.title}</span>
          <span class="task-priority ${task.priority}">${task.priority}</span>
        </div>
      </li>
    `).join('');
  }

  getTaskIcon(status) {
    const icons = {
      'completed': 'fa-check-circle',
      'in-progress': 'fa-clock',
      'pending': 'fa-hourglass-start'
    };
    return icons[status] || 'fa-circle';
  }

  renderFiles(files) {
    const container = document.getElementById('project-files');
    if (!container) {
      console.warn('Project files container not found');
      return;
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      container.innerHTML = '<li class="file-item empty">No files uploaded yet</li>';
      return;
    }

    container.innerHTML = files.map(file => `
      <li class="file-item" data-file-id="${file.id}">
        <i class="fas fa-file"></i>
        <div class="file-content">
          <span class="file-name">${file.name}</span>
          <span class="file-meta">${file.size} • ${file.uploadDate}</span>
        </div>
      </li>
    `).join('');
  }

  renderTimeline(timeline) {
    const container = document.getElementById('project-timeline');
    if (!container) {
      console.warn('Project timeline container not found');
      return;
    }

    if (!timeline || !Array.isArray(timeline) || timeline.length === 0) {
      container.innerHTML = '<div class="timeline-item empty">No timeline events yet</div>';
      return;
    }

    container.innerHTML = timeline.map(event => `
      <div class="timeline-item" data-event-id="${event.id}">
        <div class="timeline-marker ${event.type}"></div>
        <div class="timeline-content">
          <h4>${event.title}</h4>
          <p>${event.description}</p>
          <span class="timeline-date">${event.date}</span>
        </div>
      </div>
    `).join('');
  }

  renderActivityLog(activities) {
    const container = document.getElementById('activity-log');
    if (!container) {
      console.warn('Activity log container not found');
      return;
    }

    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      container.innerHTML = '<div class="activity-item empty">No recent activity</div>';
      return;
    }

    container.innerHTML = activities.map(activity => `
      <div class="activity-item" data-activity-id="${activity.id}">
        <div class="activity-icon ${activity.type}">
          <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
        </div>
        <div class="activity-content">
          <p>${activity.message}</p>
          <span class="activity-time">${activity.time}</span>
        </div>
      </div>
    `).join('');
  }

  getActivityIcon(type) {
    const icons = {
      'update': 'fa-sync-alt',
      'feature': 'fa-star',
      'status': 'fa-info-circle',
      'info': 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
  }
}

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
    
    if (this._index.byId.has(q)) return q;
    if (this._index.aliases.has(q)) return this._index.aliases.get(q);
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

class MockNotificationManager {
  showError(message) {
    console.log('Error notification:', message);
  }
  
  showInfo(message) {
    console.log('Info notification:', message);
  }
}

describe('Not Found and Empty Scenarios', () => {
  let manager;

  beforeEach(() => {
    clearDOM();
    createProjectDetailDOM();
    manager = new MockProjectDetailManager();
  });

  describe('Missing Project ID', () => {
    it('should show project selector when no ID provided', () => {
      setURLParams({});
      
      const result = manager.loadProjectData();
      
      expect(result.error).toBe('No project ID provided');
      expect(result.action).toBe('showSelector');
      
      const selectorContainer = document.querySelector('.project-selector-container');
      expect(selectorContainer).toBeDefined();
      expect(selectorContainer.querySelector('h1').textContent).toBe('Select a Project');
    });

    it('should show project selector when ID is empty', () => {
      setURLParams({ id: '' });
      
      const result = manager.loadProjectData();
      
      expect(result.error).toBe('No project ID provided');
      expect(result.action).toBe('showSelector');
    });

    it('should show project selector when ID is only whitespace', () => {
      setURLParams({ id: '   ' });
      
      const result = manager.loadProjectData();
      
      expect(result.error).toBe('No project ID provided');
      expect(result.action).toBe('showSelector');
    });
  });

  describe('Unknown Project ID', () => {
    it('should show not found error for unknown project', async () => {
      setURLParams({ id: 'unknown-project' });
      
      const result = await manager.loadProject('unknown-project');
      
      expect(result.error).toBe('Project not found');
      expect(result.action).toBe('showError');
      
      const errorContainer = document.querySelector('.error-container');
      expect(errorContainer).toBeDefined();
      expect(errorContainer.querySelector('h2').textContent).toBe('Project Not Found');
    });

    it('should show available projects in error message', async () => {
      // Add some test projects to the manager
      const testProject = {
        id: 'test-project',
        name: 'Test Project',
        description: 'A test project'
      };
      manager.githubDataManager._index.byId.set('test-project', testProject);
      manager.githubDataManager.dataCache.set('test-project', testProject);
      
      setURLParams({ id: 'unknown-project' });
      
      await manager.loadProject('unknown-project');
      
      const availableProjects = document.querySelector('.available-projects');
      expect(availableProjects).toBeDefined();
      expect(availableProjects.querySelector('h3').textContent).toBe('Available Projects:');
      
      const projectButtons = availableProjects.querySelectorAll('.project-select-btn');
      expect(projectButtons.length).toBeGreaterThan(0);
    });

    it('should show "no projects available" when no projects exist', async () => {
      setURLParams({ id: 'unknown-project' });
      
      await manager.loadProject('unknown-project');
      
      const errorContainer = document.querySelector('.error-container');
      const noProjectsText = errorContainer.textContent;
      expect(noProjectsText).toContain('No projects are currently available');
    });
  });

  describe('Empty Task Sections', () => {
    it('should render empty task lists with placeholder text', () => {
      const emptyTasks = {
        completed: [],
        inProgress: [],
        pending: []
      };
      
      manager.renderTasks(emptyTasks);
      
      const completedContainer = document.getElementById('completed-tasks');
      const inProgressContainer = document.getElementById('in-progress-tasks');
      const pendingContainer = document.getElementById('pending-tasks');
      
      expect(completedContainer.innerHTML).toContain('No tasks in this category');
      expect(inProgressContainer.innerHTML).toContain('No tasks in this category');
      expect(pendingContainer.innerHTML).toContain('No tasks in this category');
    });

    it('should handle null/undefined tasks gracefully', () => {
      expect(() => manager.renderTasks(null)).not.toThrow();
      expect(() => manager.renderTasks(undefined)).not.toThrow();
      
      const completedContainer = document.getElementById('completed-tasks');
      const inProgressContainer = document.getElementById('in-progress-tasks');
      const pendingContainer = document.getElementById('pending-tasks');
      
      expect(completedContainer.innerHTML).toContain('No tasks in this category');
      expect(inProgressContainer.innerHTML).toContain('No tasks in this category');
      expect(pendingContainer.innerHTML).toContain('No tasks in this category');
    });

    it('should handle empty array tasks', () => {
      expect(() => manager.renderTasks([])).not.toThrow();
      
      const completedContainer = document.getElementById('completed-tasks');
      const inProgressContainer = document.getElementById('in-progress-tasks');
      const pendingContainer = document.getElementById('pending-tasks');
      
      expect(completedContainer.innerHTML).toContain('No tasks in this category');
      expect(inProgressContainer.innerHTML).toContain('No tasks in this category');
      expect(pendingContainer.innerHTML).toContain('No tasks in this category');
    });

    it('should render tasks when they exist', () => {
      const tasks = {
        completed: [
          { id: '1', title: 'Task 1', status: 'completed', priority: 'high' }
        ],
        inProgress: [
          { id: '2', title: 'Task 2', status: 'in-progress', priority: 'medium' }
        ],
        pending: [
          { id: '3', title: 'Task 3', status: 'pending', priority: 'low' }
        ]
      };
      
      manager.renderTasks(tasks);
      
      const completedContainer = document.getElementById('completed-tasks');
      const inProgressContainer = document.getElementById('in-progress-tasks');
      const pendingContainer = document.getElementById('pending-tasks');
      
      expect(completedContainer.innerHTML).toContain('Task 1');
      expect(inProgressContainer.innerHTML).toContain('Task 2');
      expect(pendingContainer.innerHTML).toContain('Task 3');
      expect(completedContainer.innerHTML).not.toContain('No tasks in this category');
    });
  });

  describe('Empty File Sections', () => {
    it('should render empty file list with placeholder text', () => {
      manager.renderFiles([]);
      
      const filesContainer = document.getElementById('project-files');
      expect(filesContainer.innerHTML).toContain('No files uploaded yet');
    });

    it('should handle null/undefined files gracefully', () => {
      expect(() => manager.renderFiles(null)).not.toThrow();
      expect(() => manager.renderFiles(undefined)).not.toThrow();
      
      const filesContainer = document.getElementById('project-files');
      expect(filesContainer.innerHTML).toContain('No files uploaded yet');
    });

    it('should render files when they exist', () => {
      const files = [
        { id: '1', name: 'document.pdf', size: '1.2MB', uploadDate: '2025-08-10' }
      ];
      
      manager.renderFiles(files);
      
      const filesContainer = document.getElementById('project-files');
      expect(filesContainer.innerHTML).toContain('document.pdf');
      expect(filesContainer.innerHTML).not.toContain('No files uploaded yet');
    });
  });

  describe('Empty Timeline Sections', () => {
    it('should render empty timeline with placeholder text', () => {
      manager.renderTimeline([]);
      
      const timelineContainer = document.getElementById('project-timeline');
      expect(timelineContainer.innerHTML).toContain('No timeline events yet');
    });

    it('should handle null/undefined timeline gracefully', () => {
      expect(() => manager.renderTimeline(null)).not.toThrow();
      expect(() => manager.renderTimeline(undefined)).not.toThrow();
      
      const timelineContainer = document.getElementById('project-timeline');
      expect(timelineContainer.innerHTML).toContain('No timeline events yet');
    });

    it('should render timeline events when they exist', () => {
      const timeline = [
        { id: '1', title: 'Project Started', description: 'Project was initiated', date: '2025-08-01', type: 'start' }
      ];
      
      manager.renderTimeline(timeline);
      
      const timelineContainer = document.getElementById('project-timeline');
      expect(timelineContainer.innerHTML).toContain('Project Started');
      expect(timelineContainer.innerHTML).not.toContain('No timeline events yet');
    });
  });

  describe('Empty Activity Log Sections', () => {
    it('should render empty activity log with placeholder text', () => {
      manager.renderActivityLog([]);
      
      const activityContainer = document.getElementById('activity-log');
      expect(activityContainer.innerHTML).toContain('No recent activity');
    });

    it('should handle null/undefined activities gracefully', () => {
      expect(() => manager.renderActivityLog(null)).not.toThrow();
      expect(() => manager.renderActivityLog(undefined)).not.toThrow();
      
      const activityContainer = document.getElementById('activity-log');
      expect(activityContainer.innerHTML).toContain('No recent activity');
    });

    it('should render activities when they exist', () => {
      const activities = [
        { id: '1', type: 'update', message: 'Project updated', time: 'Just now' }
      ];
      
      manager.renderActivityLog(activities);
      
      const activityContainer = document.getElementById('activity-log');
      expect(activityContainer.innerHTML).toContain('Project updated');
      expect(activityContainer.innerHTML).not.toContain('No recent activity');
    });
  });

  describe('Missing DOM Elements', () => {
    it('should handle missing task containers gracefully', () => {
      const taskContainer = document.getElementById('completed-tasks');
      taskContainer.remove();
      
      expect(() => manager.renderTaskList('completed-tasks', [])).not.toThrow();
    });

    it('should handle missing file container gracefully', () => {
      const fileContainer = document.getElementById('project-files');
      fileContainer.remove();
      
      expect(() => manager.renderFiles([])).not.toThrow();
    });

    it('should handle missing timeline container gracefully', () => {
      const timelineContainer = document.getElementById('project-timeline');
      timelineContainer.remove();
      
      expect(() => manager.renderTimeline([])).not.toThrow();
    });

    it('should handle missing activity container gracefully', () => {
      const activityContainer = document.getElementById('activity-log');
      activityContainer.remove();
      
      expect(() => manager.renderActivityLog([])).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully without crashing', () => {
      // Test various error scenarios
      expect(() => manager.loadProjectData()).not.toThrow();
      expect(() => manager.renderTasks({ invalid: 'data' })).not.toThrow();
      expect(() => manager.renderFiles('invalid')).not.toThrow();
      expect(() => manager.renderTimeline('invalid')).not.toThrow();
      expect(() => manager.renderActivityLog('invalid')).not.toThrow();
    });

    it('should provide meaningful error messages', () => {
      setURLParams({ id: 'unknown-project' });
      
      const result = manager.loadProjectData();
      
      expect(result.error).toBe('Project not found');
      expect(typeof result.error).toBe('string');
      expect(result.error.length).toBeGreaterThan(0);
    });
  });
});
