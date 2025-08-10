import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createProjectDetailDOM, clearDOM } from './setup.js';

// Mock the normalization and rendering functions
class MockProjectDetailManager {
  constructor() {
    this.currentProject = null;
    this.domCache = {};
  }

  /**
   * Normalize project fields for consistent rendering
   * @param {Object} project - Project data object
   * @returns {Object} Normalized project fields
   */
  normalizeProjectFields(project) {
    if (!project) return {};
    
    // Helper function to parse progress value
    const parseProgress = (value) => {
      if (value === null || value === undefined) return 0;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        // Handle percentage strings like "60%" or "60"
        const cleanValue = value.replace('%', '').trim();
        const parsed = Number(cleanValue);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };
    
    return {
      status: project.status || project.metadata?.status || project.details?.status || 'Unknown',
      phase: project.phase || project.metadata?.phase || project.details?.phase || 'Unknown',
      progress: this.clamp(parseProgress(project.progress || project.percentComplete || project.metadata?.progress || 0), 0, 100),
      lastUpdatedRaw: project.lastUpdated || project.last_updated || project.metadata?.lastUpdated || project.metadata?.last_updated || project.details?.lastUpdated || null
    };
  }

  /**
   * Clamp a number between min and max values
   * @param {number} value - Value to clamp
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Clamped value
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Safe date label function that returns 'N/A' if falsy or invalid
   * @param {string|Date} value - Date value to format
   * @returns {string} Formatted date or 'N/A'
   */
  safeDateLabel(value) {
    if (!value) return 'N/A';
    
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  }

  /**
   * Update progress bar in DOM
   * @param {number} progress - Progress percentage
   */
  updateProgressBar(progress = null) {
    const progressFill = document.querySelector('#project-progress .progress-fill');
    const progressText = document.querySelector('#project-progress .progress-text');
    
    if (!progressFill || !progressText) {
      console.warn('Progress bar elements not found');
      return;
    }
    
    const progressValue = progress !== null ? progress : (this.currentProject?.progress || 0);
    progressFill.style.width = `${progressValue}%`;
    progressText.textContent = `${progressValue}% Complete`;
  }

  /**
   * Safe update element function
   * @param {string} elementId - Element ID
   * @param {string} property - Property to update
   * @param {any} value - Value to set
   * @returns {boolean} Success status
   */
  safeUpdateElement(elementId, property, value) {
    const element = document.getElementById(elementId);
    if (element) {
      try {
        // Check if the property exists on the element
        if (property in element) {
          element[property] = value;
          return true;
        } else {
          console.warn(`Property '${property}' does not exist on element ${elementId}`);
          return false;
        }
      } catch (error) {
        console.warn(`Failed to update ${elementId}.${property}:`, error);
        return false;
      }
    } else {
      console.warn(`Element with ID '${elementId}' not found`);
      return false;
    }
  }

  /**
   * Render project data to DOM
   * @param {Object} project - Project data
   */
  renderProjectData(project) {
    if (!project) {
      console.error('Cannot render project data: no project provided');
      return;
    }

    this.currentProject = project;
    
    // Normalize project fields for consistent rendering
    const normalizedFields = this.normalizeProjectFields(project);
    
    // Update DOM elements
    this.safeUpdateElement('project-title', 'textContent', project.name || project.title || 'Unknown Project');
    this.safeUpdateElement('project-subtitle', 'textContent', this.getProjectSubtitle(project));
    this.safeUpdateElement('project-description', 'innerHTML', project.description || 'No description available');
    this.safeUpdateElement('project-status', 'textContent', normalizedFields.status);
    this.safeUpdateElement('project-phase', 'textContent', normalizedFields.phase);
    this.safeUpdateElement('last-updated', 'textContent', this.safeDateLabel(normalizedFields.lastUpdatedRaw));
    this.updateProgressBar(normalizedFields.progress);
  }

  /**
   * Get project subtitle based on status
   * @param {Object} project - Project data
   * @returns {string} Subtitle
   */
  getProjectSubtitle(project) {
    const status = project.status?.toLowerCase() || '';
    if (status.includes('complete')) {
      return 'Project Completed';
    } else if (status.includes('progress')) {
      return 'Active Development';
    } else if (status.includes('planning')) {
      return 'Planning Phase';
    } else {
      return 'Project Status';
    }
  }
}

describe('Normalization and Rendering', () => {
  let manager;
  let container;

  beforeEach(() => {
    clearDOM();
    container = createProjectDetailDOM();
    manager = new MockProjectDetailManager();
  });

  describe('normalizeProjectFields', () => {
    it('should normalize status from project.status', () => {
      const project = { status: 'In Progress' };
      const normalized = manager.normalizeProjectFields(project);
      
      expect(normalized.status).toBe('In Progress');
    });

    it('should normalize status from project.metadata.status', () => {
      const project = { metadata: { status: 'Planning' } };
      const normalized = manager.normalizeProjectFields(project);
      
      expect(normalized.status).toBe('Planning');
    });

    it('should normalize status from project.details.status', () => {
      const project = { details: { status: 'Completed' } };
      const normalized = manager.normalizeProjectFields(project);
      
      expect(normalized.status).toBe('Completed');
    });

    it('should fallback to "Unknown" for missing status', () => {
      const project = {};
      const normalized = manager.normalizeProjectFields(project);
      
      expect(normalized.status).toBe('Unknown');
    });

    it('should normalize phase from multiple sources', () => {
      const project1 = { phase: 'Development' };
      const project2 = { metadata: { phase: 'Testing' } };
      const project3 = { details: { phase: 'Deployment' } };
      
      expect(manager.normalizeProjectFields(project1).phase).toBe('Development');
      expect(manager.normalizeProjectFields(project2).phase).toBe('Testing');
      expect(manager.normalizeProjectFields(project3).phase).toBe('Deployment');
    });

    it('should normalize progress from project.progress', () => {
      const project = { progress: 75 };
      const normalized = manager.normalizeProjectFields(project);
      
      expect(normalized.progress).toBe(75);
    });

    it('should normalize progress from project.percentComplete', () => {
      const project = { percentComplete: '60%' };
      const normalized = manager.normalizeProjectFields(project);
      
      expect(normalized.progress).toBe(60);
    });

    it('should normalize progress from project.metadata.progress', () => {
      const project = { metadata: { progress: 45 } };
      const normalized = manager.normalizeProjectFields(project);
      
      expect(normalized.progress).toBe(45);
    });

    it('should clamp progress to 0-100 range', () => {
      const project1 = { progress: 150 };
      const project2 = { progress: -10 };
      const project3 = { progress: 50 };
      
      expect(manager.normalizeProjectFields(project1).progress).toBe(100);
      expect(manager.normalizeProjectFields(project2).progress).toBe(0);
      expect(manager.normalizeProjectFields(project3).progress).toBe(50);
    });

    it('should handle progress as string percentage', () => {
      const project = { percentComplete: '87%' };
      const normalized = manager.normalizeProjectFields(project);
      
      expect(normalized.progress).toBe(87);
    });

    it('should handle progress as string number', () => {
      const project = { progress: '60' };
      const normalized = manager.normalizeProjectFields(project);
      
      expect(normalized.progress).toBe(60);
    });

    it('should handle null/undefined progress', () => {
      const project1 = { progress: null };
      const project2 = { progress: undefined };
      
      expect(manager.normalizeProjectFields(project1).progress).toBe(0);
      expect(manager.normalizeProjectFields(project2).progress).toBe(0);
    });

    it('should normalize lastUpdated from multiple sources', () => {
      const project1 = { lastUpdated: '2025-08-10' };
      const project2 = { last_updated: '2025-08-09' };
      const project3 = { metadata: { lastUpdated: '2025-08-08' } };
      
      expect(manager.normalizeProjectFields(project1).lastUpdatedRaw).toBe('2025-08-10');
      expect(manager.normalizeProjectFields(project2).lastUpdatedRaw).toBe('2025-08-09');
      expect(manager.normalizeProjectFields(project3).lastUpdatedRaw).toBe('2025-08-08');
    });

    it('should handle missing lastUpdated', () => {
      const project = {};
      const normalized = manager.normalizeProjectFields(project);
      
      expect(normalized.lastUpdatedRaw).toBeNull();
    });
  });

  describe('safeDateLabel', () => {
    it('should format ISO date string', () => {
      const result = manager.safeDateLabel('2025-08-10');
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // Locale date format
    });

    it('should handle epoch seconds', () => {
      const result = manager.safeDateLabel(1723267200);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should handle Date object', () => {
      const date = new Date('2025-08-10');
      const result = manager.safeDateLabel(date);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should return "N/A" for invalid date string', () => {
      const result = manager.safeDateLabel('Invalid Date String');
      expect(result).toBe('N/A');
    });

    it('should return "N/A" for empty string', () => {
      const result = manager.safeDateLabel('');
      expect(result).toBe('N/A');
    });

    it('should return "N/A" for null', () => {
      const result = manager.safeDateLabel(null);
      expect(result).toBe('N/A');
    });

    it('should return "N/A" for undefined', () => {
      const result = manager.safeDateLabel(undefined);
      expect(result).toBe('N/A');
    });

    it('should handle various date formats', () => {
      expect(manager.safeDateLabel('Aug 10th, 2025')).toBe('N/A'); // Invalid format
      expect(manager.safeDateLabel('2025-08-10T12:00:00Z')).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  describe('clamp', () => {
    it('should clamp values to min-max range', () => {
      expect(manager.clamp(50, 0, 100)).toBe(50);
      expect(manager.clamp(150, 0, 100)).toBe(100);
      expect(manager.clamp(-10, 0, 100)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(manager.clamp(0, 0, 100)).toBe(0);
      expect(manager.clamp(100, 0, 100)).toBe(100);
    });
  });

  describe('DOM Rendering', () => {
    it('should render project title', () => {
      const project = { name: 'Test Project' };
      manager.renderProjectData(project);
      
      const titleElement = document.getElementById('project-title');
      expect(titleElement.textContent).toBe('Test Project');
    });

    it('should render project subtitle based on status', () => {
      const project = { status: 'In Progress' };
      manager.renderProjectData(project);
      
      const subtitleElement = document.getElementById('project-subtitle');
      expect(subtitleElement.textContent).toBe('Active Development');
    });

    it('should render project description', () => {
      const project = { description: 'Test description' };
      manager.renderProjectData(project);
      
      const descElement = document.getElementById('project-description');
      expect(descElement.innerHTML).toBe('Test description');
    });

    it('should render normalized status', () => {
      const project = { metadata: { status: 'Planning' } };
      manager.renderProjectData(project);
      
      const statusElement = document.getElementById('project-status');
      expect(statusElement.textContent).toBe('Planning');
    });

    it('should render normalized phase', () => {
      const project = { details: { phase: 'Development' } };
      manager.renderProjectData(project);
      
      const phaseElement = document.getElementById('project-phase');
      expect(phaseElement.textContent).toBe('Development');
    });

    it('should render formatted last updated date', () => {
      const project = { lastUpdated: '2025-08-10' };
      manager.renderProjectData(project);
      
      const dateElement = document.getElementById('last-updated');
      expect(dateElement.textContent).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should render progress bar with correct width and text', () => {
      const project = { progress: 75 };
      manager.renderProjectData(project);
      
      const progressFill = document.querySelector('#project-progress .progress-fill');
      const progressText = document.querySelector('#project-progress .progress-text');
      
      expect(progressFill.style.width).toBe('75%');
      expect(progressText.textContent).toBe('75% Complete');
    });

    it('should handle missing DOM elements gracefully', () => {
      const project = { name: 'Test Project' };
      
      // Remove an element to test graceful handling
      const titleElement = document.getElementById('project-title');
      titleElement.remove();
      
      // Should not throw error
      expect(() => manager.renderProjectData(project)).not.toThrow();
    });

    it('should render complete project data', () => {
      const project = {
        name: 'Complete Test Project',
        status: 'In Progress',
        phase: 'Development',
        progress: 60,
        lastUpdated: '2025-08-10',
        description: 'A complete test project'
      };
      
      manager.renderProjectData(project);
      
      expect(document.getElementById('project-title').textContent).toBe('Complete Test Project');
      expect(document.getElementById('project-subtitle').textContent).toBe('Active Development');
      expect(document.getElementById('project-description').innerHTML).toBe('A complete test project');
      expect(document.getElementById('project-status').textContent).toBe('In Progress');
      expect(document.getElementById('project-phase').textContent).toBe('Development');
      expect(document.getElementById('last-updated').textContent).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(document.querySelector('#project-progress .progress-fill').style.width).toBe('60%');
      expect(document.querySelector('#project-progress .progress-text').textContent).toBe('60% Complete');
    });
  });

  describe('safeUpdateElement', () => {
    it('should update element successfully', () => {
      const result = manager.safeUpdateElement('project-title', 'textContent', 'Updated Title');
      
      expect(result).toBe(true);
      expect(document.getElementById('project-title').textContent).toBe('Updated Title');
    });

    it('should return false for missing element', () => {
      const result = manager.safeUpdateElement('non-existent-id', 'textContent', 'Test');
      
      expect(result).toBe(false);
    });

    it('should handle invalid property gracefully', () => {
      const result = manager.safeUpdateElement('project-title', 'invalidProperty', 'Test');
      
      expect(result).toBe(false);
    });
  });

  describe('updateProgressBar', () => {
    it('should update progress bar with provided value', () => {
      manager.updateProgressBar(80);
      
      const progressFill = document.querySelector('#project-progress .progress-fill');
      const progressText = document.querySelector('#project-progress .progress-text');
      
      expect(progressFill.style.width).toBe('80%');
      expect(progressText.textContent).toBe('80% Complete');
    });

    it('should use project progress when no value provided', () => {
      manager.currentProject = { progress: 45 };
      manager.updateProgressBar();
      
      const progressFill = document.querySelector('#project-progress .progress-fill');
      const progressText = document.querySelector('#project-progress .progress-text');
      
      expect(progressFill.style.width).toBe('45%');
      expect(progressText.textContent).toBe('45% Complete');
    });

    it('should handle missing progress elements gracefully', () => {
      const progressContainer = document.getElementById('project-progress');
      progressContainer.innerHTML = ''; // Remove progress elements
      
      expect(() => manager.updateProgressBar(50)).not.toThrow();
    });
  });
});
