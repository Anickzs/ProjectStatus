// Modal Management Module
// Centralized modal handling for better performance and maintainability

import { domUtils } from '../utils/dom-utils.js';

export class ModalManager {
    constructor() {
        this.activeModals = new Set();
        this.modalConfigs = new Map();
        this.initializeModals();
    }

    // Initialize all modal configurations
    initializeModals() {
        this.modalConfigs.set('edit-project', {
            id: 'edit-project-modal',
            openBtn: '.edit-project-btn',
            closeBtn: '#close-edit-modal',
            cancelBtn: '#cancel-edit',
            form: '#edit-project-form'
        });

        this.modalConfigs.set('add-task', {
            id: 'add-task-modal',
            openBtn: '.add-task-btn',
            closeBtn: '#close-add-task-modal',
            cancelBtn: '#cancel-add-task',
            form: '#add-task-form'
        });

        this.modalConfigs.set('file-upload', {
            id: 'file-upload-modal',
            openBtn: '.upload-btn',
            closeBtn: '#close-file-upload-modal',
            cancelBtn: '#cancel-file-upload',
            form: '#file-upload-form'
        });
    }

    // Setup event listeners for all modals
    setupEventListeners() {
        this.modalConfigs.forEach((config, modalName) => {
            this.setupModalEventListeners(modalName, config);
        });

        // Global modal close handlers
        this.setupGlobalModalHandlers();
    }

    // Setup event listeners for a specific modal
    setupModalEventListeners(modalName, config) {
        // Open button
        const openBtn = domUtils.querySelector(config.openBtn);
        if (openBtn) {
            domUtils.addEventListener(openBtn, 'click', (e) => {
                e.preventDefault();
                this.openModal(modalName);
            });
        }

        // Close button
        const closeBtn = domUtils.querySelector(config.closeBtn);
        if (closeBtn) {
            domUtils.addEventListener(closeBtn, 'click', (e) => {
                e.preventDefault();
                this.closeModal(modalName);
            });
        }

        // Cancel button
        const cancelBtn = domUtils.querySelector(config.cancelBtn);
        if (cancelBtn) {
            domUtils.addEventListener(cancelBtn, 'click', (e) => {
                e.preventDefault();
                this.closeModal(modalName);
            });
        }

        // Form submission
        const form = domUtils.querySelector(config.form);
        if (form) {
            domUtils.addEventListener(form, 'submit', (e) => {
                e.preventDefault();
                this.handleFormSubmission(modalName, form);
            });
        }
    }

    // Setup global modal handlers
    setupGlobalModalHandlers() {
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeAllModals();
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    // Open a specific modal
    openModal(modalName) {
        const config = this.modalConfigs.get(modalName);
        if (!config) {
            console.warn(`Modal configuration not found for: ${modalName}`);
            return;
        }

        const modal = domUtils.querySelector(`#${config.id}`);
        if (!modal) {
            console.warn(`Modal element not found: ${config.id}`);
            return;
        }

        // Close any other open modals
        this.closeAllModals();

        // Open the modal
        modal.classList.add('active');
        this.activeModals.add(modalName);

        // Focus first input if available
        const firstInput = modal.querySelector('input, textarea, select');
        if (firstInput) {
            firstInput.focus();
        }

        // Trigger custom event
        this.triggerModalEvent(modalName, 'opened');
    }

    // Close a specific modal
    closeModal(modalName) {
        const config = this.modalConfigs.get(modalName);
        if (!config) return;

        const modal = domUtils.querySelector(`#${config.id}`);
        if (modal) {
            modal.classList.remove('active');
            this.activeModals.delete(modalName);

            // Reset form if exists
            const form = domUtils.querySelector(config.form);
            if (form) {
                form.reset();
            }

            // Trigger custom event
            this.triggerModalEvent(modalName, 'closed');
        }
    }

    // Close all open modals
    closeAllModals() {
        this.activeModals.forEach(modalName => {
            this.closeModal(modalName);
        });
    }

    // Handle form submission
    handleFormSubmission(modalName, form) {
        // Trigger custom event for form submission
        const event = new CustomEvent('modalFormSubmit', {
            detail: {
                modalName,
                formData: new FormData(form),
                form
            }
        });
        document.dispatchEvent(event);
    }

    // Trigger custom modal events
    triggerModalEvent(modalName, action) {
        const event = new CustomEvent('modalAction', {
            detail: { modalName, action }
        });
        document.dispatchEvent(event);
    }

    // Check if a modal is open
    isModalOpen(modalName) {
        return this.activeModals.has(modalName);
    }

    // Get currently open modals
    getOpenModals() {
        return Array.from(this.activeModals);
    }

    // Populate modal with data
    populateModal(modalName, data) {
        const config = this.modalConfigs.get(modalName);
        if (!config) return;

        const modal = domUtils.querySelector(`#${config.id}`);
        if (!modal) return;

        // Find and populate form fields
        Object.entries(data).forEach(([key, value]) => {
            const field = modal.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = Boolean(value);
                } else if (field.type === 'radio') {
                    const radio = modal.querySelector(`[name="${key}"][value="${value}"]`);
                    if (radio) radio.checked = true;
                } else {
                    field.value = value;
                }
            }
        });
    }

    // Show loading state in modal
    showModalLoading(modalName, show = true) {
        const config = this.modalConfigs.get(modalName);
        if (!config) return;

        const modal = domUtils.querySelector(`#${config.id}`);
        if (!modal) return;

        const submitBtn = modal.querySelector('button[type="submit"]');
        if (submitBtn) {
            if (show) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = submitBtn.dataset.originalText || 'Submit';
            }
        }
    }

    // Show error in modal
    showModalError(modalName, message) {
        const config = this.modalConfigs.get(modalName);
        if (!config) return;

        const modal = domUtils.querySelector(`#${config.id}`);
        if (!modal) return;

        // Remove existing error messages
        const existingErrors = modal.querySelectorAll('.modal-error');
        existingErrors.forEach(error => error.remove());

        // Create error message
        const errorDiv = domUtils.createElement('div', {
            className: 'modal-error',
            style: 'color: #dc2626; margin-top: 0.5rem; font-size: 0.875rem;'
        }, message);

        // Insert after form
        const form = modal.querySelector('form');
        if (form) {
            form.parentNode.insertBefore(errorDiv, form.nextSibling);
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // Cleanup modal resources
    cleanup() {
        this.closeAllModals();
        this.activeModals.clear();
    }
}

// Export singleton instance
export const modalManager = new ModalManager();
