/**
 * UI Renderer Module
 * Handles all DOM rendering and UI updates
 */

import { DOMUtils } from '../utils/dom-utils.js';

export class UIRenderer {
    constructor() {
        this.originalContent = null;
        this.loadingOverlay = null;
    }
    
    /**
     * Store original content for restoration
     */
    storeOriginalContent() {
        const mainContent = DOMUtils.getElement('.main-wrapper');
        if (mainContent && !this.originalContent) {
            this.originalContent = mainContent.innerHTML;
        }
    }
    
    /**
     * Restore original content
     */
    restoreOriginalContent() {
        if (this.originalContent) {
            const mainContent = DOMUtils.getElement('.main-wrapper');
            if (mainContent) {
                mainContent.innerHTML = this.originalContent;
            }
        }
    }
    
    /**
     * Show loading state
     */
    showLoadingState() {
        this.storeOriginalContent();
        
        // Create loading overlay
        this.loadingOverlay = DOMUtils.createElement('div', {
            className: 'loading-overlay'
        }, `
            <div class="loading-container" style="text-align: center; padding: 4rem;">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #10b981; margin-bottom: 1rem;"></i>
                </div>
                <h2>Loading Project...</h2>
                <p>Please wait while we load the project details</p>
            </div>
        `);
        
        // Add styles
        this.loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        document.body.appendChild(this.loadingOverlay);
    }
    
    /**
     * Clear loading state
     */
    clearLoadingState() {
        if (this.loadingOverlay) {
            this.loadingOverlay.remove();
            this.loadingOverlay = null;
        }
        
        // Also remove any loading containers
        const loadingContainer = DOMUtils.getElement('.loading-container');
        if (loadingContainer) {
            loadingContainer.remove();
        }
    }
    
    /**
     * Render project data
     * @param {Object} project - Project data
     */
    renderProjectData(project) {
        if (!project) {
            console.error('Cannot render project data: no project provided');
            return;
        }
        
        try {
            // Restore original content before updating
            this.restoreOriginalContent();
            
            // Update page title
            document.title = `${project.name} - Project Details`;
            
            // Update project header
            this.updateProjectHeader(project);
            
            // Update project icon
            this.updateProjectIcon(project);
            
            // Update progress bar
            this.updateProgressBar(project);
            
            console.log('Project data rendering completed successfully');
            
        } catch (error) {
            console.error('Error rendering project data:', error);
            throw error;
        }
    }
    
    /**
     * Update project header
     * @param {Object} project - Project data
     */
    updateProjectHeader(project) {
        // Update project title
        DOMUtils.safeUpdateElement('project-title', 'textContent', project.name);
        
        // Update project subtitle
        const subtitle = this.getProjectSubtitle(project);
        DOMUtils.safeUpdateElement('project-subtitle', 'textContent', subtitle);
        
        // Update project description
        const description = project.description || project.short_description || 'No description available';
        const formattedDescription = this.formatDescription(description);
        DOMUtils.safeUpdateElement('project-description', 'innerHTML', formattedDescription);
        
        // Update project metadata
        DOMUtils.safeUpdateElement('project-status', 'textContent', project.status || 'Unknown');
        DOMUtils.safeUpdateElement('project-phase', 'textContent', this.getProjectPhase(project));
        DOMUtils.safeUpdateElement('last-updated', 'textContent', this.getLastUpdated(project));
    }
    
    /**
     * Update project icon
     * @param {Object} project - Project data
     */
    updateProjectIcon(project) {
        const iconElement = DOMUtils.getElement('#project-icon');
        if (!iconElement) {
            console.warn('Project icon element not found');
            return;
        }
        
        const iconClass = this.getProjectIconClass(project);
        iconElement.className = iconClass;
    }
    
    /**
     * Update progress bar
     * @param {Object} project - Project data
     */
    updateProgressBar(project) {
        const progressFill = DOMUtils.getElement('#project-progress .progress-fill');
        const progressText = DOMUtils.getElement('#project-progress .progress-text');
        
        if (!progressFill || !progressText) {
            console.warn('Progress bar elements not found');
            return;
        }
        
        const progress = project.progress || 0;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${progress}% Complete`;
        
        // Animate the progress bar
        setTimeout(() => {
            progressFill.style.transition = 'width 1s ease-in-out';
        }, 500);
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     * @param {boolean} showProjectSelector - Whether to show project selector
     */
    showError(message, showProjectSelector = false) {
        this.clearLoadingState();
        
        const mainContent = DOMUtils.getElement('.main-wrapper');
        if (!mainContent) return;
        
        if (showProjectSelector) {
            this.showProjectSelector();
        } else {
            // Show error banner
            const errorBanner = this.createErrorBanner(message);
            const firstChild = mainContent.firstChild;
            if (firstChild) {
                mainContent.insertBefore(errorBanner, firstChild);
            } else {
                mainContent.appendChild(errorBanner);
            }
        }
    }
    
    /**
     * Create error banner
     * @param {string} message - Error message
     * @returns {Element} - Error banner element
     */
    createErrorBanner(message) {
        const errorBanner = DOMUtils.createElement('div', {
            className: 'error-banner'
        }, `
            <i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem;"></i>
            <strong>Error Loading Project:</strong> ${message}
            <br><br>
            <a href="index.html" class="btn btn-primary" style="margin-right: 1rem;">
                <i class="fas fa-arrow-left"></i> Return to Dashboard
            </a>
            <button class="btn btn-secondary" onclick="projectDetail.refreshProjectData()">
                <i class="fas fa-sync-alt"></i> Try Again
            </button>
        `);
        
        errorBanner.style.cssText = `
            background: #fee2e2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 0.5rem;
            text-align: center;
        `;
        
        return errorBanner;
    }
    
    /**
     * Show project selector
     */
    showProjectSelector() {
        const mainContent = DOMUtils.getElement('.main-wrapper');
        if (!mainContent) return;
        
        mainContent.innerHTML = this.createProjectSelectorHTML();
        this.setupProjectSelectorEvents();
    }
    
    /**
     * Create project selector HTML
     * @returns {string} - HTML content
     */
    createProjectSelectorHTML() {
        return `
            <div class="project-selector-container" style="text-align: center; padding: 4rem;">
                <i class="fas fa-folder-open" style="font-size: 4rem; color: #10b981; margin-bottom: 2rem;"></i>
                <h1>Select a Project</h1>
                <p style="font-size: 1.1rem; color: #6b7280; margin-bottom: 3rem;">
                    Choose a project from the list below to view its details and manage tasks.
                </p>
                
                <div class="project-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin: 3rem 0;">
                    <div class="project-card" data-project-id="DIYAPP" style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 2rem; cursor: pointer; transition: all 0.3s ease; background: white;">
                        <i class="fas fa-hammer" style="font-size: 2rem; color: #10b981; margin-bottom: 1rem;"></i>
                        <h3>At Home DIY</h3>
                        <p style="color: #6b7280;">Next.js 14 DIY project planning app with build planner and responsive design.</p>
                        <div style="margin-top: 1rem; padding: 0.5rem 1rem; background: #f3f4f6; border-radius: 6px; display: inline-block;">
                            <span style="color: #059669; font-weight: 600;">32% Complete</span>
                        </div>
                    </div>
                    
                    <div class="project-card" data-project-id="BusinessLoclAi" style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 2rem; cursor: pointer; transition: all 0.3s ease; background: white;">
                        <i class="fas fa-server" style="font-size: 2rem; color: #10b981; margin-bottom: 1rem;"></i>
                        <h3>Family Business Infra Server</h3>
                        <p style="color: #6b7280;">Infrastructure server setup for family business operations and management.</p>
                        <div style="margin-top: 1rem; padding: 0.5rem 1rem; background: #f3f4f6; border-radius: 6px; display: inline-block;">
                            <span style="color: #d97706; font-weight: 600;">Planning Phase</span>
                        </div>
                    </div>
                    
                    <div class="project-card" data-project-id="AiAutoAgency" style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 2rem; cursor: pointer; transition: all 0.3s ease; background: white;">
                        <i class="fas fa-envelope" style="font-size: 2rem; color: #10b981; margin-bottom: 1rem;"></i>
                        <h3>AI Email Assistant</h3>
                        <p style="color: #6b7280;">Gmail OAuth2 integration with AI-powered email management and automation.</p>
                        <div style="margin-top: 1rem; padding: 0.5rem 1rem; background: #f3f4f6; border-radius: 6px; display: inline-block;">
                            <span style="color: #dc2626; font-weight: 600;">In Development</span>
                        </div>
                    </div>
                    
                    <div class="project-card" data-project-id="CryptoTradingBot" style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 2rem; cursor: pointer; transition: all 0.3s ease; background: white;">
                        <i class="fas fa-robot" style="font-size: 2rem; color: #10b981; margin-bottom: 1rem;"></i>
                        <h3>Trading Bots</h3>
                        <p style="color: #6b7280;">Automated cryptocurrency trading bots with advanced algorithms and risk management.</p>
                        <div style="margin-top: 1rem; padding: 0.5rem 1rem; background: #f3f4f6; border-radius: 6px; display: inline-block;">
                            <span style="color: #6b7280; font-weight: 600;">Planning</span>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 3rem;">
                    <a href="index.html" class="btn btn-secondary" style="margin-right: 1rem;">
                        <i class="fas fa-arrow-left"></i> Return to Dashboard
                    </a>
                    <button class="btn btn-primary" onclick="projectDetail.refreshProjects()">
                        <i class="fas fa-sync-alt"></i> Refresh Projects
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Setup project selector events
     */
    setupProjectSelectorEvents() {
        const projectCards = DOMUtils.getElements('.project-card');
        
        projectCards.forEach(card => {
            // Add hover effects
            card.addEventListener('mouseenter', function() {
                this.style.borderColor = '#10b981';
                this.style.transform = 'translateY(-4px)';
                this.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.borderColor = '#e5e7eb';
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
            
            // Add click handler
            card.addEventListener('click', function() {
                const projectId = this.dataset.projectId;
                if (projectId) {
                    // Dispatch custom event for project selection
                    document.dispatchEvent(new CustomEvent('project:selected', { 
                        detail: { projectId } 
                    }));
                }
            });
        });
    }
    
    // Helper methods
    getProjectSubtitle(project) {
        if (project.status === 'completed') return 'Project Completed';
        if (project.status === 'in-progress') return 'Active Development';
        if (project.status === 'planning') return 'Planning Phase';
        return 'Project Status';
    }
    
    getProjectPhase(project) {
        if (project.completed_features && project.completed_features.length > 0) {
            const completedCount = project.completed_features.length;
            if (completedCount < 5) return 'Phase 1: Planning & Setup';
            if (completedCount < 15) return 'Phase 2: Core Development';
            if (completedCount < 25) return 'Phase 3: Advanced Features';
            return 'Phase 4: Finalization';
        }
        return 'Phase 1: Planning';
    }
    
    getLastUpdated(project) {
        const description = project.description || '';
        const dateMatch = description.match(/(\w+ \d+, \d{4})/);
        if (dateMatch) {
            return dateMatch[1];
        }
        return new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    
    getProjectIconClass(project) {
        const projectName = project.name.toLowerCase();
        
        if (projectName.includes('diy') || projectName.includes('build')) {
            return 'fas fa-hammer';
        } else if (projectName.includes('server') || projectName.includes('infra')) {
            return 'fas fa-server';
        } else if (projectName.includes('email') || projectName.includes('assistant')) {
            return 'fas fa-envelope';
        } else if (projectName.includes('trading') || projectName.includes('bot')) {
            return 'fas fa-robot';
        }
        
        return 'fas fa-project-diagram';
    }
    
    formatDescription(description) {
        return description
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }
}
