// Data Utility Functions
// Centralized data handling and localStorage operations

export class DataUtils {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Generic localStorage operations with error handling
    getItem(key, defaultValue = null) {
        try {
            // Check cache first
            if (this.cache.has(key)) {
                const cached = this.cache.get(key);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
                this.cache.delete(key);
            }

            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;
            
            const parsed = JSON.parse(item);
            
            // Cache the result
            this.cache.set(key, {
                data: parsed,
                timestamp: Date.now()
            });
            
            return parsed;
        } catch (error) {
            console.warn(`Error reading from localStorage for key '${key}':`, error);
            return defaultValue;
        }
    }

    setItem(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            
            // Update cache
            this.cache.set(key, {
                data: value,
                timestamp: Date.now()
            });
            
            return true;
        } catch (error) {
            console.error(`Error writing to localStorage for key '${key}':`, error);
            return false;
        }
    }

    removeItem(key) {
        try {
            localStorage.removeItem(key);
            this.cache.delete(key);
            return true;
        } catch (error) {
            console.error(`Error removing from localStorage for key '${key}':`, error);
            return false;
        }
    }

    // Batch localStorage operations
    batchSet(items) {
        const results = [];
        items.forEach(({ key, value }) => {
            results.push({
                key,
                success: this.setItem(key, value)
            });
        });
        return results;
    }

    // Get multiple items efficiently
    batchGet(keys) {
        const results = {};
        keys.forEach(key => {
            results[key] = this.getItem(key);
        });
        return results;
    }

    // Clear all project-related data
    clearProjectData(projectId) {
        const keys = [
            `tasks_${projectId}`,
            `files_${projectId}`,
            `timeline_${projectId}`,
            `activities_${projectId}`
        ];
        
        keys.forEach(key => this.removeItem(key));
    }

    // Data validation and sanitization
    validateProjectData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        const requiredFields = ['name', 'status'];
        return requiredFields.every(field => data.hasOwnProperty(field));
    }

    sanitizeProjectData(data) {
        if (!this.validateProjectData(data)) {
            return null;
        }
        
        return {
            id: data.id || this.generateId(),
            name: String(data.name || '').trim(),
            description: String(data.description || '').trim(),
            status: data.status || 'planning',
            progress: Math.min(Math.max(parseInt(data.progress) || 0, 0), 100),
            phase: data.phase || 'Phase 1: Planning',
            lastUpdated: data.lastUpdated || new Date().toISOString(),
            completed_features: Array.isArray(data.completed_features) ? data.completed_features : []
        };
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Format date consistently
    formatDate(dateString, options = {}) {
        if (!dateString) return 'Unknown';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            
            const defaultOptions = {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            };
            
            return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
        } catch (error) {
            return dateString;
        }
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Get file type from filename
    getFileType(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const typeMap = {
            'pdf': 'pdf',
            'doc': 'doc',
            'docx': 'doc',
            'xls': 'xls',
            'xlsx': 'xls',
            'sketch': 'sketch',
            'psd': 'psd',
            'zip': 'zip',
            'rar': 'zip',
            'md': 'md',
            'sh': 'sh',
            'yml': 'yml',
            'sql': 'sql',
            'fig': 'fig',
            'drawio': 'drawio'
        };
        return typeMap[extension] || 'file';
    }

    // Deep clone object (for avoiding reference issues)
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
        return obj;
    }

    // Merge objects with conflict resolution
    mergeObjects(target, source, conflictResolution = 'source') {
        const result = this.deepClone(target);
        
        Object.keys(source).forEach(key => {
            if (source[key] !== undefined) {
                if (conflictResolution === 'source' || !(key in result)) {
                    result[key] = this.deepClone(source[key]);
                }
            }
        });
        
        return result;
    }

    // Debounce function calls
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function calls
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Get cache statistics
    getCacheStats() {
        const now = Date.now();
        const expired = [];
        const valid = [];
        
        this.cache.forEach((value, key) => {
            if (now - value.timestamp > this.cacheTimeout) {
                expired.push(key);
            } else {
                valid.push(key);
            }
        });
        
        return {
            total: this.cache.size,
            valid: valid.length,
            expired: expired.length
        };
    }

    // Clean expired cache entries
    cleanExpiredCache() {
        const now = Date.now();
        this.cache.forEach((value, key) => {
            if (now - value.timestamp > this.cacheTimeout) {
                this.cache.delete(key);
            }
        });
    }
}

// Export singleton instance
export const dataUtils = new DataUtils();
