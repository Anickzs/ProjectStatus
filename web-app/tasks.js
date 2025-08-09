// Task Management Board JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Task Management Board loaded');
    
    // Initialize all functionality
    initializeTaskBoard();
    setupModals();
    setupFilters();
    setupDragAndDrop();
    loadInitialTasks();
    updateStatistics();
});

// Global variables
let tasks = [];
let currentTask = null;
let draggedTask = null;

// Initialize task board
function initializeTaskBoard() {
    console.log('Initializing task board...');
    
    // Add entrance animations
    animateBoardEntrance();
    
    // Setup add task placeholders
    setupAddTaskPlaceholders();
}

// Load initial tasks from project data
function loadInitialTasks() {
    // Load project data to generate initial tasks
    fetch('project_analysis.json')
        .then(response => response.json())
        .then(data => {
            generateInitialTasks(data);
            renderTasks();
            updateStatistics();
        })
        .catch(error => {
            console.error('Error loading project data:', error);
            // Create some sample tasks if loading fails
            createSampleTasks();
            renderTasks();
            updateStatistics();
        });
}

// Generate initial tasks from project data
function generateInitialTasks(projectData) {
    tasks = [];
    
    Object.keys(projectData).forEach(projectId => {
        const project = projectData[projectId];
        
        // Create tasks based on project progress
        if (project.completed_features && project.completed_features.length > 0) {
            // Add completed features as completed tasks
            project.completed_features.slice(0, 3).forEach((feature, index) => {
                tasks.push({
                    id: `task-${projectId}-completed-${index}`,
                    title: feature.length > 50 ? feature.substring(0, 50) + '...' : feature,
                    description: feature,
                    project: projectId,
                    projectName: project.name,
                    status: 'completed',
                    priority: 'medium',
                    assignee: 'Team',
                    dueDate: null,
                    estimate: 2,
                    createdAt: new Date().toISOString(),
                    completedAt: new Date().toISOString()
                });
            });
        }
        
        // Add in-progress task if project is not completed
        if (project.progress > 0 && project.progress < 100) {
            tasks.push({
                id: `task-${projectId}-in-progress`,
                title: `Continue development - ${project.name}`,
                description: `Continue working on ${project.name} project. Current progress: ${project.progress}%`,
                project: projectId,
                projectName: project.name,
                status: 'in-progress',
                priority: 'high',
                assignee: 'Team',
                dueDate: getFutureDate(7),
                estimate: 8,
                createdAt: new Date().toISOString()
            });
        }
        
        // Add pending tasks for incomplete projects
        if (project.progress < 100) {
            const pendingTasks = [
                {
                    title: `Complete remaining features - ${project.name}`,
                    description: `Finish all remaining features for ${project.name}`,
                    estimate: 16
                },
                {
                    title: `Testing and validation - ${project.name}`,
                    description: `Perform comprehensive testing and validation`,
                    estimate: 8
                },
                {
                    title: `Deployment preparation - ${project.name}`,
                    description: `Prepare for deployment and documentation`,
                    estimate: 4
                }
            ];
            
            pendingTasks.forEach((taskData, index) => {
                tasks.push({
                    id: `task-${projectId}-pending-${index}`,
                    title: taskData.title,
                    description: taskData.description,
                    project: projectId,
                    projectName: project.name,
                    status: 'pending',
                    priority: index === 0 ? 'high' : 'medium',
                    assignee: 'Team',
                    dueDate: getFutureDate(14 + index * 7),
                    estimate: taskData.estimate,
                    createdAt: new Date().toISOString()
                });
            });
        }
    });
}

// Create sample tasks if loading fails
function createSampleTasks() {
    tasks = [
        {
            id: 'sample-1',
            title: 'Setup development environment',
            description: 'Configure development tools and dependencies',
            project: 'DIYAPP',
            projectName: 'At Home DIY',
            status: 'completed',
            priority: 'high',
            assignee: 'Developer',
            dueDate: null,
            estimate: 4,
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
        },
        {
            id: 'sample-2',
            title: 'Design user interface',
            description: 'Create wireframes and UI mockups',
            project: 'DIYAPP',
            projectName: 'At Home DIY',
            status: 'in-progress',
            priority: 'medium',
            assignee: 'Designer',
            dueDate: getFutureDate(7),
            estimate: 12,
            createdAt: new Date().toISOString()
        },
        {
            id: 'sample-3',
            title: 'Implement core features',
            description: 'Develop main application functionality',
            project: 'DIYAPP',
            projectName: 'At Home DIY',
            status: 'pending',
            priority: 'high',
            assignee: 'Developer',
            dueDate: getFutureDate(14),
            estimate: 20,
            createdAt: new Date().toISOString()
        }
    ];
}

// Get future date helper
function getFutureDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

// Render all tasks on the board
function renderTasks() {
    // Clear all columns
    const columns = ['pending', 'in-progress', 'review', 'completed'];
    columns.forEach(status => {
        const column = document.getElementById(`${status}-column`);
        if (column) {
            // Keep the add task placeholder
            const placeholder = column.querySelector('.add-task-placeholder');
            column.innerHTML = '';
            if (placeholder) {
                column.appendChild(placeholder);
            }
        }
    });
    
    // Render tasks in appropriate columns
    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        const column = document.getElementById(`${task.status}-column`);
        if (column) {
            // Insert before the placeholder
            const placeholder = column.querySelector('.add-task-placeholder');
            if (placeholder) {
                column.insertBefore(taskElement, placeholder);
            } else {
                column.appendChild(taskElement);
            }
        }
    });
    
    // Update task counts
    updateTaskCounts();
}

// Create task element
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-card';
    taskDiv.draggable = true;
    taskDiv.dataset.taskId = task.id;
    taskDiv.dataset.status = task.status;
    
    const priorityClass = `priority-${task.priority}`;
    const projectClass = `project-${task.project}`;
    
    taskDiv.innerHTML = `
        <div class="task-header">
            <div class="task-priority ${priorityClass}">
                <i class="fas fa-flag"></i>
            </div>
            <div class="task-actions">
                <button class="task-action-btn" title="View Details" onclick="viewTaskDetails('${task.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="task-action-btn" title="Edit Task" onclick="editTask('${task.id}')">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </div>
        
        <div class="task-content">
            <h4 class="task-title">${task.title}</h4>
            <p class="task-description">${task.description}</p>
            
            <div class="task-meta">
                <div class="task-project ${projectClass}">
                    <i class="fas fa-project-diagram"></i>
                    <span>${task.projectName}</span>
                </div>
                
                ${task.assignee ? `
                <div class="task-assignee">
                    <i class="fas fa-user"></i>
                    <span>${task.assignee}</span>
                </div>
                ` : ''}
                
                ${task.dueDate ? `
                <div class="task-due-date ${isOverdue(task.dueDate) ? 'overdue' : ''}">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(task.dueDate)}</span>
                </div>
                ` : ''}
                
                ${task.estimate ? `
                <div class="task-estimate">
                    <i class="fas fa-clock"></i>
                    <span>${task.estimate}h</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Add drag event listeners
    taskDiv.addEventListener('dragstart', handleDragStart);
    taskDiv.addEventListener('dragend', handleDragEnd);
    
    return taskDiv;
}

// Check if task is overdue
function isOverdue(dueDate) {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays < 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString();
}

// Update task counts
function updateTaskCounts() {
    const counts = {
        pending: tasks.filter(t => t.status === 'pending').length,
        'in-progress': tasks.filter(t => t.status === 'in-progress').length,
        review: tasks.filter(t => t.status === 'review').length,
        completed: tasks.filter(t => t.status === 'completed').length
    };
    
    Object.keys(counts).forEach(status => {
        const countElement = document.getElementById(`${status}-count`);
        if (countElement) {
            countElement.textContent = counts[status];
        }
    });
}

// Update statistics
function updateStatistics() {
    const totalTasks = tasks.length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    document.getElementById('total-tasks').textContent = totalTasks;
    document.getElementById('stat-in-progress').textContent = inProgressTasks;
    document.getElementById('stat-completed').textContent = completedTasks;
    document.getElementById('completion-rate').textContent = `${completionRate}%`;
}

// Setup modals
function setupModals() {
    // Task modal
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskModal = document.getElementById('task-modal');
    const modalClose = document.getElementById('modal-close');
    const modalCancel = document.getElementById('modal-cancel');
    const modalSave = document.getElementById('modal-save');
    const modalDelete = document.getElementById('modal-delete');
    
    if (addTaskBtn && taskModal) {
        addTaskBtn.addEventListener('click', () => openTaskModal());
        modalClose.addEventListener('click', () => closeModal(taskModal));
        modalCancel.addEventListener('click', () => closeModal(taskModal));
        modalSave.addEventListener('click', () => saveTask());
        modalDelete.addEventListener('click', () => deleteTask());
    }
    
    // Task detail modal
    const detailModal = document.getElementById('task-detail-modal');
    const detailModalClose = document.getElementById('detail-modal-close');
    const detailModalCloseBtn = document.getElementById('detail-modal-close-btn');
    const detailModalEdit = document.getElementById('detail-modal-edit');
    
    if (detailModal) {
        detailModalClose.addEventListener('click', () => closeModal(detailModal));
        detailModalCloseBtn.addEventListener('click', () => closeModal(detailModal));
        detailModalEdit.addEventListener('click', () => editCurrentTask());
    }
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('active');
        }
    });
}

// Setup filters
function setupFilters() {
    const projectFilter = document.getElementById('project-filter');
    const statusFilter = document.getElementById('status-filter');
    const priorityFilter = document.getElementById('priority-filter');
    
    if (projectFilter) {
        projectFilter.addEventListener('change', applyFilters);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    if (priorityFilter) {
        priorityFilter.addEventListener('change', applyFilters);
    }
}

// Apply filters
function applyFilters() {
    const projectFilter = document.getElementById('project-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const priorityFilter = document.getElementById('priority-filter').value;
    
    const filteredTasks = tasks.filter(task => {
        const projectMatch = projectFilter === 'all' || task.project === projectFilter;
        const statusMatch = statusFilter === 'all' || task.status === statusFilter;
        const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
        
        return projectMatch && statusMatch && priorityMatch;
    });
    
    renderFilteredTasks(filteredTasks);
}

// Render filtered tasks
function renderFilteredTasks(filteredTasks) {
    // Hide all tasks first
    document.querySelectorAll('.task-card').forEach(card => {
        card.style.display = 'none';
    });
    
    // Show filtered tasks
    filteredTasks.forEach(task => {
        const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
        if (taskElement) {
            taskElement.style.display = 'block';
        }
    });
    
    // Update counts for filtered view
    updateFilteredCounts(filteredTasks);
}

// Update filtered counts
function updateFilteredCounts(filteredTasks) {
    const counts = {
        pending: filteredTasks.filter(t => t.status === 'pending').length,
        'in-progress': filteredTasks.filter(t => t.status === 'in-progress').length,
        review: filteredTasks.filter(t => t.status === 'review').length,
        completed: filteredTasks.filter(t => t.status === 'completed').length
    };
    
    Object.keys(counts).forEach(status => {
        const countElement = document.getElementById(`${status}-count`);
        if (countElement) {
            countElement.textContent = counts[status];
        }
    });
}

// Setup drag and drop
function setupDragAndDrop() {
    const columns = document.querySelectorAll('.kanban-column');
    
    columns.forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', handleDrop);
    });
}

// Handle drag start
function handleDragStart(e) {
    draggedTask = e.target;
    e.target.style.opacity = '0.5';
}

// Handle drag end
function handleDragEnd(e) {
    e.target.style.opacity = '1';
    draggedTask = null;
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
}

// Handle drop
function handleDrop(e) {
    e.preventDefault();
    
    if (!draggedTask) return;
    
    const column = e.currentTarget;
    const newStatus = column.dataset.status;
    const taskId = draggedTask.dataset.taskId;
    
    // Update task status
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
        task.status = newStatus;
        if (newStatus === 'completed') {
            task.completedAt = new Date().toISOString();
        }
        
        // Move task to new column
        const newColumn = document.getElementById(`${newStatus}-column`);
        if (newColumn) {
            const placeholder = newColumn.querySelector('.add-task-placeholder');
            if (placeholder) {
                newColumn.insertBefore(draggedTask, placeholder);
            } else {
                newColumn.appendChild(draggedTask);
            }
        }
        
        // Update task data attribute
        draggedTask.dataset.status = newStatus;
        
        // Update statistics
        updateTaskCounts();
        updateStatistics();
        
        // Save to local storage
        saveTasksToStorage();
        
        // Show notification
        showNotification(`Task moved to ${newStatus}`, 'success');
    }
}

// Setup add task placeholders
function setupAddTaskPlaceholders() {
    const placeholders = document.querySelectorAll('.add-task-placeholder');
    
    placeholders.forEach(placeholder => {
        placeholder.addEventListener('click', () => {
            const status = placeholder.dataset.status;
            openTaskModal(status);
        });
    });
}

// Open task modal
function openTaskModal(status = null, taskId = null) {
    const modal = document.getElementById('task-modal');
    const form = document.getElementById('task-form');
    const modalTitle = document.getElementById('modal-title');
    const modalSave = document.getElementById('modal-save');
    const modalDelete = document.getElementById('modal-delete');
    
    if (taskId) {
        // Edit mode
        currentTask = tasks.find(t => t.id === taskId);
        if (currentTask) {
            modalTitle.textContent = 'Edit Task';
            modalSave.textContent = 'Update Task';
            modalDelete.style.display = 'inline-block';
            populateTaskForm(currentTask);
        }
    } else {
        // Add mode
        currentTask = null;
        modalTitle.textContent = 'Add New Task';
        modalSave.textContent = 'Add Task';
        modalDelete.style.display = 'none';
        form.reset();
        
        if (status) {
            document.getElementById('task-status').value = status;
        }
    }
    
    modal.classList.add('active');
}

// Populate task form
function populateTaskForm(task) {
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description;
    document.getElementById('task-project').value = task.project;
    document.getElementById('task-status').value = task.status;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-assignee').value = task.assignee || '';
    document.getElementById('task-due-date').value = task.dueDate || '';
    document.getElementById('task-estimate').value = task.estimate || '';
}

// Save task
function saveTask() {
    const form = document.getElementById('task-form');
    const formData = new FormData(form);
    
    const taskData = {
        title: formData.get('title'),
        description: formData.get('description'),
        project: formData.get('project'),
        status: formData.get('status'),
        priority: formData.get('priority'),
        assignee: formData.get('assignee'),
        dueDate: formData.get('dueDate'),
        estimate: parseFloat(formData.get('estimate')) || 0
    };
    
    if (currentTask) {
        // Update existing task
        Object.assign(currentTask, taskData);
        showNotification('Task updated successfully!', 'success');
    } else {
        // Create new task
        const newTask = {
            ...taskData,
            id: `task-${Date.now()}`,
            projectName: getProjectName(taskData.project),
            createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        showNotification('Task added successfully!', 'success');
    }
    
    // Update UI
    renderTasks();
    updateStatistics();
    
    // Save to local storage
    saveTasksToStorage();
    
    // Close modal
    closeModal(document.getElementById('task-modal'));
}

// Get project name from ID
function getProjectName(projectId) {
    const projectNames = {
        'DIYAPP': 'At Home DIY',
        'FAMILYINFRA': 'Family Business Infra Server',
        'AIEMAIL': 'AI Email Assistant',
        'TRADINGBOTS': 'Trading Bots'
    };
    return projectNames[projectId] || projectId;
}

// Delete task
function deleteTask() {
    if (!currentTask) return;
    
    if (confirm('Are you sure you want to delete this task?')) {
        const index = tasks.findIndex(t => t.id === currentTask.id);
        if (index > -1) {
            tasks.splice(index, 1);
            
            // Remove from DOM
            const taskElement = document.querySelector(`[data-task-id="${currentTask.id}"]`);
            if (taskElement) {
                taskElement.remove();
            }
            
            // Update UI
            updateTaskCounts();
            updateStatistics();
            
            // Save to local storage
            saveTasksToStorage();
            
            // Close modal
            closeModal(document.getElementById('task-modal'));
            
            showNotification('Task deleted successfully!', 'success');
        }
    }
}

// View task details
function viewTaskDetails(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const modal = document.getElementById('task-detail-modal');
    const modalTitle = document.getElementById('detail-modal-title');
    const modalContent = document.getElementById('task-detail-content');
    
    modalTitle.textContent = task.title;
    
    modalContent.innerHTML = `
        <div class="task-detail-info">
            <div class="detail-row">
                <label>Description:</label>
                <p>${task.description}</p>
            </div>
            
            <div class="detail-row">
                <label>Project:</label>
                <span class="project-badge project-${task.project}">${task.projectName}</span>
            </div>
            
            <div class="detail-row">
                <label>Status:</label>
                <span class="status-badge status-${task.status}">${task.status}</span>
            </div>
            
            <div class="detail-row">
                <label>Priority:</label>
                <span class="priority-badge priority-${task.priority}">${task.priority}</span>
            </div>
            
            ${task.assignee ? `
            <div class="detail-row">
                <label>Assignee:</label>
                <span>${task.assignee}</span>
            </div>
            ` : ''}
            
            ${task.dueDate ? `
            <div class="detail-row">
                <label>Due Date:</label>
                <span class="${isOverdue(task.dueDate) ? 'overdue' : ''}">${formatDate(task.dueDate)}</span>
            </div>
            ` : ''}
            
            ${task.estimate ? `
            <div class="detail-row">
                <label>Time Estimate:</label>
                <span>${task.estimate} hours</span>
            </div>
            ` : ''}
            
            <div class="detail-row">
                <label>Created:</label>
                <span>${formatDate(task.createdAt)}</span>
            </div>
            
            ${task.completedAt ? `
            <div class="detail-row">
                <label>Completed:</label>
                <span>${formatDate(task.completedAt)}</span>
            </div>
            ` : ''}
        </div>
    `;
    
    // Store current task for edit
    currentTask = task;
    
    modal.classList.add('active');
}

// Edit current task
function editCurrentTask() {
    closeModal(document.getElementById('task-detail-modal'));
    openTaskModal(null, currentTask.id);
}

// Edit task
function editTask(taskId) {
    openTaskModal(null, taskId);
}

// Close modal
function closeModal(modal) {
    modal.classList.remove('active');
}

// Save tasks to local storage
function saveTasksToStorage() {
    try {
        localStorage.setItem('projectStatus_tasks', JSON.stringify(tasks));
    } catch (error) {
        console.error('Error saving tasks to storage:', error);
    }
}

// Load tasks from local storage
function loadTasksFromStorage() {
    try {
        const stored = localStorage.getItem('projectStatus_tasks');
        if (stored) {
            const storedTasks = JSON.parse(stored);
            if (Array.isArray(storedTasks)) {
                tasks = storedTasks;
                return true;
            }
        }
    } catch (error) {
        console.error('Error loading tasks from storage:', error);
    }
    return false;
}

// Animate board entrance
function animateBoardEntrance() {
    const columns = document.querySelectorAll('.kanban-column');
    
    columns.forEach((column, index) => {
        column.style.opacity = '0';
        column.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            column.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            column.style.opacity = '1';
            column.style.transform = 'translateY(0)';
        }, index * 150);
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Get notification icon
function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

// Add notification styles if not already present
function addNotificationStyles() {
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                padding: 16px 20px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 1001;
                transform: translateX(400px);
                transition: transform 0.3s ease;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification-success {
                border-left: 4px solid #10b981;
            }
            
            .notification-error {
                border-left: 4px solid #ef4444;
            }
            
            .notification-warning {
                border-left: 4px solid #f59e0b;
            }
            
            .notification-info {
                border-left: 4px solid #3b82f6;
            }
            
            .notification i {
                font-size: 18px;
            }
            
            .notification-success i {
                color: #10b981;
            }
            
            .notification-error i {
                color: #ef4444;
            }
            
            .notification-warning i {
                color: #f59e0b;
            }
            
            .notification-info i {
                color: #3b82f6;
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Initialize notification styles
addNotificationStyles();
