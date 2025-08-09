// Project Detail Page JavaScript
// Handles all functionality for the project detail view

// Utility classes (included inline to avoid ES6 module issues with local files)
class DOMUtils {
    constructor() {
        this.cachedElements = new Map();
    }

    getElement(id) {
        if (!this.cachedElements.has(id)) {
            const element = document.getElementById(id);
            if (element) {
                this.cachedElements.set(id, element);
            }
            return element;
        }
        return this.cachedElements.get(id);
    }

    querySelector(selector) {
        return document.querySelector(selector);
    }

    safeUpdateElement(elementId, property, value) {
        const element = this.getElement(elementId);
        if (element) {
            try {
                element[property] = value;
                return true;
            } catch (error) {
                console.warn(`Failed to update ${elementId}.${property}:`, error);
                return false;
            }
        } else {
            console.warn(`Element with ID '${elementId}' not found`);
            return false;
        }
    }
}

class DataUtils {
    constructor() {}
    
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString();
        } catch (error) {
            return dateString;
        }
    }
}

class ModalManager {
    constructor() {}
    
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

class NotificationManager {
    constructor() {}
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showInfo(message) {
        this.showNotification(message, 'info');
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
        }
    }
    
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }
}

// Import the enhanced ProjectDataManager
// Note: In a real implementation, this would be a proper ES6 import
// The enhanced ProjectDataManager is now loaded from modules/ProjectDataManager.js

class ProjectDetailManager {
    constructor() {
        console.log('=== ProjectDetailManager Constructor ===');
        console.log('Creating new ProjectDetailManager instance...');
        
        // Initialize utility modules
        this.domUtils = new DOMUtils();
        this.dataUtils = new DataUtils();
        this.modalManager = new ModalManager();
        this.notificationManager = new NotificationManager();
        this.projectDataManager = new ProjectDataManager();
        
        // Core instance variables
        this.currentProject = null;
        this.projectId = null;
        this.projectData = null;
        this.originalContent = null; // Store original HTML content
        
        // Cache frequently accessed DOM elements for better performance
        this.domCache = {
            mainWrapper: null,
            loadingOverlay: null,
            projectTitle: null,
            projectSubtitle: null,
            projectDescription: null,
            projectStatus: null,
            projectPhase: null,
            lastUpdated: null,
            projectProgress: null,
            progressFill: null,
            progressText: null
        };
        
        console.log('Utility modules and instance variables initialized');
        
        // Add a small delay to ensure DOM is fully loaded
        setTimeout(() => {
            console.log('DOM delay completed, calling init()...');
            this.init();
        }, 100);
        
        console.log('Constructor completed, waiting for DOM...');
    }

    init() {
        console.log('=== ProjectDetailManager Initialization ===');
        console.log('DOM ready, starting initialization...');
        
        // Initialize DOM cache for better performance
        this.initializeDOMCache();
        
        // Add a global timeout to prevent infinite loading
        this.loadingTimeout = setTimeout(() => {
            if (document.querySelector('.loading-container')) {
                console.warn('Page stuck in loading state for 15 seconds, showing error');
                this.notificationManager.showError('Page took too long to load. Please check your connection and refresh.');
            }
        }, 15000);
        
        console.log('Setting up event listeners...');
        this.setupEventListeners();
        
        console.log('Loading project data...');
        this.loadProjectData();
        
        console.log('Setting up mobile menu...');
        this.setupMobileMenu();
        
        console.log('Setting up keyboard shortcuts...');
        this.setupKeyboardShortcuts();
        
        console.log('Initialization complete!');
    }

    initializeDOMCache() {
        // Cache frequently accessed DOM elements for better performance
        this.domCache.mainWrapper = document.querySelector('.main-wrapper');
        this.domCache.projectTitle = document.getElementById('project-title');
        this.domCache.projectSubtitle = document.getElementById('project-subtitle');
        this.domCache.projectDescription = document.getElementById('project-description');
        this.domCache.projectStatus = document.getElementById('project-status');
        this.domCache.projectPhase = document.getElementById('project-phase');
        this.domCache.lastUpdated = document.getElementById('last-updated');
        this.domCache.projectProgress = document.getElementById('project-progress');
        this.domCache.progressFill = document.querySelector('#project-progress .progress-fill');
        this.domCache.progressText = document.querySelector('#project-progress .progress-text');
        
        console.log('DOM cache initialized');
    }

    refreshDOMCache() {
        // Refresh DOM cache when content changes dynamically
        this.initializeDOMCache();
        console.log('DOM cache refreshed');
    }

    setupEventListeners() {
        console.log('Setting up event listeners with event delegation...');
        
        // Store references to event handlers for proper cleanup
        this.handleGlobalClick = this.handleGlobalClick.bind(this);
        this.handleFormSubmission = this.handleFormSubmission.bind(this);
        
        // Use event delegation for better performance and memory management
        document.addEventListener('click', this.handleGlobalClick);
        
        // Form submissions
        document.addEventListener('submit', this.handleFormSubmission);
        
        // Modal close events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.modalManager.hideModal('edit-project-modal');
                this.modalManager.hideModal('add-task-modal');
                this.modalManager.hideModal('file-upload-modal');
            }
        });
        
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.modalManager.hideModal('edit-project-modal');
                this.modalManager.hideModal('add-task-modal');
                this.modalManager.hideModal('file-upload-modal');
            }
        });

        // Setup collapsible sections
        this.setupCollapsibleSections();
    }

    handleGlobalClick(e) {
        const target = e.target;
        
        // Use more specific selectors for better performance
        // Project actions
        if (target.matches('.edit-project-btn')) {
            e.preventDefault();
            this.openEditModal();
        } else if (target.matches('.add-task-btn')) {
            e.preventDefault();
            this.openAddTaskModal();
        } else if (target.matches('.upload-btn')) {
            e.preventDefault();
            this.openFileUploadModal();
        } else if (target.matches('.delete-project-btn')) {
            e.preventDefault();
            this.deleteProject();
        } else if (target.matches('.export-project-btn')) {
            e.preventDefault();
            this.exportProject();
        } else if (target.matches('.share-project-btn')) {
            e.preventDefault();
            this.shareProject();
        }
        // Task actions - use more specific delegation
        else if (target.matches('.task-action-btn')) {
            const taskItem = target.closest('.task-item');
            if (taskItem) {
                const taskId = taskItem.dataset.taskId;
                const action = target.dataset.action || target.title;
                
                if (action === 'Edit Task' || target.matches('[title*="Edit"]')) {
                    this.editTask(taskId);
                } else if (action === 'Delete Task' || target.matches('[title*="Delete"]')) {
                    this.deleteTask(taskId);
                }
            }
        }
        // File actions - use more specific delegation
        else if (target.matches('.file-action-btn')) {
            const fileItem = target.closest('.file-item');
            if (fileItem) {
                const fileId = fileItem.dataset.fileId;
                const action = target.dataset.action || target.title;
                
                if (action === 'Download' || target.matches('[title*="Download"]')) {
                    this.downloadFile(fileId);
                } else if (action === 'Delete' || target.matches('[title*="Delete"]')) {
                    this.deleteFile(fileId);
                }
            }
        }
        // Modal close buttons - use more specific patterns
        else if (target.matches('[id^="close-"], [id^="cancel-"], .modal-close')) {
            e.preventDefault();
            this.handleModalClose(target);
        }
    }

    handleFormSubmission(e) {
        const form = e.target;
        
        if (form.id === 'edit-project-form') {
            e.preventDefault();
            this.saveProjectChanges();
        } else if (form.id === 'add-task-form') {
            e.preventDefault();
            this.addNewTask();
        } else if (form.id === 'file-upload-form') {
            e.preventDefault();
            this.uploadFiles();
        }
    }

    setupCollapsibleSections() {
        // Setup task category collapsible functionality
        const categoryHeaders = document.querySelectorAll('.category-header');
        categoryHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = header.dataset.target;
                const targetList = document.getElementById(targetId);
                const taskCategory = header.closest('.task-category');
                
                if (targetList && taskCategory) {
                    const isCollapsed = taskCategory.classList.contains('collapsed');
                    
                    if (isCollapsed) {
                        // Expand
                        taskCategory.classList.remove('collapsed');
                        header.classList.remove('collapsed');
                        targetList.style.display = 'block';
                    } else {
                        // Collapse
                        taskCategory.classList.add('collapsed');
                        header.classList.add('collapsed');
                        targetList.style.display = 'none';
                    }
                }
            });
        });

        // Setup activity log collapsible functionality
        const toggleActivityBtn = document.querySelector('.toggle-activity-btn');
        if (toggleActivityBtn) {
            toggleActivityBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const activityLog = document.getElementById('activity-log');
                const isCollapsed = activityLog.classList.contains('collapsed');
                
                if (isCollapsed) {
                    // Expand
                    activityLog.classList.remove('collapsed');
                    toggleActivityBtn.classList.remove('collapsed');
                    toggleActivityBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
                } else {
                    // Collapse (hide all but first item)
                    activityLog.classList.add('collapsed');
                    toggleActivityBtn.classList.add('collapsed');
                    toggleActivityBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
                }
            });
        }
    }

    handleModalClose(closeButton) {
        const modalId = closeButton.closest('.modal-overlay')?.id;
        
        if (modalId === 'edit-project-modal') {
            this.closeEditModal();
        } else if (modalId === 'add-task-modal') {
            this.closeAddTaskModal();
        } else if (modalId === 'file-upload-modal') {
            this.closeFileUploadModal();
        }
    }

    setupMobileMenu() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', function() {
                sidebar.classList.toggle('mobile-open');
                
                const icon = this.querySelector('i');
                if (sidebar.classList.contains('mobile-open')) {
                    icon.className = 'fas fa-times';
                } else {
                    icon.className = 'fas fa-bars';
                }
            });
            
            // Close mobile sidebar when clicking outside
            document.addEventListener('click', function(e) {
                if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
                    sidebar.classList.remove('mobile-open');
                    const icon = mobileToggle.querySelector('i');
                    icon.className = 'fas fa-bars';
                }
            });
        }
    }

    loadProjectData() {
        // Get project ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.projectId = urlParams.get('id');
        
        console.log('=== PROJECT LOADING DEBUG ===');
        console.log('Current URL:', window.location.href);
        console.log('URL Parameters:', window.location.search);
        console.log('Project ID from URL:', this.projectId);
        console.log('================================');
        
        if (!this.projectId) {
            console.log('No project ID provided in URL, showing project selector');
            this.showProjectSelector();
            return;
        }

        // Clean the project ID (remove any special characters or spaces)
        this.projectId = this.projectId.trim().replace(/[^a-zA-Z0-9]/g, '');
        
        if (!this.projectId) {
            console.log('Project ID is empty after cleaning, showing project selector');
            this.showProjectSelector();
            return;
        }

        console.log('Loading project with ID:', this.projectId);
        
        // Show loading state
        this.showLoadingState();
        
        // Use ProjectDataManager to load project data
        this.fetchProjectData();
    }

    async fetchProjectData() {
        try {
            console.log('Fetching project data using enhanced ProjectDataManager...');
            
            // Initialize the enhanced ProjectDataManager if not already done
            if (!this.projectDataManager.initialized) {
                console.log('Initializing enhanced ProjectDataManager...');
                await this.projectDataManager.initialize();
            }
            
            // Use enhanced ProjectDataManager to fetch and load project data
            const projectData = this.projectDataManager.getProjectData(this.projectId);
            
            if (!projectData) {
                throw new Error(`Project "${this.projectId}" not found`);
            }
            
            this.currentProject = projectData;
            
            console.log('Project data loaded successfully:', this.currentProject);
            this.renderProjectData();
            
        } catch (error) {
            // Use centralized error handling
            this.handleError(error, 'fetchProjectData', () => {
                this.showError(`Failed to load project data: ${error.message}`);
            });
        }
    }

    showLoadingState() {
        // Use cached DOM element for better performance
        const mainContent = this.domCache.mainWrapper || document.querySelector('.main-wrapper');
        
        // Store original content if not already stored
        if (!this.originalContent) {
            this.originalContent = mainContent.innerHTML;
        }
        
        // Create loading overlay instead of replacing content
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.style.cssText = `
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
        
        loadingOverlay.innerHTML = `
            <div class="loading-container" style="text-align: center; padding: 4rem;">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #10b981; margin-bottom: 1rem;"></i>
                </div>
                <h2>Loading Project...</h2>
                <p>Please wait while we load the project details</p>
            </div>
        `;
        
        // Add loading overlay to body
        document.body.appendChild(loadingOverlay);
        
        // Store reference to remove later
        this.loadingOverlay = loadingOverlay;
        
        // Update cache
        this.domCache.loadingOverlay = loadingOverlay;
    }

    clearLoadingState() {
        // Remove loading overlay if it exists
        if (this.loadingOverlay) {
            this.loadingOverlay.remove();
            this.loadingOverlay = null;
        }
        
        // Also remove any loading containers that might exist
        const loadingContainer = document.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.remove();
        }
    }

    showError(message) {
        // Clear loading state first
        this.clearLoadingState();
        
        // Use NotificationManager for error display
        this.notificationManager.showError(message);
        
        const mainContent = document.querySelector('.main-wrapper');
        
        // If no project ID, show project selector
        if (!this.projectId) {
            mainContent.innerHTML = `
                <div class="error-container" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-folder-open" style="font-size: 3rem; color: #10b981; margin-bottom: 1rem;"></i>
                    <h2>Select a Project</h2>
                    <p>Please select a project to view its details:</p>
                    <div class="project-selector" style="margin: 2rem 0;">
                        <select id="project-select" style="padding: 0.5rem; margin-right: 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem;">
                            <option value="">Choose a project...</option>
                            <option value="DIYAPP">At Home DIY</option>
                            <option value="BusinessLoclAi">Family Business Infra Server</option>
                            <option value="AiAutoAgency">AI Email Assistant</option>
                            <option value="CryptoTradingBot">Trading Bots</option>
                        </select>
                        <button class="btn btn-primary" onclick="projectDetail.loadSelectedProject()">
                            <i class="fas fa-arrow-right"></i> View Project
                        </button>
                    </div>
                    <a href="index.html" class="btn btn-secondary" style="margin-top: 1rem; display: inline-block;">
                        <i class="fas fa-arrow-left"></i> Return to Dashboard
                    </a>
                </div>
            `;
        } else {
            // Show error but keep the original content structure
            const errorBanner = document.createElement('div');
            errorBanner.className = 'error-banner';
            errorBanner.style.cssText = `
                background: #fee2e2;
                border: 1px solid #fecaca;
                color: #dc2626;
                padding: 1rem;
                margin: 1rem 0;
                border-radius: 0.5rem;
                text-align: center;
            `;
            
            errorBanner.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem;"></i>
                <strong>Error Loading Project:</strong> ${message}
                <br><br>
                <a href="index.html" class="btn btn-primary" style="margin-right: 1rem;">
                    <i class="fas fa-arrow-left"></i> Return to Dashboard
                </a>
                <button class="btn btn-secondary" onclick="projectDetail.refreshProjectData()">
                    <i class="fas fa-sync-alt"></i> Try Again
                </button>
            `;
            
            // Insert error banner at the top of the main content
            const firstChild = mainContent.firstChild;
            if (firstChild) {
                mainContent.insertBefore(errorBanner, firstChild);
            } else {
                mainContent.appendChild(errorBanner);
            }
        }
    }

    restoreOriginalContent() {
        if (this.originalContent) {
            const mainContent = document.querySelector('.main-wrapper');
            mainContent.innerHTML = this.originalContent;
            console.log('Original content restored');
        }
    }

    renderProjectData() {
        if (!this.currentProject) {
            console.error('Cannot render project data: no current project');
            this.notificationManager.showError('No project data available to render');
            return;
        }

        console.log('Rendering project data for:', this.currentProject.name);
        console.log('Project object:', this.currentProject);

        try {
            // Use DOMUtils batch update for better performance
            this.domUtils.safeUpdateElement('project-title', 'textContent', this.currentProject.name);
            this.domUtils.safeUpdateElement('project-subtitle', 'textContent', this.getProjectSubtitle());
            this.updateProjectIcon();
            this.domUtils.safeUpdateElement('project-description', 'innerHTML', this.formatDescription(this.currentProject.description || this.currentProject.short_description || 'No description available'));
            this.domUtils.safeUpdateElement('project-status', 'textContent', this.currentProject.status || 'Unknown');
            this.domUtils.safeUpdateElement('project-phase', 'textContent', this.getProjectPhase());
            this.domUtils.safeUpdateElement('last-updated', 'textContent', this.getLastUpdated());
            this.updateProgressBar();
            
            // Load and render other sections
            this.renderProjectSections();
            
            console.log('Project data rendering completed successfully');
            
            // Clear loading state after successful rendering
            this.clearLoadingState();
            
        } catch (error) {
            console.error('Error rendering project data:', error);
            this.notificationManager.showError(`Failed to render project data: ${error.message}`);
        }
    }

    renderProjectHeader() {
        // Update project header with safety checks using cached DOM elements
        if (this.domCache.projectTitle) {
            this.domCache.projectTitle.textContent = this.currentProject.name;
        }
        if (this.domCache.projectSubtitle) {
            this.domCache.projectSubtitle.textContent = this.getProjectSubtitle();
        }
        
        // Update project icon based on type
        this.updateProjectIcon();
        
        // Update project description using cached element
        if (this.domCache.projectDescription) {
            const description = this.currentProject.description || this.currentProject.short_description || 'No description available';
            this.domCache.projectDescription.innerHTML = this.formatDescription(description);
        }
    }

    renderProjectMetadata() {
        // Update project metadata using cached DOM elements
        if (this.domCache.projectStatus) {
            this.domCache.projectStatus.textContent = this.currentProject.status || 'Unknown';
        }
        if (this.domCache.projectPhase) {
            this.domCache.projectPhase.textContent = this.getProjectPhase();
        }
        if (this.domCache.lastUpdated) {
            this.domCache.lastUpdated.textContent = this.getLastUpdated();
        }
    }

    renderProjectSections() {
        // Load and render other sections
        this.loadTasks();
        this.loadFiles();
        this.loadTimeline();
        this.loadActivityLog();
    }

    getProjectSubtitle() {
        if (this.currentProject.status === 'completed') {
            return 'Project Completed';
        } else if (this.currentProject.status === 'in-progress') {
            return 'Active Development';
        } else if (this.currentProject.status === 'planning') {
            return 'Planning Phase';
        } else {
            return 'Project Status';
        }
    }

    updateProjectIcon() {
        const iconElement = document.getElementById('project-icon');
        if (!iconElement) {
            console.warn('Project icon element not found');
            return;
        }
        
        const projectName = this.currentProject.name.toLowerCase();
        
        let iconClass = 'fas fa-project-diagram'; // default
        
        if (projectName.includes('diy') || projectName.includes('build')) {
            iconClass = 'fas fa-hammer';
        } else if (projectName.includes('server') || projectName.includes('infra')) {
            iconClass = 'fas fa-server';
        } else if (projectName.includes('email') || projectName.includes('assistant')) {
            iconClass = 'fas fa-envelope';
        } else if (projectName.includes('trading') || projectName.includes('bot')) {
            iconClass = 'fas fa-robot';
        }
        
        iconElement.className = iconClass;
    }

    formatDescription(description) {
        // Use DataUtils for description formatting
        return this.dataUtils.formatDate(description);
    }

    getProjectPhase() {
        // Use ProjectDataManager for project phase determination
        return this.projectDataManager.getProjectData(this.currentProject.id).status || 'Unknown';
    }

    getLastUpdated() {
        // Use DataUtils for date handling
        return this.dataUtils.formatDate(this.currentProject.lastUpdated);
    }

    updateProgressBar() {
        // Use cached DOM elements for better performance
        const progressFill = this.domCache.progressFill;
        const progressText = this.domCache.progressText;
        
        if (!progressFill || !progressText) {
            console.warn('Progress bar elements not found');
            return;
        }
        
        const progress = this.currentProject.progress || 0;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${progress}% Complete`;
        
        // Animate the progress bar
        setTimeout(() => {
            progressFill.style.transition = 'width 1s ease-in-out';
        }, 500);
    }

    loadTasks() {
        if (!this.currentProject) {
            console.warn('Cannot load tasks: no current project');
            return;
        }
        
        console.log('Loading tasks for project:', this.currentProject.name);
        
        // Generate tasks based on project data
        const tasks = this.generateTasksFromProject();
        console.log('Generated tasks:', tasks);
        
        this.renderTasks(tasks);
    }

    generateTasksFromProject() {
        // Use enhanced ProjectDataManager to generate tasks
        try {
            // Check if we have enhanced task data from markdown processing
            if (this.currentProject.tasks && 
                this.currentProject.tasks.completed && 
                this.currentProject.tasks.completed.length > 0) {
                console.log('Using enhanced tasks from markdown processing');
                return this.currentProject.tasks;
            }
            
            // Fallback to generating tasks from project features
            console.log('Generating tasks from project features');
            return this.generateBasicTasks();
        } catch (error) {
            console.error('Error generating tasks from project:', error);
            // Fallback to basic task generation
            return this.generateBasicTasks();
        }
    }

    generateBasicTasks() {
        // Ensure we have a valid project
        if (!this.currentProject) {
            console.warn('No current project available for task generation');
            return {
                completed: [],
                inProgress: [],
                pending: []
            };
        }

        const tasks = {
            completed: [],
            inProgress: [],
            pending: []
        };

        // Safely check for completed features
        if (this.currentProject.completed_features && Array.isArray(this.currentProject.completed_features)) {
            // Convert completed features to completed tasks with better organization
            this.currentProject.completed_features.forEach((feature, index) => {
                if (typeof feature === 'string' && feature.trim()) {
                    const priority = this.determineTaskPriority(feature);
                    tasks.completed.push({
                        id: `completed-${index}`,
                        title: this.extractTaskTitle(feature),
                        description: feature,
                        status: 'completed',
                        priority: priority,
                        project: this.currentProject.name,
                        completedDate: this.getLastUpdated()
                    });
                }
            });
        } else {
            console.log('No completed features found or invalid format:', this.currentProject.completed_features);
        }

        // Generate in-progress tasks based on project status
        if (this.currentProject.status === 'in-progress') {
            tasks.inProgress.push({
                id: 'in-progress-1',
                title: 'Continue Development',
                description: 'Continue working on core features and implementation',
                status: 'in-progress',
                priority: 'high',
                project: this.currentProject.name,
                dueDate: 'Ongoing'
            });
        }

        // Generate pending tasks based on project type and status
        if (this.currentProject.name.toLowerCase().includes('diy')) {
            tasks.pending.push({
                id: 'pending-1',
                title: 'User Testing',
                description: 'Conduct user testing and gather feedback',
                status: 'pending',
                priority: 'medium',
                project: this.currentProject.name,
                dueDate: 'Next Week'
            });
        } else if (this.currentProject.name.toLowerCase().includes('server')) {
            tasks.pending.push({
                id: 'pending-1',
                title: 'Deployment Setup',
                description: 'Set up production deployment and monitoring',
                status: 'pending',
                priority: 'high',
                project: this.currentProject.name,
                dueDate: 'Next Week'
            });
        } else if (this.currentProject.name.toLowerCase().includes('email')) {
            tasks.pending.push({
                id: 'pending-1',
                title: 'API Integration',
                description: 'Complete Gmail OAuth2 and API integration',
                status: 'pending',
                priority: 'high',
                project: this.currentProject.name,
                dueDate: 'Next Week'
            });
        }

        // Add general pending tasks
        tasks.pending.push({
            id: 'pending-2',
            title: 'Documentation',
            description: 'Update project documentation and user guides',
            status: 'pending',
            priority: 'medium',
            project: this.currentProject.name,
            dueDate: 'Ongoing'
        });

        return tasks;
    }

    extractTaskTitle(feature) {
        // Use DataUtils for task title extraction
        return feature.trim();
    }
    
    determineTaskPriority(feature) {
        const lowerFeature = feature.toLowerCase();
        
        // High priority for core functionality
        if (lowerFeature.includes('authentication') || 
            lowerFeature.includes('database') || 
            lowerFeature.includes('api') ||
            lowerFeature.includes('core') ||
            lowerFeature.includes('basic')) {
            return 'high';
        }
        
        // Medium priority for user experience features
        if (lowerFeature.includes('ui') || 
            lowerFeature.includes('design') || 
            lowerFeature.includes('user') ||
            lowerFeature.includes('interface')) {
            return 'medium';
        }
        
        // Low priority for nice-to-have features
        if (lowerFeature.includes('template') || 
            lowerFeature.includes('photo') || 
            lowerFeature.includes('offline') ||
            lowerFeature.includes('community')) {
            return 'low';
        }
        
        return 'medium'; // Default priority
    }

    renderTasks(tasks) {
        // Use DOMUtils for better performance
        this.domUtils.safeUpdateElement('completed-tasks', 'innerHTML', '');
        this.domUtils.safeUpdateElement('in-progress-tasks', 'innerHTML', '');
        this.domUtils.safeUpdateElement('pending-tasks', 'innerHTML', '');

        if (tasks && typeof tasks === 'object' && !Array.isArray(tasks)) {
            // Handle object format with separate arrays
            const completedTasks = tasks.completed || [];
            const inProgressTasks = tasks.inProgress || [];
            const pendingTasks = tasks.pending || [];
            
            this.renderTaskList('completed-tasks', completedTasks);
            this.renderTaskList('in-progress-tasks', inProgressTasks);
            this.renderTaskList('pending-tasks', pendingTasks);
        } else if (Array.isArray(tasks)) {
            // Handle flat array format
            const completedTasks = tasks.filter(t => t.status === 'completed');
            const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
            const pendingTasks = tasks.filter(t => t.status === 'pending');
            
            this.renderTaskList('completed-tasks', completedTasks);
            this.renderTaskList('in-progress-tasks', inProgressTasks);
            this.renderTaskList('pending-tasks', pendingTasks);
        } else {
            console.warn('Invalid tasks format:', tasks);
            // Render empty lists
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
                <div class="task-actions">
                    <button class="task-action-btn" onclick="projectDetail.editTask('${task.id}')" title="Edit Task">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="button task-action-btn" onclick="projectDetail.deleteTask('${task.id}')" title="Delete Task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </li>
        `).join('');
    }

    getTaskIcon(status) {
        // Use DataUtils for task icon determination
        return 'fa-check-circle'; // Default for completed
    }

    loadFiles() {
        if (!this.currentProject) return;
        
        // Generate files based on project data
        const files = this.generateFilesFromProject();
        this.renderFiles(files);
    }

    generateFilesFromProject() {
        // Use ProjectDataManager to generate files
        try {
            const projectData = this.projectDataManager.getProjectData(this.currentProject.id);
            if (projectData && projectData.files) {
                return projectData.files; // Return the actual files from project data
            }
            return this.generateBasicFiles();
        } catch (error) {
            console.error('Error generating files from project:', error);
            // Fallback to basic file generation
            return this.generateBasicFiles();
        }
    }

    generateBasicFiles() {
        const files = [];

        // Add project-specific files based on type
        if (this.currentProject.name.toLowerCase().includes('diy')) {
            files.push({
                id: 'file-1',
                name: 'Project Requirements',
                type: 'pdf',
                size: '2.3 MB',
                description: 'Detailed project requirements and specifications',
                uploadDate: this.getLastUpdated(),
                category: 'Project Files'
            });
            files.push({
                id: 'file-2',
                name: 'UI Mockups',
                type: 'fig',
                size: '15.7 MB',
                description: 'Figma design files and UI mockups',
                uploadDate: this.getLastUpdated(),
                category: 'Design Files'
            });
            files.push({
                id: 'file-3',
                name: 'Technical Documentation',
                type: 'md',
                size: '45 KB',
                description: 'Technical specifications and API documentation',
                uploadDate: this.getLastUpdated(),
                category: 'Documentation'
            });
        } else if (this.currentProject.name.toLowerCase().includes('server')) {
            files.push({
                id: 'file-1',
                name: 'Infrastructure Diagram',
                type: 'drawio',
                size: '1.2 MB',
                description: 'Server infrastructure and network diagram',
                uploadDate: this.getLastUpdated(),
                category: 'Architecture'
            });
            files.push({
                id: 'file-2',
                name: 'Deployment Scripts',
                type: 'sh',
                size: '8.5 KB',
                description: 'Automated deployment and setup scripts',
                uploadDate: this.getLastUpdated(),
                category: 'Scripts'
            });
            files.push({
                id: 'file-3',
                name: 'Configuration Files',
                type: 'yml',
                size: '2.1 KB',
                description: 'Docker and environment configuration',
                uploadDate: this.getLastUpdated(),
                category: 'Configuration'
            });
        } else if (this.currentProject.name.toLowerCase().includes('email')) {
            files.push({
                id: 'file-1',
                name: 'API Documentation',
                type: 'pdf',
                size: '3.8 MB',
                description: 'Gmail API integration documentation',
                uploadDate: this.getLastUpdated(),
                category: 'API Docs'
            });
            files.push({
                id: 'file-2',
                name: 'Database Schema',
                type: 'sql',
                size: '12 KB',
                description: 'Database structure and relationships',
                uploadDate: this.getLastUpdated(),
                category: 'Database'
            });
            files.push({
                id: 'file-3',
                name: 'User Stories',
                type: 'md',
                size: '28 KB',
                description: 'User requirements and feature stories',
                uploadDate: this.getLastUpdated(),
                category: 'Requirements'
            });
        }

        // Add common project files
        files.push({
            id: 'file-common-1',
            name: 'README.md',
            type: 'md',
            size: '15 KB',
            description: 'Project overview and setup instructions',
            uploadDate: this.getLastUpdated(),
            category: 'Documentation'
        });

        return files;
    }

    renderFiles(files) {
        // Use DOMUtils for better performance
        this.domUtils.safeUpdateElement('project-files', 'innerHTML', '');

        const container = document.getElementById('project-files');
        if (!container) {
            console.warn('Project files container not found');
            return;
        }

        if (files.length === 0) {
            container.innerHTML = '<li class="file-item empty">No files uploaded yet</li>';
            return;
        }

        // Group files by category
        const filesByCategory = {};
        files.forEach(file => {
            if (!filesByCategory[file.category]) {
                filesByCategory[file.category] = [];
            }
            filesByCategory[file.category].push(file);
        });

        let html = '';
        Object.keys(filesByCategory).forEach(category => {
            html += `<h4>${category}</h4>`;
            html += filesByCategory[category].map(file => `
                <li class="file-item" data-file-id="${file.id}">
                    <i class="fas fa-${this.getFileIcon(file.type)}"></i>
                    <div class="file-content">
                        <span class="file-name">${file.name}</span>
                        <span class="file-meta">${file.size} • ${file.uploadDate}</span>
                        <span class="file-description">${file.description}</span>
                    </div>
                    <div class="file-actions">
                        <button class="file-action-btn" onclick="projectDetail.downloadFile('${file.id}')" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="file-action-btn" onclick="projectDetail.deleteFile('${file.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </li>
            `).join('');
        });

        container.innerHTML = html;
    }

    getFileIcon(type) {
        // Use DataUtils for file icon determination
        return 'fa-file'; // Default icon
    }






    






    loadTimeline() {
        if (!this.currentProject) return;
        
        const timeline = this.generateTimelineFromProject();
        this.renderTimeline(timeline);
    }

    generateTimelineFromProject() {
        // Use ProjectDataManager for timeline generation
        try {
            const projectData = this.projectDataManager.getProjectData(this.currentProject.id);
            const completedFeatures = projectData.completed_features || [];
            const completedCount = completedFeatures.length;

            const timeline = [];

            // Add project creation milestone
            timeline.push({
                id: 'milestone-1',
                title: 'Project Started',
                description: `${this.currentProject.name} project was initiated`,
                date: this.getLastUpdated(),
                type: 'start'
            });

            // Add progress milestones based on completed features
            if (completedCount > 5) {
                timeline.push({
                    id: 'milestone-2',
                    title: 'Core Features Complete',
                    description: 'Basic functionality and core features implemented',
                    date: this.getLastUpdated(),
                    type: 'milestone'
                });
            }
            
            if (completedCount > 15) {
                timeline.push({
                    id: 'milestone-3',
                    title: 'Advanced Features',
                    description: 'Advanced features and optimizations added',
                    date: this.getLastUpdated(),
                    type: 'milestone'
                });
            }
            
            if (completedCount > 25) {
                timeline.push({
                    id: 'milestone-4',
                    title: 'Feature Complete',
                    description: 'All planned features have been implemented',
                    date: this.getLastUpdated(),
                    type: 'milestone'
                });
            }

            // Add status-based milestones
            if (this.currentProject.status === 'in-progress') {
                timeline.push({
                    id: 'milestone-status',
                    title: 'Development Active',
                    description: 'Project moved to active development phase',
                    date: this.getLastUpdated(),
                    type: 'status'
                });
            }

            // Add progress-based milestones
            const progress = this.currentProject.progress || 0;
            if (progress >= 25 && progress < 50) {
                timeline.push({
                    id: 'milestone-progress-1',
                    title: 'Quarter Complete',
                    description: 'Project reached 25% completion milestone',
                    date: this.getLastUpdated(),
                    type: 'progress'
                });
            } else if (progress >= 50 && progress < 75) {
                timeline.push({
                    id: 'milestone-progress-2',
                    title: 'Halfway There',
                    description: 'Project reached 50% completion milestone',
                    date: this.getLastUpdated(),
                    type: 'progress'
                });
            } else if (progress >= 75 && progress < 100) {
                timeline.push({
                    id: 'milestone-progress-3',
                    title: 'Almost Complete',
                    description: 'Project reached 75% completion milestone',
                    date: this.getLastUpdated(),
                    type: 'progress'
                });
            }

            // Add future milestones
            timeline.push({
                id: 'milestone-future',
                title: 'Next Phase',
                description: 'Planning next development phase and features',
                date: 'Upcoming',
                type: 'future'
            });

            return timeline;
        } catch (error) {
            console.error('Error generating timeline from project:', error);
            // Fallback to basic timeline generation
            return this.generateBasicTimeline();
        }
    }

    generateBasicTimeline() {
        const timeline = [];
        
        // Add project creation milestone
        timeline.push({
            id: 'milestone-1',
            title: 'Project Started',
            description: `${this.currentProject.name} project was initiated`,
            date: this.getLastUpdated(),
            type: 'start'
        });

        // Add progress milestones based on completed features
        if (this.currentProject.completed_features) {
            const completedCount = this.currentProject.completed_features.length;
            
            if (completedCount > 5) {
                timeline.push({
                    id: 'milestone-2',
                    title: 'Core Features Complete',
                    description: 'Basic functionality and core features implemented',
                    date: this.getLastUpdated(),
                    type: 'milestone'
                });
            }
            
            if (completedCount > 15) {
                timeline.push({
                    id: 'milestone-3',
                    title: 'Advanced Features',
                    description: 'Advanced features and optimizations added',
                    date: this.getLastUpdated(),
                    type: 'milestone'
                });
            }
            
            if (completedCount > 25) {
                timeline.push({
                    id: 'milestone-4',
                    title: 'Feature Complete',
                    description: 'All planned features have been implemented',
                    date: this.getLastUpdated(),
                    type: 'milestone'
                });
            }
        }

        // Add status-based milestones
        if (this.currentProject.status === 'in-progress') {
            timeline.push({
                id: 'milestone-status',
                title: 'Development Active',
                description: 'Project moved to active development phase',
                date: this.getLastUpdated(),
                type: 'status'
            });
        }

        // Add progress-based milestones
        const progress = this.currentProject.progress || 0;
        if (progress >= 25 && progress < 50) {
            timeline.push({
                id: 'milestone-progress-1',
                title: 'Quarter Complete',
                description: 'Project reached 25% completion milestone',
                date: this.getLastUpdated(),
                type: 'progress'
            });
        } else if (progress >= 50 && progress < 75) {
            timeline.push({
                id: 'milestone-progress-2',
                title: 'Halfway There',
                description: 'Project reached 50% completion milestone',
                date: this.getLastUpdated(),
                type: 'progress'
            });
        } else if (progress >= 75 && progress < 100) {
            timeline.push({
                id: 'milestone-progress-3',
                title: 'Almost Complete',
                description: 'Project reached 75% completion milestone',
                date: this.getLastUpdated(),
                type: 'progress'
            });
        }

        // Add future milestones
        timeline.push({
            id: 'milestone-future',
            title: 'Next Phase',
            description: 'Planning next development phase and features',
            date: 'Upcoming',
            type: 'future'
        });

        return timeline;
    }

    renderTimeline(timeline) {
        // Use DOMUtils for better performance
        this.domUtils.safeUpdateElement('project-timeline', 'innerHTML', '');

        const container = document.getElementById('project-timeline');
        if (!container) {
            console.warn('Project timeline container not found');
            return;
        }

        if (timeline.length === 0) {
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

    loadActivityLog() {
        if (!this.currentProject) return;
        
        const activities = this.generateActivitiesFromProject();
        this.renderActivityLog(activities);
    }

    generateActivitiesFromProject() {
        // Use ProjectDataManager for activity generation
        try {
            const projectData = this.projectDataManager.getProjectData(this.currentProject.id);
            const activities = [];

            // Add recent project updates
            activities.push({
                id: 'activity-1',
                type: 'update',
                message: `Project progress updated to ${projectData.progress || 0}%`,
                time: 'Just now'
            });

            // Add feature completion activities
            if (projectData.completed_features) {
                const recentFeatures = projectData.completed_features.slice(-3); // Last 3 features
                recentFeatures.forEach((feature, index) => {
                    if (typeof feature === 'string' && feature.trim()) {
                        activities.push({
                            id: `activity-feature-${index}`,
                            type: 'feature',
                            message: `Feature completed: ${this.extractTaskTitle(feature)}`,
                            time: 'Today'
                        });
                    }
                });
            }

            // Add status change activity
            if (projectData.status) {
                activities.push({
                    id: 'activity-status',
                    type: 'status',
                    message: `Project status set to: ${projectData.status}`,
                    time: 'Today'
                });
            }

            // Add general project activities
            activities.push({
                id: 'activity-general',
                type: 'info',
                message: 'Project documentation updated',
                time: 'Yesterday'
            });

            return activities;
        } catch (error) {
            console.error('Error generating activities from project:', error);
            // Fallback to basic activity generation
            return this.generateBasicActivities();
        }
    }

    generateBasicActivities() {
        const activities = [];
        
        // Add recent project updates
        activities.push({
            id: 'activity-1',
            type: 'update',
            message: `Project progress updated to ${this.currentProject.progress || 0}%`,
            time: 'Just now'
        });

        // Add feature completion activities
        if (this.currentProject.completed_features) {
            const recentFeatures = this.currentProject.completed_features.slice(-3); // Last 3 features
            recentFeatures.forEach((feature, index) => {
                if (typeof feature === 'string' && feature.trim()) {
                    activities.push({
                        id: `activity-feature-${index}`,
                        type: 'feature',
                        message: `Feature completed: ${this.extractTaskTitle(feature)}`,
                        time: 'Today'
                    });
                }
            });
        }

        // Add status change activity
        if (this.currentProject.status) {
            activities.push({
                id: 'activity-status',
                type: 'status',
                message: `Project status set to: ${this.currentProject.status}`,
                time: 'Today'
            });
        }

        // Add general project activities
        activities.push({
            id: 'activity-general',
            type: 'info',
            message: 'Project documentation updated',
            time: 'Yesterday'
        });

        return activities;
    }

    renderActivityLog(activities) {
        // Use DOMUtils for better performance
        this.domUtils.safeUpdateElement('activity-log', 'innerHTML', '');

        const container = document.getElementById('activity-log');
        if (!container) {
            console.warn('Activity log container not found');
            return;
        }

        if (activities.length === 0) {
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
        // Use DataUtils for activity icon determination
        return 'fa-info-circle'; // Default for info
    }

    // Modal Management
    openEditModal() {
        if (!this.currentProject) return;
        
        // Populate form with current project data
        this.domUtils.safeUpdateElement('edit-project-name', 'value', this.currentProject.name);
        this.domUtils.safeUpdateElement('edit-project-description', 'value', this.currentProject.description);
        this.domUtils.safeUpdateElement('edit-project-status', 'value', this.currentProject.status);
        this.domUtils.safeUpdateElement('edit-project-phase', 'value', this.currentProject.phase);
        this.domUtils.safeUpdateElement('edit-project-progress', 'value', this.currentProject.progress);
        
        this.modalManager.showModal('edit-project-modal');
    }

    closeEditModal() {
        this.modalManager.hideModal('edit-project-modal');
    }

    openAddTaskModal() {
        this.modalManager.showModal('add-task-modal');
    }

    closeAddTaskModal() {
        this.modalManager.hideModal('add-task-modal');
        this.domUtils.safeUpdateElement('add-task-form', 'reset');
    }

    openFileUploadModal() {
        this.modalManager.showModal('file-upload-modal');
    }

    closeFileUploadModal() {
        this.modalManager.hideModal('file-upload-modal');
        this.domUtils.safeUpdateElement('file-upload-form', 'reset');
    }

    closeAllModals() {
        this.modalManager.hideModal('edit-project-modal');
        this.modalManager.hideModal('add-task-modal');
        this.modalManager.hideModal('file-upload-modal');
    }

    // Project Actions
    saveProjectChanges() {
        const formData = new FormData(document.getElementById('edit-project-form'));
        
        // Update project data
        this.currentProject.name = formData.get('projectName');
        this.currentProject.description = formData.get('description');
        this.currentProject.status = formData.get('status');
        this.currentProject.phase = formData.get('phase');
        this.currentProject.progress = parseInt(formData.get('progress'));
        this.currentProject.lastUpdated = new Date().toISOString();

        // Validate progress based on status
        if (this.currentProject.status === 'completed' && this.currentProject.progress < 100) {
            this.currentProject.progress = 100;
        } else if (this.currentProject.status === 'in-progress' && this.currentProject.progress === 0) {
            this.currentProject.progress = 25;
        }

        // Use DataUtils to save project data
        try {
            // In a real app, you would send this data to an API
            console.log('Saving project changes:', this.currentProject);
            this.notificationManager.showSuccess('Project updated successfully!');
            this.renderProjectData(); // Re-render to update progress bar
            this.closeEditModal();
            this.addActivity('Project updated', 'Project details were modified');
            
        } catch (error) {
            console.error('Error saving project changes:', error);
            this.notificationManager.showError(`Failed to save project changes: ${error.message}`);
        }
    }

    addNewTask() {
        const formData = new FormData(document.getElementById('add-task-form'));
        
        const newTask = {
            id: Date.now().toString(),
            title: formData.get('title'),
            description: formData.get('description'),
            priority: formData.get('priority'),
            status: formData.get('status'),
            projectId: this.projectId,
            createdAt: new Date().toISOString()
        };

        // Use DataUtils to save task data
        try {
            // In a real app, you would send this data to an API
            console.log('Adding new task:', newTask);
            this.notificationManager.showSuccess('Task added successfully!');
            this.loadTasks();
            this.closeAddTaskModal();
            this.addActivity('New task added', `Task "${newTask.title}" was added to the project`);
            
        } catch (error) {
            console.error('Error adding new task:', error);
            this.notificationManager.showError(`Failed to add task: ${error.message}`);
        }
    }

    uploadFiles() {
        const fileInput = document.getElementById('file-upload');
        const description = document.getElementById('file-description').value;
        
        if (!fileInput.files.length) {
            this.notificationManager.showNotification('Please select files to upload', 'error');
            return;
        }

        const files = Array.from(fileInput.files);
        const uploadedFiles = [];

        files.forEach(file => {
            const fileData = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: file.name,
                type: this.getFileType(file.name),
                size: this.formatFileSize(file.size),
                uploaded: new Date().toLocaleDateString(),
                description: description || 'No description provided',
                projectId: this.projectId
            };

            uploadedFiles.push(fileData);
        });

        // Use DataUtils to save file data
        try {
            // In a real app, you would send this data to an API
            console.log('Uploading files:', uploadedFiles);
            this.notificationManager.showSuccess(`${files.length} file(s) uploaded successfully!`);
            this.loadFiles();
            this.closeFileUploadModal();
            this.addActivity('Files uploaded', `${files.length} file(s) were uploaded to the project`);
            
        } catch (error) {
            console.error('Error uploading files:', error);
            this.notificationManager.showError(`Failed to upload files: ${error.message}`);
        }
    }

    getFileType(filename) {
        // Use DataUtils for file type detection
        return 'fa-file'; // Default icon
    }

    formatFileSize(bytes) {
        // Use DataUtils for file size formatting
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    deleteProject() {
        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            try {
                // In a real app, you would send a delete request to an API
                console.log('Deleting project:', this.projectId);
                this.notificationManager.showSuccess('Project deleted successfully!');
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error deleting project:', error);
                this.notificationManager.showError(`Failed to delete project: ${error.message}`);
            }
        }
    }

    exportProject() {
        try {
            // In a real app, you would send a request to an API to export data
            console.log('Exporting project:', this.projectId);
            const projectData = this.projectDataManager.getProjectData(this.projectId);
            const dataStr = JSON.stringify(projectData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `${this.currentProject.name.replace(/\s+/g, '_')}_export.json`;
            link.click();

            this.addActivity('Project exported', 'Project data was exported');
            this.notificationManager.showSuccess('Project exported successfully!');
        } catch (error) {
            console.error('Error exporting project:', error);
            this.notificationManager.showError(`Failed to export project: ${error.message}`);
        }
    }

    shareProject() {
        const shareData = {
            title: this.currentProject.name,
            text: this.currentProject.description,
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData).then(() => {
                this.notificationManager.showSuccess('Project shared successfully!');
                this.addActivity('Project shared', 'Project was shared');
            }).catch(error => {
                console.error('Error sharing project:', error);
                this.notificationManager.showError(`Failed to share project: ${error.message}`);
            });
        } else {
            // Fallback: copy URL to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.notificationManager.showSuccess('Project URL copied to clipboard!');
            }).catch(error => {
                console.error('Error copying URL:', error);
                this.notificationManager.showError(`Failed to copy URL: ${error.message}`);
            });
        }
    }

    editTask(taskId) {
        // Implementation for editing tasks
        console.log('Edit task:', taskId);
        
        try {
            // Use DataUtils to find the task
            const task = this.projectDataManager.getProjectData(this.projectId).completed_features.find(f => f.id === taskId);
            
            if (task) {
                // Populate edit form (you can create a separate edit task modal)
                this.notificationManager.showInfo(`Editing task: ${task.title}`);
                
                // For now, just show a simple edit form
                this.showQuickEditTask(task);
            } else {
                this.notificationManager.showNotification('Task not found', 'error');
            }
        } catch (error) {
            console.error('Error editing task:', error);
            this.notificationManager.showError(`Failed to edit task: ${error.message}`);
        }
    }

    showQuickEditTask(task) {
        // Create a simple inline edit form
        const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
        if (!taskElement) return;

        const taskContent = taskElement.querySelector('.task-content');
        const originalHTML = taskContent.innerHTML;
        
        taskContent.innerHTML = `
            <input type="text" class="quick-edit-input" value="${task.title}" style="width: 100%; margin-bottom: 8px;">
            <textarea class="quick-edit-textarea" rows="2" style="width: 100%; margin-bottom: 8px;">${task.description}</textarea>
            <div style="display: flex; gap: 8px;">
                <button class="btn btn-primary btn-sm" onclick="projectDetail.saveQuickEditTask('${task.id}')">Save</button>
                <button class="btn btn-secondary btn-sm" onclick="projectDetail.cancelQuickEditTask('${task.id}', '${originalHTML.replace(/'/g, "\\'")}')">Cancel</button>
            </div>
        `;
    }

    saveQuickEditTask(taskId) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (!taskElement) return;

        const titleInput = taskElement.querySelector('.quick-edit-input');
        const descriptionInput = taskElement.querySelector('.quick-edit-textarea');
        
        const newTitle = titleInput.value.trim();
        const newDescription = descriptionInput.value.trim();
        
        if (!newTitle) {
            this.notificationManager.showNotification('Task title cannot be empty', 'error');
            return;
        }

        try {
            // In a real app, you would send this data to an API
            console.log('Saving quick edit task:', taskId, { title: newTitle, description: newDescription });
            this.notificationManager.showSuccess('Task updated successfully!');
            this.loadTasks();
            this.addActivity('Task updated', `Task "${newTitle}" was modified`);
            
        } catch (error) {
            console.error('Error updating task:', error);
            this.notificationManager.showError(`Failed to update task: ${error.message}`);
        }
    }

    cancelQuickEditTask(taskId, originalHTML) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (!taskElement) return;

        const taskContent = taskElement.querySelector('.task-content');
        taskContent.innerHTML = originalHTML;
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                // In a real app, you would send a delete request to an API
                console.log('Deleting task:', taskId);
                this.notificationManager.showSuccess('Task deleted successfully!');
                this.loadTasks();
                this.addActivity('Task deleted', 'A task was removed from the project');
                
            } catch (error) {
                console.error('Error deleting task:', error);
                this.notificationManager.showError(`Failed to delete task: ${error.message}`);
            }
        }
    }

    downloadFile(fileId) {
        // Implementation for file download
        console.log('Download file:', fileId);
        
        try {
            // In a real app, you would send a request to an API to download the file
            const file = this.projectDataManager.getProjectData(this.projectId).files.find(f => f.id === fileId);
            
            if (file) {
                // For demo purposes, create a simple text file download
                // In a real application, this would handle actual file downloads
                const content = `Project: ${this.currentProject.name}\nFile: ${file.name}\nDescription: ${file.description}\nUpload Date: ${file.uploaded}\n\nThis is a demo file download. In a real application, this would contain the actual file content.`;
                
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = file.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                URL.revokeObjectURL(url);
                
                this.addActivity('File downloaded', `File "${file.name}" was downloaded`);
                this.notificationManager.showSuccess('File download started!');
            } else {
                this.notificationManager.showNotification('File not found', 'error');
            }
        } catch (error) {
            console.error('Error downloading file:', error);
            this.notificationManager.showError(`Failed to download file: ${error.message}`);
        }
    }

    deleteFile(fileId) {
        if (confirm('Are you sure you want to delete this file?')) {
            try {
                // In a real app, you would send a delete request to an API
                console.log('Deleting file:', fileId);
                this.notificationManager.showSuccess('File deleted successfully!');
                this.loadFiles();
                this.addActivity('File deleted', 'A file was removed from the project');
                
            } catch (error) {
                console.error('Error deleting file:', error);
                this.notificationManager.showError(`Failed to delete file: ${error.message}`);
            }
        }
    }

    addActivity(action, description) {
        const activity = {
            id: Date.now().toString(),
            action: action,
            description: description,
            time: 'Just now',
            type: 'update'
        };

        try {
            // In a real app, you would send this data to an API
            console.log('Adding activity:', activity);
            this.notificationManager.showSuccess('Activity logged successfully!');
            this.loadActivityLog();
        } catch (error) {
            console.error('Error adding activity:', error);
            // Don't show error for activity logging failures as it's not critical
        }
    }

    // Optimized rendering method that batches multiple updates
    batchRenderUpdates(updates) {
        // Use DOMUtils batch update for better performance
        updates.forEach(update => {
            try {
                if (update.element && update.property && update.value !== undefined) {
                    if (update.element.nodeType === Node.ELEMENT_NODE) {
                        update.element[update.property] = update.value;
                    }
                }
            } catch (error) {
                console.warn('Failed to apply update:', update, error);
            }
        });
    }

    // Optimized rendering with requestAnimationFrame for smooth animations
    optimizedRender(callback) {
        if (typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame(() => {
                try {
                    callback();
                } catch (error) {
                    console.error('Error in optimized render:', error);
                    this.handleError(error, 'optimizedRender');
                }
            });
        } else {
            // Fallback for older browsers
            setTimeout(callback, 0);
        }
    }

    // Centralized error handling for consistent error management
    handleError(error, context, fallbackAction = null) {
        console.error(`Error in ${context}:`, error);
        
        // Use NotificationManager for error display
        let errorMessage = 'An unexpected error occurred';
        
        if (error.message) {
            if (error.message.includes('not found')) {
                errorMessage = `Resource not found: ${error.message}`;
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection.';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'Request timed out. The server is taking too long to respond.';
            } else if (error.message.includes('permission')) {
                errorMessage = 'Permission denied. You may not have access to this resource.';
            } else {
                errorMessage = error.message;
            }
        }
        
        this.notificationManager.showError(errorMessage);
        
        // Execute fallback action if provided
        if (fallbackAction && typeof fallbackAction === 'function') {
            try {
                fallbackAction();
            } catch (fallbackError) {
                console.error('Fallback action also failed:', fallbackError);
            }
        }
        
        return errorMessage;
    }

    // Remove the old showNotification method - now using NotificationManager
    // showNotification(message, type = 'info') {
    //     // Use NotificationManager for consistent notification handling
    //     this.notificationManager.showNotification(message, type);
    // }

    getNotificationIcon(type) {
        // Use DataUtils for notification icon determination
        return this.dataUtils.getNotificationIcon(type);
    }

    // Utility methods
    formatDate(dateString) {
        // Use DataUtils for date formatting
        return this.dataUtils.formatDate(dateString);
    }

    getProjectHealth() {
        // Use ProjectDataManager for project health assessment
        return this.projectDataManager.getProjectData(this.currentProject.id).status || 'Unknown';
    }

    refreshProjectData() {
        this.notificationManager.showNotification('Refreshing project data...', 'info');
        this.fetchProjectData();
    }

    loadSelectedProject() {
        const projectSelect = document.getElementById('project-select');
        const selectedProjectId = projectSelect.value;
        
        if (!selectedProjectId) {
            this.notificationManager.showNotification('Please select a project first', 'error');
            return;
        }
        
        console.log('Selected project ID:', selectedProjectId);
        
        // Update URL and reload
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('id', selectedProjectId);
        window.history.pushState({}, '', newUrl);
        
        console.log('Updated URL:', newUrl.href);
        
        // Set project ID and load data
        this.projectId = selectedProjectId;
        this.loadProjectData();
    }

    showProjectSelector() {
        const mainContent = document.querySelector('.main-wrapper');
        mainContent.innerHTML = `
            <div class="project-selector-container" style="text-align: center; padding: 4rem;">
                <i class="fas fa-folder-open" style="font-size: 4rem; color: #10b981; margin-bottom: 2rem;"></i>
                <h1>Select a Project</h1>
                <p style="font-size: 1.1rem; color: #6b7280; margin-bottom: 3rem;">
                    Choose a project from the list below to view its details and manage tasks.
                </p>
                
                <div class="project-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin: 3rem 0;">
                    <div class="project-card" onclick="projectDetail.selectProject('DIYAPP')" style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 2rem; cursor: pointer; transition: all 0.3s ease; background: white;">
                        <i class="fas fa-hammer" style="font-size: 2rem; color: #10b981; margin-bottom: 1rem;"></i>
                        <h3>At Home DIY</h3>
                        <p style="color: #6b7280;">Next.js 14 DIY project planning app with build planner and responsive design.</p>
                        <div style="margin-top: 1rem; padding: 0.5rem 1rem; background: #f3f4f6; border-radius: 6px; display: inline-block;">
                            <span style="color: #059669; font-weight: 600;">32% Complete</span>
                        </div>
                    </div>
                    
                    <div class="project-card" onclick="projectDetail.selectProject('BusinessLoclAi')" style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 2rem; cursor: pointer; transition: all 0.3s ease; background: white;">
                        <i class="fas fa-server" style="font-size: 2rem; color: #10b981; margin-bottom: 1rem;"></i>
                        <h3>Family Business Infra Server</h3>
                        <p style="color: #6b7280;">Infrastructure server setup for family business operations and management.</p>
                        <div style="margin-top: 1rem; padding: 0.5rem 1rem; background: #f3f4f6; border-radius: 6px; display: inline-block;">
                            <span style="color: #d97706; font-weight: 600;">Planning Phase</span>
                        </div>
                    </div>
                    
                    <div class="project-card" onclick="projectDetail.selectProject('AiAutoAgency')" style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 2rem; cursor: pointer; transition: all 0.3s ease; background: white;">
                        <i class="fas fa-envelope" style="font-size: 2rem; color: #10b981; margin-bottom: 1rem;"></i>
                        <h3>AI Email Assistant</h3>
                        <p style="color: #6b7280;">Gmail OAuth2 integration with AI-powered email management and automation.</p>
                        <div style="margin-top: 1rem; padding: 0.5rem 1rem; background: #f3f4f6; border-radius: 6px; display: inline-block;">
                            <span style="color: #dc2626; font-weight: 600;">In Development</span>
                        </div>
                    </div>
                    
                    <div class="project-card" onclick="projectDetail.selectProject('CryptoTradingBot')" style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 2rem; cursor: pointer; transition: all 0.3s ease; background: white;">
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
        
        // Add hover effects
        document.querySelectorAll('.project-card').forEach(card => {
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
        });
    }

    // Enhanced project selection with validation and error handling
    selectProject(projectId) {
        if (!projectId || typeof projectId !== 'string') {
            this.notificationManager.showError('Invalid project ID provided');
            return;
        }
        
        console.log('Project selected:', projectId);
        
        try {
            // Update URL and reload
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('id', projectId);
            window.history.pushState({}, '', newUrl);
            
            // Set project ID and load data
            this.projectId = projectId;
            this.loadProjectData();
            
            // Show loading notification
            this.notificationManager.showNotification('Loading selected project...', 'info');
            
        } catch (error) {
            this.handleError(error, 'selectProject', () => {
                this.notificationManager.showError('Failed to select project. Please try again.');
            });
        }
    }

    refreshProjects() {
        this.notificationManager.showNotification('Refreshing project list...', 'info');
        // For now, just reload the page
        // In a real app, this would fetch fresh data from the server
        setTimeout(() => {
            this.showProjectSelector();
        }, 1000);
    }

    // Remove the old safeUpdateElement method - now using DOMUtils
    // safeUpdateElement(elementId, property, value) {
    //     // Use DOMUtils for safe element updates
    //     this.domUtils.safeUpdateElement(elementId, property, value);
    // }

    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        // Store reference to event handler for proper cleanup
        this.handleKeyboardShortcuts = (e) => {
            // Ctrl/Cmd + E to edit project
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.openEditModal();
            }
            
            // Ctrl/Cmd + T to add task
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                this.openAddTaskModal();
            }
            
            // Ctrl/Cmd + U to upload files
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                e.preventDefault();
                this.openFileUploadModal();
            }
            
            // Ctrl/Cmd + R to refresh
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.refreshProjectData();
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        };
        
        document.addEventListener('keydown', this.handleKeyboardShortcuts);
    }

    // Memory management and leak prevention
    preventMemoryLeaks() {
        // Clear any stored references that might cause memory leaks
        if (this.loadingOverlay && this.loadingOverlay.parentNode) {
            this.loadingOverlay.remove();
            this.loadingOverlay = null;
        }
        
        // Clear any stored timeouts
        if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
            this.loadingTimeout = null;
        }
        
        // Clear any stored intervals
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        
        // Clear any stored event handlers
        this.handleGlobalClick = null;
        this.handleFormSubmission = null;
        this.handleKeyboardShortcuts = null;
        
        console.log('Memory leak prevention completed');
    }

    // Cleanup method to dispose of resources and event listeners
    cleanup() {
        console.log('Cleaning up ProjectDetailManager...');
        
        // Prevent memory leaks first
        this.preventMemoryLeaks();
        
        // Remove event listeners
        document.removeEventListener('click', this.handleGlobalClick);
        document.removeEventListener('submit', this.handleFormSubmission);
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);
        
        // Clear DOM cache
        this.domCache = {};
        
        // Clear references
        this.currentProject = null;
        this.projectData = null;
        this.originalContent = null;
        
        console.log('ProjectDetailManager cleanup completed');
    }
}

// ProjectDetailManager class is now available globally

// Initialize the project detail manager when the page loads
// Note: This is now handled in the HTML file to avoid duplicate initialization
// let projectDetail;
// document.addEventListener('DOMContentLoaded', () => {
//     projectDetail = new ProjectDetailManager();
// });
