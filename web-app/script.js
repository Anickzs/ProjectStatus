// Enhanced JavaScript for Project In Progress Dashboard
let githubDataManager = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Project In Progress Dashboard loaded');
    
    try {
        // Initialize GitHub data manager
        await initializeGitHubDataManager();
        
        // Initialize all interactive features
        setupProjectCards();
        setupProgressAnimations();
        setupHoverEffects();
        setupStatusIndicators();
        setupNavigation();
        setupMobileMenu();
        
        // Add entrance animations
        animateEntrance();
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        showNotification('Failed to load project data from GitHub', 'error');
    }
});

async function initializeGitHubDataManager() {
    try {
        // Create and initialize the GitHub data manager
        githubDataManager = new GitHubDataManager();
        await githubDataManager.initialize();
        
        // Make it globally available for other scripts
        window.githubDataManager = githubDataManager;
        
        console.log('GitHub data manager initialized successfully');
        showNotification('Project data loaded from GitHub', 'success');
    } catch (error) {
        console.error('Failed to initialize GitHub data manager:', error);
        showNotification('Failed to load project data from GitHub', 'error');
        throw error; // Re-throw to prevent further initialization
    }
}

async function setupProjectCards() {
    // Only use GitHub data
    if (githubDataManager && githubDataManager.initialized) {
        await populateProjectCardsFromGitHub();
    } else {
        console.warn('GitHub data manager not available, cannot populate project cards');
        showNotification('GitHub data not available', 'error');
    }
}

async function populateProjectCardsFromGitHub() {
    try {
        const projects = githubDataManager.getAllProjects();
        const projectsGrid = document.querySelector('.projects-grid');
        
        if (!projectsGrid || projects.length === 0) {
            console.warn('No projects found or projects grid not available');
            return;
        }
        
        // Clear existing cards
        projectsGrid.innerHTML = '';
        
        // Create cards for each project
        projects.forEach((project, index) => {
            const projectCard = createProjectCard(project, index);
            projectsGrid.appendChild(projectCard);
        });
        
        console.log(`Populated ${projects.length} project cards from GitHub data`);
        
            } catch (error) {
            console.error('Error populating project cards from GitHub:', error);
            showNotification('Failed to load project data from GitHub', 'error');
        }
}

function createProjectCard(project, index) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    // Add staggered entrance animation
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, index * 150);
    
    // Determine project icon and type
    const projectType = getProjectType(project.name);
    const iconClass = getProjectIcon(projectType);
    const statusClass = getStatusClass(project.status);
    
    card.innerHTML = `
        <div class="project-header">
            <div class="project-title">
                <div class="project-icon ${projectType.toLowerCase()}-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="title-content">
                    <h3>${project.name}</h3>
                    <span class="project-tag">${projectType}</span>
                </div>
                <i class="fas fa-external-link-alt external-link"></i>
            </div>
            <div class="project-actions">
                <div class="status-dropdown">
                    <span class="status-indicator ${statusClass}">
                        <i class="fas fa-circle"></i>
                        ${project.status}
                    </span>
                </div>
                <button class="edit-btn" title="Edit Project">
                    <i class="fas fa-pencil-alt"></i>
                </button>
            </div>
        </div>
        
        <p class="project-description">${project.description}</p>
        
        <div class="project-phase">
            <i class="fas fa-layer-group"></i>
            Phase ${getProjectPhase(project.progress)}: ${getPhaseDescription(project.progress)}
        </div>
        
        <div class="project-meta">
            <span class="last-updated">
                <i class="fas fa-calendar-alt"></i>
                Last updated: ${formatDate(project.last_updated)}
            </span>
            <div class="progress-indicator">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${project.progress}%"></div>
                </div>
                <span class="progress-text">${project.progress}% Complete</span>
            </div>
        </div>
        
        <div class="project-content">
            <div class="content-section completed">
                <div class="section-header">
                    <i class="fas fa-check-circle"></i>
                    <h4>Completed (${project.completed_features.length})</h4>
                </div>
                <ul>
                    ${project.completed_features.slice(0, 5).map(feature => `<li>${feature}</li>`).join('')}
                    ${project.completed_features.length > 5 ? `<li class="more-features">... and ${project.completed_features.length - 5} more</li>` : ''}
                </ul>
            </div>
            
            <div class="content-section next-steps">
                <div class="section-header">
                    <i class="fas fa-file-alt"></i>
                    <h4>Next Steps (${project.todo_features.length})</h4>
                </div>
                <ul>
                    ${project.todo_features.slice(0, 5).map(feature => `<li>${feature}</li>`).join('')}
                    ${project.todo_features.length > 5 ? `<li class="more-features">... and ${project.todo_features.length - 5} more</li>` : ''}
                </ul>
            </div>
            
            ${project.technical_stack && project.technical_stack.length > 0 ? `
            <div class="content-section tech-stack">
                <div class="section-header">
                    <i class="fas fa-code"></i>
                    <h4>Tech Stack</h4>
                </div>
                <div class="tech-tags">
                    ${project.technical_stack.slice(0, 6).map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                    ${project.technical_stack.length > 6 ? `<span class="tech-tag more">+${project.technical_stack.length - 6}</span>` : ''}
                </div>
            </div>
            ` : ''}
            
            ${project.key_features && project.key_features.length > 0 ? `
            <div class="content-section key-features">
                <div class="section-header">
                    <i class="fas fa-star"></i>
                    <h4>Key Features</h4>
                </div>
                <ul>
                    ${project.key_features.slice(0, 4).map(feature => `<li>${feature}</li>`).join('')}
                    ${project.key_features.length > 4 ? `<li class="more-features">... and ${project.key_features.length - 4} more</li>` : ''}
                </ul>
            </div>
            ` : ''}
        </div>
        
        <div class="project-footer">
            <button class="view-details-btn" onclick="navigateToProjectDetail('${project.name}')">
                <i class="fas fa-eye"></i>
                View Full Details
            </button>
            <button class="expand-card-btn" onclick="toggleCardExpansion(this)">
                <i class="fas fa-expand-alt"></i>
                Show More
            </button>
        </div>
    `;
    
    // Add event listeners
    setupProjectCardEventListeners(card, project);
    
    return card;
}

function setupProjectCardEventListeners(card, project) {
    // Add click event for edit button
    const editBtn = card.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            handleEditProject(card);
        });
    }
    
    // Add click event for external link
    const externalLink = card.querySelector('.external-link');
    if (externalLink) {
        externalLink.addEventListener('click', function(e) {
            e.stopPropagation();
            handleExternalLink(card);
        });
    }
    
    // Add click event for status indicator
    const statusIndicator = card.querySelector('.status-indicator');
    if (statusIndicator) {
        statusIndicator.addEventListener('click', function(e) {
            e.stopPropagation();
            handleStatusChange(card);
        });
    }
    
    // Add click event for the entire card
    card.addEventListener('click', function(e) {
        if (!e.target.closest('.edit-btn') && !e.target.closest('.external-link') && !e.target.closest('.status-indicator')) {
            navigateToProjectDetail(project.name);
        }
    });
}

// Static project cards function removed - only using GitHub data

// Helper functions for project card creation
function getProjectType(projectName) {
    const name = projectName.toLowerCase();
    if (name.includes('diy')) return 'DIY App';
    if (name.includes('server') || name.includes('infra')) return 'Infrastructure';
    if (name.includes('email') || name.includes('assistant')) return 'AI Automation';
    if (name.includes('trading') || name.includes('bot')) return 'Financial AI';
    return 'Web Application';
}

function getProjectIcon(projectType) {
    const icons = {
        'DIY App': 'fas fa-hammer',
        'Infrastructure': 'fas fa-server',
        'AI Automation': 'fas fa-envelope',
        'Financial AI': 'fas fa-robot',
        'Web Application': 'fas fa-project-diagram'
    };
    return icons[projectType] || 'fas fa-project-diagram';
}

function getStatusClass(status) {
    const statusMap = {
        'Completed': 'status-completed',
        'In Progress': 'status-progress',
        'Planning': 'status-planning',
        'Pending': 'status-pending'
    };
    return statusMap[status] || 'status-unknown';
}

function getProjectPhase(progress) {
    if (progress >= 80) return 4;
    if (progress >= 60) return 3;
    if (progress >= 40) return 2;
    if (progress >= 20) return 1;
    return 0;
}

function getPhaseDescription(progress) {
    if (progress >= 80) return 'Testing & Polish';
    if (progress >= 60) return 'Advanced Features';
    if (progress >= 40) return 'Core Development';
    if (progress >= 20) return 'Basic Setup';
    return 'Planning & Research';
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    } catch (error) {
        return dateString;
    }
}

function setupProgressAnimations() {
    const progressBars = document.querySelectorAll('.progress-fill');
    
    // Animate progress bars on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target;
                const width = progressBar.style.width;
                
                // Reset width to 0 and animate to target
                progressBar.style.width = '0%';
                setTimeout(() => {
                    progressBar.style.width = width;
                }, 300);
                
                observer.unobserve(progressBar);
            }
        });
    }, { threshold: 0.5 });
    
    progressBars.forEach(bar => observer.observe(bar));
}

function setupHoverEffects() {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            // Add subtle scale effect - preserve existing transform from animations
            const currentTransform = this.style.transform;
            if (currentTransform && !currentTransform.includes('scale')) {
                this.style.transform = currentTransform + ' scale(1.02)';
            } else if (!currentTransform) {
                this.style.transform = 'scale(1.02)';
            }
            
            // Animate the top border
            const topBorder = this.querySelector('::before');
            if (topBorder) {
                this.style.setProperty('--border-opacity', '1');
            }
        });
        
        card.addEventListener('mouseleave', function() {
            // Reset to original animation state
            const currentTransform = this.style.transform;
            if (currentTransform && currentTransform.includes('scale')) {
                this.style.transform = currentTransform.replace(' scale(1.02)', '');
            }
            
            // Reset border opacity
            this.style.setProperty('--border-opacity', '0');
        });
    });
}

function setupStatusIndicators() {
    const statusIndicators = document.querySelectorAll('.status-indicator');
    
    statusIndicators.forEach(indicator => {
        // Add ripple effect on click
        indicator.addEventListener('click', function(e) {
            createRippleEffect(e, this);
        });
    });
}

function createRippleEffect(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

function animateEntrance() {
    // Animate header elements
    const headerIcon = document.querySelector('.header-icon');
    const headerTitle = document.querySelector('.header h1');
    const headerStats = document.querySelector('.header-stats');
    
    if (headerIcon) {
        headerIcon.style.opacity = '0';
        headerIcon.style.transform = 'scale(0.8) rotate(-10deg)';
        setTimeout(() => {
            headerIcon.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
            headerIcon.style.opacity = '1';
            headerIcon.style.transform = 'scale(1) rotate(0deg)';
        }, 200);
    }
    
    if (headerTitle) {
        headerTitle.style.opacity = '0';
        headerTitle.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            headerTitle.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            headerTitle.style.opacity = '1';
            headerTitle.style.transform = 'translateX(0)';
        }, 400);
    }
    
    if (headerStats) {
        headerStats.style.opacity = '0';
        headerStats.style.transform = 'translateX(20px)';
        setTimeout(() => {
            headerStats.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            headerStats.style.opacity = '1';
            headerStats.style.transform = 'translateX(0)';
        }, 600);
    }
}

function handleEditProject(card) {
    const projectName = card.querySelector('h3').textContent;
    console.log('Edit project:', projectName);
    
    // Add visual feedback
    card.style.transform = 'scale(0.98)';
    setTimeout(() => {
        card.style.transform = 'scale(1)';
    }, 150);
    
    // You can implement edit modal here
    showNotification(`Editing ${projectName}`, 'info');
}

function handleExternalLink(card) {
    const projectName = card.querySelector('h3').textContent;
    console.log('Open external link for:', projectName);
    
    // Add visual feedback
    const link = card.querySelector('.external-link');
    link.style.transform = 'scale(1.2) rotate(15deg)';
    setTimeout(() => {
        link.style.transform = 'scale(1) rotate(0deg)';
    }, 300);
    
    showNotification(`Opening external link for ${projectName}`, 'success');
}

function handleStatusChange(card) {
    const projectName = card.querySelector('h3').textContent;
    console.log('Change status for:', projectName);
    
    // Add visual feedback
    const statusIndicator = card.querySelector('.status-indicator');
    statusIndicator.style.transform = 'scale(1.1)';
    setTimeout(() => {
        statusIndicator.style.transform = 'scale(1)';
    }, 200);
    
    showNotification(`Status change requested for ${projectName}`, 'warning');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        'info': 'info-circle',
        'success': 'check-circle',
        'warning': 'exclamation-triangle',
        'error': 'times-circle'
    };
    return icons[type] || 'info-circle';
}

// Add CSS for notifications
const notificationStyles = `
<style>
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    border-left: 4px solid #10b981;
    transform: translateX(400px);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1000;
    max-width: 300px;
}

.notification.show {
    transform: translateX(0);
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.notification i {
    font-size: 18px;
    color: #10b981;
}

.notification span {
    color: #374151;
    font-weight: 500;
}

.notification-info {
    border-left-color: #3b82f6;
}

.notification-info i {
    color: #3b82f6;
}

.notification-success {
    border-left-color: #10b981;
}

.notification-success i {
    color: #10b981;
}

.notification-warning {
    border-left-color: #f59e0b;
}

.notification-warning i {
    color: #f59e0b;
}

.notification-error {
    border-left-color: #ef4444;
}

.notification-error i {
    color: #ef4444;
}

.ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
    pointer-events: none;
}

@keyframes ripple-animation {
    to {
        transform: scale(4);
        opacity: 0;
    }
}
</style>
`;

// Navigation System
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get the page identifier
            const page = this.getAttribute('data-page');
            
            // Handle navigation
            handlePageNavigation(page);
        });
    });
    
    // Setup project card navigation
    setupProjectCardNavigation();
}

function handlePageNavigation(page) {
    console.log('Navigating to:', page);
    
    // Show notification
    showNotification(`Navigating to ${page.charAt(0).toUpperCase() + page.slice(1)}`, 'info');
    
    // For now, just show a placeholder message
    // In the future, this will load different page content
    switch(page) {
        case 'dashboard':
            // Already on dashboard
            break;
        case 'projects':
            showNotification('Projects page coming soon!', 'info');
            break;
        case 'tasks':
            showNotification('Task Management coming soon!', 'info');
            break;
        case 'analytics':
            showNotification('Analytics Dashboard coming soon!', 'info');
            break;
        case 'settings':
            showNotification('Settings page coming soon!', 'info');
            break;
        default:
            console.log('Unknown page:', page);
    }
}

function setupProjectCardNavigation() {
    const projectCards = document.querySelectorAll('.project-card');
    console.log('Setting up navigation for', projectCards.length, 'project cards');
    
    projectCards.forEach((card, index) => {
        console.log(`Setting up card ${index}:`, card.querySelector('h3')?.textContent);
        
        // Add click event for the entire card (excluding buttons)
        card.addEventListener('click', function(e) {
            console.log('Card clicked:', e.target);
            console.log('Click target:', e.target);
            console.log('Closest edit-btn:', e.target.closest('.edit-btn'));
            console.log('Closest external-link:', e.target.closest('.external-link'));
            console.log('Closest status-indicator:', e.target.closest('.status-indicator'));
            
            // Don't navigate if clicking on buttons or links
            if (e.target.closest('.edit-btn') || e.target.closest('.external-link') || e.target.closest('.status-indicator')) {
                console.log('Click blocked - button/link clicked');
                return;
            }
            
            // Navigate to project detail page
            const projectName = card.querySelector('h3').textContent;
            console.log('Navigating to project:', projectName);
            navigateToProjectDetail(projectName);
        });
        
        // Add hover effect to indicate clickable
        card.style.cursor = 'pointer';
    });
}

function navigateToProjectDetail(projectName) {
    console.log('Navigating to project detail:', projectName);
    
    // Navigate to the project detail page with project ID as parameter
    const projectId = getProjectIdFromName(projectName);
    window.location.href = `project-detail.html?id=${projectId}`;
}

function toggleCardExpansion(button) {
    const card = button.closest('.project-card');
    const isExpanded = card.classList.contains('expanded');
    
    if (isExpanded) {
        card.classList.remove('expanded');
        button.innerHTML = '<i class="fas fa-expand-alt"></i> Show More';
        button.classList.remove('expanded');
    } else {
        card.classList.add('expanded');
        button.innerHTML = '<i class="fas fa-compress-alt"></i> Show Less';
        button.classList.add('expanded');
    }
    
    // Smooth scroll to show the expanded content
    if (!isExpanded) {
        setTimeout(() => {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

// Global functions for HTML onclick handlers
window.toggleCardExpansion = toggleCardExpansion;
window.navigateToProjectDetail = navigateToProjectDetail;

function getProjectIdFromName(projectName) {
    // Use GitHub data manager only
    if (githubDataManager) {
        const projects = githubDataManager.getAllProjects();
        const project = projects.find(p => p.name === projectName);
        if (project) {
            return project.id;
        }
    }
    
    // No fallback - only GitHub repositories are supported
    console.warn(`Project "${projectName}" not found in GitHub data`);
    return null;
}

function setupMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', function() {
            sidebar.classList.toggle('mobile-open');
            
            // Toggle icon
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
        
        // Close sidebar when clicking on a nav link on mobile
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('mobile-open');
                    const icon = mobileToggle.querySelector('i');
                    icon.className = 'fas fa-bars';
                }
            });
        });
    }
}

// Project Detail Page Functionality
function setupProjectDetailPage() {
    // Check if we're on the project detail page
    if (window.location.pathname.includes('project-detail.html')) {
        setupProjectDetailActions();
        setupTaskManagement();
        setupFileManagement();
        setupTimelineAnimations();
    }
}

function setupProjectDetailActions() {
    // Edit Project Button
    const editBtn = document.querySelector('.edit-project-btn');
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            showNotification('Edit project functionality coming soon!', 'info');
        });
    }
    
    // Delete Project Button
    const deleteBtn = document.querySelector('.delete-project-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                showNotification('Project deleted successfully', 'success');
                // In the future, this would actually delete the project
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
        });
    }
    
    // Export Project Button
    const exportBtn = document.querySelector('.export-project-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            showNotification('Exporting project data...', 'info');
            // In the future, this would generate and download a report
        });
    }
    
    // Share Project Button
    const shareBtn = document.querySelector('.share-project-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            showNotification('Share functionality coming soon!', 'info');
        });
    }
}

function setupTaskManagement() {
    // Add Task Button
    const addTaskBtn = document.querySelector('.add-task-btn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', function() {
            showNotification('Add task functionality coming soon!', 'info');
        });
    }
    
    // Task Items
    const taskItems = document.querySelectorAll('.task-item');
    taskItems.forEach(task => {
        task.addEventListener('click', function() {
            const taskText = this.querySelector('span').textContent;
            const isCompleted = this.classList.contains('completed');
            
            if (isCompleted) {
                showNotification(`Task completed: ${taskText}`, 'success');
            } else if (this.classList.contains('in-progress')) {
                showNotification(`Task in progress: ${taskText}`, 'warning');
            } else {
                showNotification(`Task pending: ${taskText}`, 'info');
            }
        });
    });
}

function setupFileManagement() {
    // Upload Button
    const uploadBtn = document.querySelector('.upload-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            showNotification('File upload functionality coming soon!', 'info');
        });
    }
    
    // File Action Buttons
    const fileActionBtns = document.querySelectorAll('.file-action-btn');
    fileActionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const fileName = this.parentElement.querySelector('span').textContent;
            const action = this.querySelector('i').className.includes('download') ? 'downloading' : 'opening';
            showNotification(`${action} ${fileName}...`, 'info');
        });
    });
}

function setupTimelineAnimations() {
    // Animate timeline items on scroll
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateX(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    timelineItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        item.style.transition = `all 0.6s ease ${index * 0.2}s`;
        observer.observe(item);
    });
}

// Initialize project detail page functionality
document.addEventListener('DOMContentLoaded', function() {
    setupProjectDetailPage();
});

// Inject notification styles
document.head.insertAdjacentHTML('beforeend', notificationStyles);
