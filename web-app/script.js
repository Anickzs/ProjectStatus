// Enhanced JavaScript for Project In Progress Dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Project In Progress Dashboard loaded');
    
    // Initialize all interactive features
    setupProjectCards();
    setupProgressAnimations();
    setupHoverEffects();
    setupStatusIndicators();
    setupNavigation();
    setupMobileMenu();
    
    // Add entrance animations
    animateEntrance();
});

function setupProjectCards() {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach((card, index) => {
        // Add staggered entrance animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 150);
        
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
    });
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

function getProjectIdFromName(projectName) {
    // Map project names to their IDs in the JSON
    const projectMap = {
        'At Home DIY': 'DIYAPP',
        'Family Business Infra Server': 'BusinessLoclAi',
        'AI Email Assistant': 'AiAutoAgency',
        'Trading Bots': 'CryptoTradingBot'
    };
    
    return projectMap[projectName] || 'DIYAPP'; // Default to DIYAPP if not found
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
