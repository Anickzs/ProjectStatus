// Notification Management Module
// Centralized notification handling for better user experience

import { domUtils } from '../utils/dom-utils.js';

export class NotificationManager {
    constructor() {
        this.notifications = new Set();
        this.defaultDuration = 5000; // 5 seconds
        this.maxNotifications = 5;
        this.notificationQueue = [];
        this.isProcessing = false;
    }

    // Show a notification
    show(message, type = 'info', duration = null) {
        const notification = this.createNotification(message, type);
        
        // Add to queue if too many notifications
        if (this.notifications.size >= this.maxNotifications) {
            this.notificationQueue.push({ message, type, duration });
            return;
        }
        
        this.displayNotification(notification, duration || this.defaultDuration);
    }

    // Create notification element
    createNotification(message, type) {
        const notification = domUtils.createElement('div', {
            className: `notification ${type}`,
            style: `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem;
                border-radius: 0.5rem;
                color: white;
                font-weight: 500;
                z-index: 10000;
                max-width: 400px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                transform: translateX(100%);
                transition: transform 0.3s ease;
                ${this.getNotificationStyles(type)}
            `
        });

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-${this.getNotificationIcon(type)}" style="font-size: 1.1rem;"></i>
                <span style="flex: 1;">${message}</span>
                <button class="notification-close" style="
                    background: none;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 0.25rem;
                    transition: background-color 0.2s;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        domUtils.addEventListener(closeBtn, 'click', () => {
            this.removeNotification(notification);
        });

        return notification;
    }

    // Get notification styles based on type
    getNotificationStyles(type) {
        const styles = {
            'success': `
                background: linear-gradient(135deg, #10b981, #059669);
                border-left: 4px solid #047857;
            `,
            'error': `
                background: linear-gradient(135deg, #ef4444, #dc2626);
                border-left: 4px solid #b91c1c;
            `,
            'warning': `
                background: linear-gradient(135deg, #f59e0b, #d97706);
                border-left: 4px solid #b45309;
            `,
            'info': `
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                border-left: 4px solid #1d4ed8;
            `
        };
        
        return styles[type] || styles.info;
    }

    // Get notification icon based on type
    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Display notification with animation
    displayNotification(notification, duration) {
        // Add to body
        document.body.appendChild(notification);
        this.notifications.add(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }

        // Process queue if needed
        this.processQueue();
    }

    // Remove notification with animation
    removeNotification(notification) {
        if (!this.notifications.has(notification)) return;

        // Animate out
        notification.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications.delete(notification);
            
            // Process queue after removal
            this.processQueue();
        }, 300);
    }

    // Process notification queue
    processQueue() {
        if (this.isProcessing || this.notificationQueue.length === 0) return;
        
        this.isProcessing = true;
        
        while (this.notifications.size < this.maxNotifications && this.notificationQueue.length > 0) {
            const { message, type, duration } = this.notificationQueue.shift();
            const notification = this.createNotification(message, type);
            this.displayNotification(notification, duration);
        }
        
        this.isProcessing = false;
    }

    // Show success notification
    success(message, duration = null) {
        this.show(message, 'success', duration);
    }

    // Show error notification
    error(message, duration = null) {
        this.show(message, 'error', duration);
    }

    // Show warning notification
    warning(message, duration = null) {
        this.show(message, 'warning', duration);
    }

    // Show info notification
    info(message, duration = null) {
        this.show(message, 'info', duration);
    }

    // Show loading notification (stays until manually removed)
    showLoading(message = 'Loading...') {
        const notification = this.createNotification(message, 'info');
        notification.dataset.loading = 'true';
        
        // Add loading spinner
        const icon = notification.querySelector('i');
        icon.className = 'fas fa-spinner fa-spin';
        
        this.displayNotification(notification, 0); // No auto-remove
        
        return notification;
    }

    // Update loading notification
    updateLoading(notification, message) {
        if (notification && notification.dataset.loading) {
            const textSpan = notification.querySelector('span');
            if (textSpan) {
                textSpan.textContent = message;
            }
        }
    }

    // Complete loading notification
    completeLoading(notification, message, type = 'success') {
        if (notification && notification.dataset.loading) {
            // Change to completion notification
            notification.className = `notification ${type}`;
            notification.style.cssText = notification.style.cssText.replace(
                /background:.*?;/g,
                this.getNotificationStyles(type)
            );
            
            // Update icon and text
            const icon = notification.querySelector('i');
            icon.className = `fas fa-${this.getNotificationIcon(type)}`;
            
            const textSpan = notification.querySelector('span');
            if (textSpan) {
                textSpan.textContent = message;
            }
            
            // Remove loading state
            delete notification.dataset.loading;
            
            // Auto-remove after completion
            setTimeout(() => {
                this.removeNotification(notification);
            }, 3000);
        }
    }

    // Show toast notification (shorter duration)
    toast(message, type = 'info') {
        this.show(message, type, 3000);
    }

    // Show persistent notification (stays until manually closed)
    showPersistent(message, type = 'info') {
        this.show(message, type, 0);
    }

    // Clear all notifications
    clearAll() {
        this.notifications.forEach(notification => {
            this.removeNotification(notification);
        });
        this.notificationQueue = [];
    }

    // Get notification count
    getNotificationCount() {
        return this.notifications.size;
    }

    // Get queue count
    getQueueCount() {
        return this.notificationQueue.length;
    }

    // Cleanup resources
    cleanup() {
        this.clearAll();
        this.notifications.clear();
        this.notificationQueue = [];
    }
}

// Export singleton instance
export const notificationManager = new NotificationManager();
