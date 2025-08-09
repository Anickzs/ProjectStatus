/**
 * Event Management Module
 * Centralized event handling with delegation for better performance
 */

export class EventManager {
    constructor() {
        this.eventHandlers = new Map();
        this.delegatedEvents = new Map();
        this.setupGlobalEventListeners();
    }
    
    /**
     * Add event listener with optional delegation
     * @param {string} selector - CSS selector or element ID
     * @param {string} eventType - Event type
     * @param {Function} handler - Event handler function
     * @param {Object} options - Event options
     */
    addEventListener(selector, eventType, handler, options = {}) {
        const { useDelegation = false, targetSelector = null } = options;
        
        if (useDelegation) {
            this.addDelegatedEvent(selector, eventType, targetSelector, handler);
        } else {
            this.addDirectEvent(selector, eventType, handler);
        }
    }
    
    /**
     * Add direct event listener
     * @param {string} selector - CSS selector or element ID
     * @param {string} eventType - Event type
     * @param {Function} handler - Event handler function
     */
    addDirectEvent(selector, eventType, handler) {
        const element = selector.startsWith('#') 
            ? document.getElementById(selector.slice(1))
            : document.querySelector(selector);
            
        if (!element) {
            console.warn(`Element not found for selector: ${selector}`);
            return;
        }
        
        const key = `${selector}-${eventType}`;
        this.eventHandlers.set(key, handler);
        
        element.addEventListener(eventType, handler);
    }
    
    /**
     * Add delegated event listener
     * @param {string} containerSelector - Container selector for delegation
     * @param {string} eventType - Event type
     * @param {string} targetSelector - Target element selector
     * @param {Function} handler - Event handler function
     */
    addDelegatedEvent(containerSelector, eventType, targetSelector, handler) {
        const container = containerSelector.startsWith('#')
            ? document.getElementById(containerSelector.slice(1))
            : document.querySelector(containerSelector);
            
        if (!container) {
            console.warn(`Container not found for selector: ${containerSelector}`);
            return;
        }
        
        const key = `${containerSelector}-${eventType}-${targetSelector}`;
        this.delegatedEvents.set(key, { container, targetSelector, handler });
        
        container.addEventListener(eventType, (e) => {
            const target = e.target.closest(targetSelector);
            if (target && container.contains(target)) {
                handler.call(target, e, target);
            }
        });
    }
    
    /**
     * Remove event listener
     * @param {string} selector - CSS selector or element ID
     * @param {string} eventType - Event type
     */
    removeEventListener(selector, eventType) {
        const key = `${selector}-${eventType}`;
        const handler = this.eventHandlers.get(key);
        
        if (handler) {
            const element = selector.startsWith('#')
                ? document.getElementById(selector.slice(1))
                : document.querySelector(selector);
                
            if (element) {
                element.removeEventListener(eventType, handler);
            }
            
            this.eventHandlers.delete(key);
        }
    }
    
    /**
     * Remove delegated event listener
     * @param {string} containerSelector - Container selector
     * @param {string} eventType - Event type
     * @param {string} targetSelector - Target selector
     */
    removeDelegatedEvent(containerSelector, eventType, targetSelector) {
        const key = `${containerSelector}-${eventType}-${targetSelector}`;
        this.delegatedEvents.delete(key);
    }
    
    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Global click handler for common interactions
        document.addEventListener('click', (e) => {
            this.handleGlobalClick(e);
        });
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeydown(e);
        });
    }
    
    /**
     * Handle global click events
     * @param {Event} e - Click event
     */
    handleGlobalClick(e) {
        // Handle button clicks with data attributes
        if (e.target.matches('[data-action]')) {
            const action = e.target.dataset.action;
            const target = e.target.dataset.target;
            
            if (action && target) {
                this.dispatchCustomEvent('action:clicked', { action, target, element: e.target });
            }
        }
        
        // Handle form submissions
        if (e.target.matches('form')) {
            e.preventDefault();
            this.dispatchCustomEvent('form:submitted', { form: e.target });
        }
    }
    
    /**
     * Handle global keyboard events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleGlobalKeydown(e) {
        // Ctrl/Cmd + E to edit project
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            this.dispatchCustomEvent('shortcut:edit-project');
        }
        
        // Ctrl/Cmd + T to add task
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            this.dispatchCustomEvent('shortcut:add-task');
        }
        
        // Ctrl/Cmd + U to upload files
        if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
            e.preventDefault();
            this.dispatchCustomEvent('shortcut:upload-files');
        }
        
        // Ctrl/Cmd + R to refresh
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            this.dispatchCustomEvent('shortcut:refresh');
        }
    }
    
    /**
     * Dispatch custom event
     * @param {string} eventName - Event name
     * @param {Object} detail - Event detail
     */
    dispatchCustomEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }
    
    /**
     * Clean up all event listeners
     */
    cleanup() {
        // Remove direct event listeners
        this.eventHandlers.forEach((handler, key) => {
            const [selector, eventType] = key.split('-', 2);
            this.removeEventListener(selector, eventType);
        });
        
        // Clear delegated events
        this.delegatedEvents.clear();
    }
}
