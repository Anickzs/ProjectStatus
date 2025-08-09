// DOM Utility Functions
// Centralized DOM operations for better performance and maintainability

export class DOMUtils {
    constructor() {
        // Cache frequently accessed DOM elements
        this.cachedElements = new Map();
        this.elementCache = new WeakMap();
    }

    // Get element by ID with caching
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

    // Get element by selector with caching
    querySelector(selector) {
        if (!this.cachedElements.has(selector)) {
            const element = document.querySelector(selector);
            if (element) {
                this.cachedElements.set(selector, element);
            }
            return element;
        }
        return this.cachedElements.get(selector);
    }

    // Get all elements by selector
    querySelectorAll(selector) {
        return document.querySelectorAll(selector);
    }

    // Safe element update with error handling
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

    // Batch DOM updates for better performance
    batchUpdate(updates) {
        // Use requestAnimationFrame for smooth updates
        requestAnimationFrame(() => {
            updates.forEach(({ elementId, property, value }) => {
                this.safeUpdateElement(elementId, property, value);
            });
        });
    }

    // Create element with attributes
    createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        
        if (content) {
            element.textContent = content;
        }
        
        return element;
    }

    // Remove element safely
    removeElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    // Add event listener with cleanup tracking
    addEventListener(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);
        
        // Track for cleanup
        if (!this.elementCache.has(element)) {
            this.elementCache.set(element, new Map());
        }
        
        const elementListeners = this.elementCache.get(element);
        if (!elementListeners.has(event)) {
            elementListeners.set(event, []);
        }
        
        elementListeners.get(event).push(handler);
    }

    // Remove event listener
    removeEventListener(element, event, handler) {
        element.removeEventListener(event, handler);
        
        // Update tracking
        if (this.elementCache.has(element)) {
            const elementListeners = this.elementCache.get(element);
            if (elementListeners.has(event)) {
                const handlers = elementListeners.get(event);
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        }
    }

    // Clean up all event listeners for an element
    cleanupElement(element) {
        if (this.elementCache.has(element)) {
            const elementListeners = this.elementCache.get(element);
            elementListeners.forEach((handlers, event) => {
                handlers.forEach(handler => {
                    element.removeEventListener(event, handler);
                });
            });
            this.elementCache.delete(element);
        }
    }

    // Show/hide element with animation
    showElement(element, animation = 'fadeIn') {
        element.style.display = '';
        element.classList.add(animation);
    }

    hideElement(element, animation = 'fadeOut') {
        element.classList.add(animation);
        setTimeout(() => {
            element.style.display = 'none';
            element.classList.remove(animation);
        }, 300);
    }

    // Toggle element visibility
    toggleElement(element) {
        if (element.style.display === 'none' || element.style.display === '') {
            this.showElement(element);
        } else {
            this.hideElement(element);
        }
    }

    // Clear element cache
    clearCache() {
        this.cachedElements.clear();
    }

    // Get computed styles
    getComputedStyle(element, property) {
        return window.getComputedStyle(element).getPropertyValue(property);
    }

    // Check if element is visible
    isVisible(element) {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }

    // Scroll element into view
    scrollIntoView(element, options = {}) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            ...options
        });
    }
}

// Export singleton instance
export const domUtils = new DOMUtils();
