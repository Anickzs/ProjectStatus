// ProjectDataManager.js - Enhanced data management with Cursor agent integration
class ProjectDataManager {
    constructor() {
        this.dataCache = new Map();
        this.mdFileCache = new Map();
        this.cursorAgent = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            console.log('=== ProjectDataManager Initialization Start ===');
            
            // Initialize Cursor agent
            console.log('Step 1: Initializing Cursor agent...');
            await this.initializeCursorAgent();
            
            // Load and cache project data
            console.log('Step 2: Loading project data...');
            await this.loadProjectData();
            
            // Process markdown files for each project
            console.log('Step 3: Processing markdown files...');
            await this.processMarkdownFiles();
            
            this.initialized = true;
            console.log('=== ProjectDataManager initialized successfully ===');
        } catch (error) {
            console.error('Failed to initialize ProjectDataManager:', error);
            throw error;
        }
    }

    async initializeCursorAgent() {
        // Initialize the Cursor agent for reading and processing markdown files
        try {
            // Wait a bit for scripts to load
            let attempts = 0;
            const maxAttempts = 10;
            
            while (typeof CursorAgentMock === 'undefined' && attempts < maxAttempts) {
                console.log(`Waiting for CursorAgentMock to load... attempt ${attempts + 1}`);
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (typeof CursorAgentMock !== 'undefined') {
                this.cursorAgent = new CursorAgentMock();
                await this.cursorAgent.initialize();
                console.log('CursorAgentMock initialized successfully');
            } else {
                console.warn('CursorAgentMock not available after waiting, using fallback implementation');
                this.cursorAgent = this.createFallbackCursorAgent();
            }
        } catch (error) {
            console.error('Failed to initialize Cursor agent:', error);
            this.cursorAgent = this.createFallbackCursorAgent();
        }
    }

    createFallbackCursorAgent() {
        // Fallback implementation if CursorAgentMock is not available
        return {
            readMarkdownFile: async (filePath) => {
                console.warn(`Fallback: Could not read markdown file ${filePath}`);
                return null;
            },
            
            analyzeProjectStructure: async (projectPath) => {
                console.warn(`Fallback: Could not analyze project ${projectPath}`);
                return null;
            },
            
            extractProjectInsights: async (markdownContent) => {
                console.warn('Fallback: Could not extract insights from markdown');
                return null;
            }
        };
    }

    async loadProjectData() {
        try {
            // Load the main project analysis file
            const response = await fetch('../data/project_analysis.json');
            if (!response.ok) {
                throw new Error(`Failed to load project data: ${response.status}`);
            }
            
            const projectData = await response.json();
            
            // Process and cache the data
            for (const [projectId, data] of Object.entries(projectData)) {
                this.dataCache.set(projectId, this.processProjectData(projectId, data));
            }
            
            console.log(`Loaded ${this.dataCache.size} projects`);
        } catch (error) {
            console.error('Error loading project data:', error);
            // Fallback to mock data if needed
            this.loadMockData();
        }
    }

    processProjectData(projectId, rawData) {
        // Process raw project data into a structured format
        const processed = {
            id: projectId,
            name: rawData.name || projectId,
            description: rawData.short_description || rawData.description || 'No description available',
            status: this.normalizeStatus(rawData.status),
            progress: this.normalizeProgress(rawData.progress),
            type: this.determineProjectType(rawData),
            lastUpdated: this.parseLastUpdated(rawData),
            completed_features: this.processCompletedFeatures(rawData.completed_features),
            files: this.processFiles(rawData),
            markdown_insights: null, // Will be populated by Cursor agent
            project_structure: null, // Will be populated by Cursor agent
            tasks: [], // Will be generated from markdown insights
            timeline: [], // Will be generated from markdown insights
            activity_log: [] // Will be generated from markdown insights
        };

        return processed;
    }

    normalizeStatus(status) {
        if (!status) return 'Unknown';
        
        const statusMap = {
            'planning': 'Planning',
            'in progress': 'In Progress',
            'testing': 'Testing',
            'completed': 'Completed',
            'pending': 'Pending'
        };
        
        const normalized = status.toLowerCase();
        return statusMap[normalized] || status;
    }

    normalizeProgress(progress) {
        if (typeof progress === 'number') return Math.min(100, Math.max(0, progress));
        if (typeof progress === 'string') {
            const match = progress.match(/(\d+)%/);
            return match ? parseInt(match[1]) : 0;
        }
        return 0;
    }

    determineProjectType(data) {
        const name = (data.name || '').toLowerCase();
        const description = (data.description || '').toLowerCase();
        
        if (name.includes('diy') || description.includes('diy')) return 'DIY App';
        if (name.includes('server') || description.includes('server')) return 'Server Infrastructure';
        if (name.includes('email') || description.includes('email')) return 'AI Automation';
        if (name.includes('trading') || description.includes('trading')) return 'Financial AI';
        
        return 'Web Application';
    }

    parseLastUpdated(data) {
        // Try to extract date from various sources
        const description = data.description || '';
        const dateMatch = description.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
        
        if (dateMatch) {
            return new Date(dateMatch[1]).toISOString();
        }
        
        return new Date().toISOString();
    }

    processCompletedFeatures(features) {
        if (!Array.isArray(features)) return [];
        
        return features
            .filter(feature => typeof feature === 'string' && feature.trim())
            .map(feature => feature.trim())
            .filter(feature => !feature.startsWith('**') && !feature.startsWith('Complete |'))
            .slice(0, 20); // Limit to prevent overwhelming the UI
    }

    processFiles(data) {
        // Generate files based on project type and features
        const files = [];
        
        if (data.completed_features) {
            // Add documentation files
            files.push({
                id: 'doc-1',
                name: 'Project_Overview.md',
                size: '2.1 KB',
                type: 'document',
                category: 'Documentation',
                uploadDate: this.parseLastUpdated(data),
                description: 'Project overview and current status'
            });
            
            // Add technical files based on project type
            if (data.name?.toLowerCase().includes('diy')) {
                files.push({
                    id: 'tech-1',
                    name: 'Technical_Specifications.md',
                    size: '1.8 KB',
                    type: 'document',
                    category: 'Technical',
                    uploadDate: this.parseLastUpdated(data),
                    description: 'Technical specifications and requirements'
                });
            }
        }
        
        return files;
    }

    async processMarkdownFiles() {
        // Process markdown files for each project using Cursor agent
        console.log(`Processing markdown files for ${this.dataCache.size} projects...`);
        
        for (const [projectId, projectData] of this.dataCache) {
            try {
                console.log(`Processing markdown for project: ${projectId}`);
                await this.processProjectMarkdown(projectId, projectData);
                console.log(`Successfully processed markdown for project: ${projectId}`);
            } catch (error) {
                console.warn(`Failed to process markdown for project ${projectId}:`, error);
            }
        }
        
        console.log('Markdown processing completed');
    }

    async processProjectMarkdown(projectId, projectData) {
        // Simulate reading markdown files for the project
        console.log(`Starting markdown processing for project: ${projectId}`);
        const markdownFiles = await this.discoverMarkdownFiles(projectId);
        console.log(`Found ${markdownFiles.length} markdown files for project: ${projectId}`);
        
        let insights = {
            tasks: [],
            timeline: [],
            activity_log: [],
            technical_details: {},
            project_structure: {}
        };
        
        // Check if we have actual markdown files to process
        const existingFiles = markdownFiles.filter(file => file.exists);
        
        if (existingFiles.length === 0) {
            console.log(`No existing markdown files found for ${projectId}, using default data generation`);
            // Generate default data instead of trying to read non-existent files
            insights = this.generateDefaultInsights(projectData);
        } else {
            // Process each existing markdown file
            for (const file of existingFiles) {
                try {
                    console.log(`Processing markdown file: ${file.path}`);
                    const content = await this.cursorAgent.readMarkdownFile(file.path);
                    if (content) {
                        console.log(`Successfully read file: ${file.path} (${content.length} characters)`);
                        const fileInsights = await this.cursorAgent.extractProjectInsights(content);
                        if (fileInsights) {
                            console.log(`Extracted insights from: ${file.path}`);
                            insights = this.mergeInsights(insights, fileInsights);
                        }
                    } else {
                        console.log(`No content found in file: ${file.path}`);
                    }
                } catch (error) {
                    console.warn(`Failed to process markdown file ${file.path}:`, error);
                }
            }
        }
        
        // Update project data with insights
        projectData.markdown_insights = insights;
        projectData.tasks = this.generateTasksFromInsights(insights, projectData);
        projectData.timeline = this.generateTimelineFromInsights(insights, projectData);
        projectData.activity_log = this.generateActivityLogFromInsights(insights, projectData);
        
        console.log(`Updated project ${projectId} with ${projectData.tasks.completed.length} completed tasks, ${projectData.tasks.inProgress.length} in-progress tasks, ${projectData.tasks.pending.length} pending tasks`);
        
        // Update cache
        this.dataCache.set(projectId, projectData);
    }

    async discoverMarkdownFiles(projectId) {
        // Look for project-specific markdown files in a consistent location
        // Each project should have a markdown file named after the project
        const projectMarkdownPaths = [
            `../data/${projectId}.md`,           // Look in data directory first
            `../docs/${projectId}.md`,           // Then in docs directory
            `../${projectId}.md`,               // Then in root directory
            `../README.md`                      // Fallback to general README
        ];
        
        // Check which files actually exist
        const existingFiles = [];
        for (const path of projectMarkdownPaths) {
            try {
                // Try to read the file to see if it exists
                const content = await this.cursorAgent.readMarkdownFile(path);
                if (content) {
                    existingFiles.push({
                        path: path,
                        name: path.split('/').pop(),
                        exists: true
                    });
                    // Found a file, no need to check others
                    break;
                }
            } catch (error) {
                // File doesn't exist or can't be read, continue to next path
                continue;
            }
        }
        
        // If no files found, return the default path structure
        if (existingFiles.length === 0) {
            return [{
                path: `../data/${projectId}.md`,
                name: `${projectId}.md`,
                exists: false
            }];
        }
        
        return existingFiles;
    }

    mergeInsights(existing, newInsights) {
        // Merge insights from multiple markdown files
        return {
            tasks: [...(existing.tasks || []), ...(newInsights.tasks || [])],
            timeline: [...(existing.timeline || []), ...(newInsights.timeline || [])],
            activity_log: [...(existing.activity_log || []), ...(newInsights.activity_log || [])],
            technical_details: { ...existing.technical_details, ...newInsights.technical_details },
            project_structure: { ...existing.project_structure, ...newInsights.project_structure }
        };
    }

    generateDefaultInsights(projectData) {
        // Generate default insights when no markdown files exist
        return {
            tasks: [
                {
                    title: 'Project Setup',
                    description: 'Initial project configuration and environment setup',
                    status: 'completed',
                    priority: 'high'
                },
                {
                    title: 'Requirements Analysis',
                    description: 'Define project requirements and specifications',
                    status: 'in-progress',
                    priority: 'high'
                },
                {
                    title: 'Design Phase',
                    description: 'Create UI/UX designs and technical architecture',
                    status: 'pending',
                    priority: 'medium'
                },
                {
                    title: 'Development',
                    description: 'Implement core features and functionality',
                    status: 'pending',
                    priority: 'high'
                },
                {
                    title: 'Testing',
                    description: 'Comprehensive testing and quality assurance',
                    status: 'pending',
                    priority: 'medium'
                },
                {
                    title: 'Deployment',
                    description: 'Deploy to production environment',
                    status: 'pending',
                    priority: 'low'
                }
            ],
            timeline: [
                {
                    event: 'Project Initiated',
                    description: 'Project was created and initial setup completed',
                    date: projectData.lastUpdated || new Date().toISOString()
                }
            ],
            activity_log: [
                {
                    action: 'Project Created',
                    description: 'New project was initialized',
                    timestamp: projectData.lastUpdated || new Date().toISOString()
                }
            ],
            technical_details: {
                framework: 'TBD',
                database: 'TBD',
                deployment: 'TBD'
            },
            project_structure: {
                frontend: 'TBD',
                backend: 'TBD',
                database: 'TBD'
            }
        };
    }

    generateTasksFromInsights(insights, projectData) {
        const tasks = {
            completed: [],
            inProgress: [],
            pending: []
        };
        
        // Generate tasks from markdown insights
        if (insights.tasks && Array.isArray(insights.tasks)) {
            insights.tasks.forEach((task, index) => {
                const taskObj = {
                    id: `task-${index}`,
                    title: task.title || `Task ${index + 1}`,
                    description: task.description || 'Task description',
                    status: task.status || 'pending',
                    priority: task.priority || 'medium',
                    project: projectData.name,
                    dueDate: task.dueDate || 'Ongoing'
                };
                
                if (task.status === 'completed') {
                    tasks.completed.push(taskObj);
                } else if (task.status === 'in-progress') {
                    tasks.inProgress.push(taskObj);
                } else {
                    tasks.pending.push(taskObj);
                }
            });
        }
        
        // If no tasks from insights, generate from project features
        if (tasks.completed.length === 0 && tasks.inProgress.length === 0 && tasks.pending.length === 0) {
            return this.generateTasksFromFeatures(projectData);
        }
        
        return tasks;
    }

    generateTasksFromFeatures(projectData) {
        const tasks = {
            completed: [],
            inProgress: [],
            pending: []
        };
        
        // Convert completed features to completed tasks
        if (projectData.completed_features && Array.isArray(projectData.completed_features)) {
            projectData.completed_features.forEach((feature, index) => {
                if (feature && feature.trim()) {
                    tasks.completed.push({
                        id: `completed-${index}`,
                        title: this.extractTaskTitle(feature),
                        description: feature,
                        status: 'completed',
                        priority: this.determineTaskPriority(feature),
                        project: projectData.name,
                        completedDate: projectData.lastUpdated
                    });
                }
            });
        }
        
        // Generate in-progress and pending tasks based on project status
        if (projectData.status === 'In Progress') {
            tasks.inProgress.push({
                id: 'in-progress-1',
                title: 'Continue Development',
                description: 'Continue working on core features and implementation',
                status: 'in-progress',
                priority: 'high',
                project: projectData.name,
                dueDate: 'Ongoing'
            });
        }
        
        // Add project-specific pending tasks
        this.addProjectSpecificTasks(tasks, projectData);
        
        return tasks;
    }

    addProjectSpecificTasks(tasks, projectData) {
        const projectName = projectData.name.toLowerCase();
        
        if (projectName.includes('diy')) {
            tasks.pending.push({
                id: 'pending-1',
                title: 'User Testing & Feedback',
                description: 'Conduct user testing and gather feedback on the DIY planning features',
                status: 'pending',
                priority: 'medium',
                project: projectData.name,
                dueDate: 'Next Week'
            });
        } else if (projectName.includes('server')) {
            tasks.pending.push({
                id: 'pending-1',
                title: 'Infrastructure Deployment',
                description: 'Deploy and configure the server infrastructure with monitoring',
                status: 'pending',
                priority: 'high',
                project: projectData.name,
                dueDate: 'Next Week'
            });
        } else if (projectName.includes('email')) {
            tasks.pending.push({
                id: 'pending-1',
                title: 'API Integration Testing',
                description: 'Test and validate email provider API integrations',
                status: 'pending',
                priority: 'high',
                project: projectData.name,
                dueDate: 'Next Week'
            });
        }
        
        // Add general tasks
        tasks.pending.push({
            id: 'pending-2',
            title: 'Documentation Update',
            description: 'Update project documentation and create user guides',
            status: 'pending',
            priority: 'medium',
            project: projectData.name,
            dueDate: 'Ongoing'
        });
    }

    generateTimelineFromInsights(insights, projectData) {
        // Generate timeline from markdown insights or create default timeline
        if (insights.timeline && Array.isArray(insights.timeline) && insights.timeline.length > 0) {
            return insights.timeline;
        }
        
        // Default timeline based on project data
        return this.generateDefaultTimeline(projectData);
    }

    generateDefaultTimeline(projectData) {
        const timeline = [];
        const now = new Date();
        
        // Add project milestones based on progress
        if (projectData.progress >= 25) {
            timeline.push({
                id: 'milestone-1',
                date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                title: 'Project Initiation',
                description: 'Project planning and setup completed',
                type: 'milestone'
            });
        }
        
        if (projectData.progress >= 50) {
            timeline.push({
                id: 'milestone-2',
                date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                title: 'Core Development',
                description: 'Core features implemented and tested',
                type: 'milestone'
            });
        }
        
        if (projectData.progress >= 75) {
            timeline.push({
                id: 'milestone-3',
                date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                title: 'Testing Phase',
                description: 'Comprehensive testing and bug fixes',
                type: 'milestone'
            });
        }
        
        return timeline;
    }

    generateActivityLogFromInsights(insights, projectData) {
        // Generate activity log from markdown insights or create default activities
        if (insights.activity_log && Array.isArray(insights.activity_log) && insights.activity_log.length > 0) {
            return insights.activity_log;
        }
        
        // Default activity log based on project data
        return this.generateDefaultActivityLog(projectData);
    }

    generateDefaultActivityLog(projectData) {
        const activities = [];
        const now = new Date();
        
        // Add recent activities based on project status
        activities.push({
            id: 'activity-1',
            timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            action: 'Project Updated',
            description: `Updated project status to ${projectData.status}`,
            type: 'update'
        });
        
        if (projectData.completed_features && projectData.completed_features.length > 0) {
            activities.push({
                id: 'activity-2',
                timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
                action: 'Feature Completed',
                description: `Completed ${projectData.completed_features.length} features`,
                type: 'feature'
            });
        }
        
        return activities;
    }

    extractTaskTitle(feature) {
        // Extract a clean task title from feature description
        if (!feature) return 'Untitled Task';
        
        // Remove markdown formatting and extract first meaningful line
        const cleanFeature = feature
            .replace(/\*\*/g, '')
            .replace(/^[-|•]\s*/, '')
            .trim();
        
        // Take first 50 characters as title
        return cleanFeature.length > 50 ? cleanFeature.substring(0, 50) + '...' : cleanFeature;
    }

    determineTaskPriority(feature) {
        if (!feature) return 'medium';
        
        const lowerFeature = feature.toLowerCase();
        
        // High priority for core functionality
        if (lowerFeature.includes('authentication') || 
            lowerFeature.includes('database') || 
            lowerFeature.includes('api') ||
            lowerFeature.includes('core') ||
            lowerFeature.includes('basic') ||
            lowerFeature.includes('deployment')) {
            return 'high';
        }
        
        // Medium priority for user experience features
        if (lowerFeature.includes('ui') || 
            lowerFeature.includes('design') || 
            lowerFeature.includes('user') ||
            lowerFeature.includes('interface') ||
            lowerFeature.includes('testing')) {
            return 'medium';
        }
        
        return 'low';
    }

    getProjectData(projectId) {
        if (!this.initialized) {
            console.warn('ProjectDataManager not initialized. Call initialize() first.');
            return null;
        }
        
        return this.dataCache.get(projectId) || null;
    }

    getAllProjects() {
        if (!this.initialized) {
            console.warn('ProjectDataManager not initialized. Call initialize() first.');
            return [];
        }
        
        return Array.from(this.dataCache.values());
    }

    async refreshProjectData() {
        // Clear cache and reload data
        this.dataCache.clear();
        this.mdFileCache.clear();
        this.initialized = false;
        
        await this.initialize();
    }

    loadMockData() {
        // Fallback to mock data if JSON loading fails
        console.log('Loading mock data as fallback');
        
        const mockProjects = {
            'DIYAPP': {
                id: 'DIYAPP',
                name: 'At Home DIY',
                description: 'Next.js 14 DIY project planning app with build planner, quick builds, and responsive design.',
                status: 'In Progress',
                progress: 65,
                type: 'DIY App',
                lastUpdated: new Date().toISOString(),
                completed_features: [
                    'User authentication and profile management',
                    'Project creation and basic CRUD operations',
                    'Material calculator with common DIY materials',
                    'Progress tracking with visual indicators'
                ],
                files: [],
                tasks: [],
                timeline: [],
                activity_log: []
            },
            'BusinessLoclAi': {
                id: 'BusinessLoclAi',
                name: 'Business Local AI',
                description: 'AI-powered local business directory and review platform.',
                status: 'Planning',
                progress: 10,
                type: 'Web Application',
                lastUpdated: new Date().toISOString(),
                completed_features: [
                    'Basic project structure setup',
                    'Database schema design'
                ],
                files: [],
                tasks: [],
                timeline: [],
                activity_log: []
            },
            'AiAutoAgency': {
                id: 'AiAutoAgency',
                name: 'AI Auto Agency',
                description: 'Automated AI-powered marketing and advertising agency platform.',
                status: 'Development',
                progress: 35,
                type: 'AI Platform',
                lastUpdated: new Date().toISOString(),
                completed_features: [
                    'AI content generation engine',
                    'Campaign management system',
                    'Analytics dashboard'
                ],
                files: [],
                tasks: [],
                timeline: [],
                activity_log: []
            },
            'CryptoTradingBot': {
                id: 'CryptoTradingBot',
                name: 'Crypto Trading Bot',
                description: 'Automated cryptocurrency trading bot with AI-powered market analysis.',
                status: 'Testing',
                progress: 80,
                type: 'Trading Bot',
                lastUpdated: new Date().toISOString(),
                completed_features: [
                    'Market data integration',
                    'Trading algorithm implementation',
                    'Risk management system',
                    'Performance analytics'
                ],
                files: [],
                tasks: [],
                timeline: [],
                activity_log: []
            }
        };
        
        for (const [projectId, data] of Object.entries(mockProjects)) {
            this.dataCache.set(projectId, data);
        }
        
        this.initialized = true;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectDataManager;
}
