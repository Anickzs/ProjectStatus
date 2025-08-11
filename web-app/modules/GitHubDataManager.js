// GitHubDataManager.js - Fetches project data from GitHub repositories
class GitHubDataManager {
    constructor() {
        this.githubApiBase = 'https://api.github.com';
        this.rawContentBase = 'https://raw.githubusercontent.com';
        this.dataCache = new Map();
        this.sessionData = new Map(); // Session-based data storage
        this.initialized = false;
        this._index = {
            byId: new Map(),
            byTitle: new Map(),
            aliases: new Map()
        };
        this.repositories = [
            {
                name: 'DIYapp',
                owner: 'Anickzs',
                branch: 'main',
                projectDetailsPath: 'ProjectDetails.md'
            },
            {
                name: 'BusinessLoclAi',
                owner: 'Anickzs',
                branch: 'main',
                projectDetailsPath: 'ProjectDetails.md'
            }
        ];
        
        // Project to repository mapping table
        this._projectRepo = new Map();
        this._projectRepo.set('at-home-diy-project-statistics-status', {
            owner: 'Anickzs',
            repo: 'DIYapp',
            basePath: '' // file is at repo root
        });
        this._projectRepo.set('businesslocalai-project-details', {
            owner: 'Anickzs',
            repo: 'BusinessLoclAi',
            basePath: '' // file is at repo root
        });
    }

    /**
     * Robust slugify function to create stable project IDs from H1 titles
     * @param {string} input - Input string to slugify
     * @returns {string} Slugified string
     */
    slugify(input) {
        if (!input) return "";
        // remove emoji & pictographs
        const noEmoji = input.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "");
        // normalize accents
        const ascii = noEmoji.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
        // keep letters, numbers, space, dash, underscore
        const cleaned = ascii.replace(/[^a-zA-Z0-9 _-]+/g, " ");
        return cleaned
            .toLowerCase()
            .replace(/[_\s]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
    }

    /**
     * Resolve project ID from various query formats
     * @param {string} query - Query string (id, title, alias, or slug)
     * @returns {string|null} Resolved project ID or null if not found
     */
    _resolveProjectId(query) {
        if (!query) return null;
        const q = String(query);
        
        // Try direct id first
        if (this._index.byId.has(q)) return q;
        
        // Try alias map
        if (this._index.aliases.has(q)) return this._index.aliases.get(q);
        
        // Try title
        if (this._index.byTitle.has(q)) return this._index.byTitle.get(q).id;
        
        // Try slug of the query
        const s = this.slugify(q);
        if (this._index.byId.has(s)) return s;
        if (this._index.aliases.has(s)) return this._index.aliases.get(s);
        
        // Try slug of any known title (rare path): already covered by byId since we store id as slug of title
        return null;
    }

    /**
     * Build indexes for fast lookups
     */
    _buildIndexes() {
        this._index.byId.clear();
        this._index.byTitle.clear();
        this._index.aliases.clear();

        for (const [projectId, projectData] of this.sessionData) {
            if (projectData.id && projectData.title) {
                // Store by canonical ID
                this._index.byId.set(projectData.id, projectData);
                
                // Store by title
                this._index.byTitle.set(projectData.title, projectData);
                
                // Store aliases if they exist
                if (projectData.aliases && Array.isArray(projectData.aliases)) {
                    for (const alias of projectData.aliases) {
                        this._index.aliases.set(alias, projectData.id);
                    }
                }
            }
        }

        // Add lightweight alias map for common short names
        this._addCommonAliases();

        console.log('Indexes built:', {
            byId: this._index.byId.size,
            byTitle: this._index.byTitle.size,
            aliases: this._index.aliases.size
        });
    }

    /**
     * Add common aliases for short names
     */
    _addCommonAliases() {
        // Map short names to actual project IDs
        const commonAliases = {
            'diyapp': 'at-home-diy-project-statistics-status',
            'businesslocalai': 'businesslocalai-project-details'
        };

        // Add aliases if the target projects exist
        for (const [alias, targetId] of Object.entries(commonAliases)) {
            if (this._index.byId.has(targetId)) {
                this._index.aliases.set(alias, targetId);
                console.log(`Added alias: ${alias} -> ${targetId}`);
            }
        }
    }

    /**
     * Initialize the GitHub data manager with session-based caching
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            console.log('=== GitHubDataManager Initialization Start ===');
            
            // Check for existing session data first
            if (this.loadSessionData()) {
                console.log('Loaded data from session storage');
                // Build indexes after loading session data
                this._buildIndexes();
                this.initialized = true;
                return;
            }
            
            // Load and cache project data from GitHub
            console.log('Step 1: Loading project data from GitHub...');
            await this.loadAllProjectData();
            
            // Build indexes after loading all data
            this._buildIndexes();
            
            // Save to session storage
            this.saveSessionData();
            
            this.initialized = true;
            console.log('=== GitHubDataManager initialized successfully ===');
        } catch (error) {
            console.error('Failed to initialize GitHubDataManager:', error);
            throw error;
        }
    }

    /**
     * Load session data from sessionStorage if available
     */
    loadSessionData() {
        try {
            const sessionData = sessionStorage.getItem('githubProjectData');
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                this.sessionData = new Map(Object.entries(parsed));
                
                // Migrate old session data to new format
                this._migrateSessionData();
                
                // Convert session data to the expected format for backward compatibility
                this.sessionData.forEach((projectData, projectId) => {
                    this.dataCache.set(projectId, this.convertToLegacyFormat(projectData));
                });
                
                return true;
            }
        } catch (error) {
            console.warn('Failed to load session data:', error);
        }
        return false;
    }

    /**
     * Migrate old session data to new normalized format
     */
    _migrateSessionData() {
        let migrated = false;
        
        for (const [projectId, projectData] of this.sessionData) {
            // If old item lacks `id`, compute and assign it
            if (!projectData.id && (projectData.title || projectData.name)) {
                const title = projectData.title || projectData.name;
                projectData.id = this.slugify(title);
                projectData.title = title; // Ensure title field exists
                projectData.aliases = projectData.aliases || [];
                
                // If the old projectId is different from the new id, add it as an alias
                if (projectId !== projectData.id) {
                    projectData.aliases.push(projectId);
                }
                
                migrated = true;
                console.log(`Migrated project "${title}" with ID "${projectData.id}"`);
            }
            
            // Ensure aliases array exists
            if (!projectData.aliases) {
                projectData.aliases = [];
            }
        }
        
        if (migrated) {
            console.log('Session data migration completed');
            // Save back the normalized structure to sessionStorage
            this.saveSessionData();
        }
    }

    /**
     * Save current session data to sessionStorage
     */
    saveSessionData() {
        try {
            const sessionData = Object.fromEntries(this.sessionData);
            sessionStorage.setItem('githubProjectData', JSON.stringify(sessionData));
            console.log('Session data saved to sessionStorage');
        } catch (error) {
            console.warn('Failed to save session data:', error);
        }
    }

    /**
     * Convert new structured format to legacy format for backward compatibility
     */
    convertToLegacyFormat(projectData) {
        return {
            id: projectData.id,
            title: projectData.title,
            name: projectData.name,
            description: projectData.overview,
            status: projectData.status.phase,
            progress: projectData.status.progress,
            completed_features: projectData.features.completed,
            in_progress_features: projectData.features.inProgress,
            todo_features: projectData.features.pending,
            technical_stack: projectData.technical, // Changed from tech_stack to technical_stack
            key_features: projectData.keyFeatures, // Added key_features field
            last_updated: new Date().toISOString(),
            metrics: {},
            roadmap: [],
            files: [],
            tasks: { completed: [], inProgress: [], pending: [] },
            timeline: [],
            activity_log: [],
            aliases: projectData.aliases || []
        };
    }

    async loadAllProjectData() {
        console.log(`Loading data for ${this.repositories.length} repositories...`);
        
        // First, try to load from local data file
        await this.loadLocalProjectData();
        
        // If no local data loaded, try GitHub repositories
        if (this.sessionData.size === 0) {
            console.log('No local data found, trying GitHub repositories...');
            
            const loadPromises = this.repositories.map(async (repo) => {
                try {
                    console.log(`Loading data for repository: ${repo.name}`);
                    const projectData = await this.loadProjectData(repo);
                    if (projectData) {
                        // Store by normalized ID in session data (new format)
                        this.sessionData.set(projectData.id, projectData);
                        
                        // Store by both normalized ID and repository name in cache for backward compatibility
                        const legacyData = this.convertToLegacyFormat(projectData);
                        this.dataCache.set(projectData.id, legacyData);
                        this.dataCache.set(repo.name, legacyData);
                        
                        console.log(`Successfully loaded data for ${repo.name} -> ${projectData.id}`);
                    }
                } catch (error) {
                    console.warn(`Failed to load data for repository ${repo.name}:`, error);
                }
            });

            await Promise.all(loadPromises);
        }
        
        console.log(`Loaded data for ${this.sessionData.size} projects`);
    }

    async loadLocalProjectData() {
        try {
            console.log('Attempting to load local PROJECTS.md file...');
            
            // Load the local PROJECTS.md file
            const response = await fetch('/data/PROJECTS.md');
            if (!response.ok) {
                console.warn('Local PROJECTS.md not found, will try GitHub');
                return;
            }
            
            const content = await response.text();
            console.log(`Loaded local PROJECTS.md file (${content.length} characters)`);
            
            // Parse the markdown content to extract individual projects
            const projects = this.parseLocalProjectsFile(content);
            
            // Add each project to session data and cache
            for (const project of projects) {
                if (project.id && project.title) {
                    this.sessionData.set(project.id, project);
                    
                    // Also store in cache for backward compatibility
                    const legacyData = this.convertToLegacyFormat(project);
                    this.dataCache.set(project.id, legacyData);
                    
                    console.log(`Added local project: ${project.title} (ID: ${project.id})`);
                }
            }
            
        } catch (error) {
            console.error('Error loading local project data:', error);
        }
    }

    parseLocalProjectsFile(content) {
        const projects = [];
        
        console.log('=== PARSING LOCAL PROJECTS FILE ===');
        console.log('Content length:', content.length);
        
        // Split content by ## headings to find individual projects
        const projectSections = content.split(/(?=^##\s+)/m);
        console.log('Found project sections:', projectSections.length);
        
        for (let i = 0; i < projectSections.length; i++) {
            const section = projectSections[i];
            console.log(`\n--- Processing section ${i + 1} ---`);
            console.log('Section starts with ##:', section.trim().startsWith('##'));
            console.log('Section length:', section.length);
            console.log('Section preview:', section.substring(0, 200));
            
            if (section.trim() && section.startsWith('##')) {
                try {
                    // Extract project name from ## heading
                    const titleMatch = section.match(/^##\s+(.+)$/m);
                    if (titleMatch) {
                        const projectTitle = titleMatch[1].trim();
                        const projectId = this.slugify(projectTitle);
                        
                        console.log('Extracted title:', projectTitle);
                        console.log('Generated ID:', projectId);
                        
                        // Parse this project section
                        const sections = this.splitByHeadings(section);
                        console.log('Parsed sections:', Object.keys(sections));
                        
                        const project = {
                            id: projectId,
                            title: projectTitle,
                            name: projectTitle,
                            overview: this.extractOverview(sections),
                            status: this.extractStatus(sections),
                            features: {
                                completed: this.extractCompletedFeatures(sections),
                                inProgress: this.extractInProgressFeatures(sections),
                                pending: this.extractPendingTasks(sections)
                            },
                            technical: this.extractTechnicalStack(sections),
                            keyFeatures: this.extractKeyFeatures(sections),
                            aliases: [projectTitle]
                        };
                        
                        console.log('Project overview:', project.overview?.substring(0, 100));
                        console.log('Project status:', project.status);
                        console.log('Completed features count:', project.features.completed.length);
                        console.log('In progress features count:', project.features.inProgress.length);
                        console.log('Pending features count:', project.features.pending.length);
                        console.log('Technical stack count:', project.technical.length);
                        console.log('Key features count:', project.keyFeatures.length);
                        
                        projects.push(project);
                        console.log(`✅ Successfully parsed local project: ${projectTitle}`);
                    } else {
                        console.log('❌ No title match found in section');
                    }
                } catch (error) {
                    console.error('❌ Error parsing project section:', error);
                }
            } else {
                console.log('❌ Section does not start with ## or is empty');
            }
        }
        
        console.log(`\n=== PARSING COMPLETE ===`);
        console.log(`Total projects parsed: ${projects.length}`);
        
        return projects;
    }

    async loadProjectData(repo) {
        try {
            // Fetch the ProjectDetails.md file from GitHub
            const rawContentUrl = `${this.rawContentBase}/${repo.owner}/${repo.name}/${repo.branch}/${repo.projectDetailsPath}`;
            console.log(`Fetching from: ${rawContentUrl}`);
            
            const response = await fetch(rawContentUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${repo.projectDetailsPath}: ${response.status}`);
            }
            
            const markdownContent = await response.text();
            console.log(`Successfully fetched ${markdownContent.length} characters from ${repo.name}`);
            
            // Parse the markdown content into structured data using new parser
            const parsedData = this.parseMarkdownToStructuredData(markdownContent, repo.name);
            
            return parsedData;
        } catch (error) {
            console.error(`Error loading project data for ${repo.name}:`, error);
            
            // Check if it's a private repository error
            if (error.message.includes('404') || error.message.includes('Not Found')) {
                console.warn(`Repository ${repo.name} might be private or not accessible`);
                return this.getFallbackStructuredData(repo.name, 'private');
            }
            
            // Return fallback data if GitHub fetch fails
            return this.getFallbackStructuredData(repo.name);
        }
    }

    /**
     * Parse markdown content into structured data format
     * @param {string} content - Raw markdown content
     * @param {string} projectName - Name of the project
     * @returns {Object} Structured project data
     */
    parseMarkdownToStructuredData(content, projectName) {
        console.log(`Parsing markdown for ${projectName}...`);
        
        // Split content by ## headings for easier parsing
        const sections = this.splitByHeadings(content);
        
        // Extract title and compute stable ID
        const title = this.extractProjectName(sections, projectName);
        const id = this.slugify(title);
        
        // Check for existing aliases in session data
        const existingProject = this.sessionData.get(projectName);
        const aliases = existingProject?.aliases || [];
        
        // If the old projectName is different from the new id, add it as an alias
        if (projectName !== id) {
            aliases.push(projectName);
        }
        
        const parsed = {
            id: id,
            title: title,
            name: title, // Keep name for backward compatibility
            overview: this.extractOverview(sections),
            status: this.extractStatus(sections),
            features: {
                completed: this.extractCompletedFeatures(sections),
                inProgress: this.extractInProgressFeatures(sections),
                pending: this.extractPendingTasks(sections)
            },
            technical: this.extractTechnicalStack(sections),
            keyFeatures: this.extractKeyFeatures(sections),
            aliases: aliases
        };

        console.log(`Parsed structured data for ${title}:`, {
            id: parsed.id,
            title: parsed.title,
            status: parsed.status,
            featuresCount: {
                completed: parsed.features.completed.length,
                inProgress: parsed.features.inProgress.length,
                pending: parsed.features.pending.length
            }
        });

        return parsed;
    }

    /**
     * Split markdown content by ## headings
     * @param {string} content - Raw markdown content
     * @returns {Object} Object with section names as keys and content as values
     */
    splitByHeadings(content) {
        const sections = {};
        const lines = content.split('\n');
        let currentSection = 'default';
        let currentContent = [];

        for (const line of lines) {
            if (line.startsWith('## ')) {
                // Save previous section
                if (currentContent.length > 0) {
                    sections[currentSection] = currentContent.join('\n').trim();
                }
                
                // Start new section
                currentSection = line.replace('## ', '').trim().toLowerCase();
                currentContent = [];
            } else {
                currentContent.push(line);
            }
        }

        // Save last section
        if (currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n').trim();
        }

        return sections;
    }

    /**
     * Extract project name from markdown content
     * @param {Object} sections - Parsed sections
     * @param {string} fallbackName - Fallback name if not found
     * @returns {string} Project name
     */
    extractProjectName(sections, fallbackName) {
        // Look for # heading at the start of content
        const defaultSection = sections['default'] || '';
        const nameMatch = defaultSection.match(/^#\s*([^#\n]+)/m);
        if (nameMatch) {
            return nameMatch[1].trim();
        }
        
        // Look for "Project Name:" pattern
        const projectNameMatch = defaultSection.match(/Project Name[:\s]+([^\n]+)/i);
        if (projectNameMatch) {
            return projectNameMatch[1].trim();
        }
        
        return fallbackName;
    }

    /**
     * Extract project overview from sections
     * @param {Object} sections - Parsed sections
     * @returns {string} Project overview
     */
    extractOverview(sections) {
        const overviewSection = sections['project overview'] || sections['overview'] || '';
        if (overviewSection) {
            return overviewSection.replace(/^[-*]\s*/gm, '').trim();
        }

        // Fallback to default section if no specific overview
        const defaultSection = sections['default'] || '';
        const descriptionMatch = defaultSection.match(/Description[:\s]+([^\n]+)/i);
        if (descriptionMatch) {
            return descriptionMatch[1].trim();
        }

        return 'Project overview not available';
    }

    /**
     * Extract project status and progress
     * @param {Object} sections - Parsed sections
     * @returns {Object} Status object with phase and progress
     */
    extractStatus(sections) {
        const statusSection = sections['project status'] || sections['status'] || '';
        
        let phase = 'Unknown';
        let progress = 0;

        // Extract phase from status section
        if (statusSection) {
            // Handle emoji and bold formatting in status
            const cleanStatus = statusSection.replace(/[✅🟡🔴]/g, '').replace(/\*\*/g, '');
            
            // Look for common status patterns
            if (cleanStatus.toLowerCase().includes('complete') || cleanStatus.toLowerCase().includes('ready')) {
                phase = 'Production Ready';
            } else if (cleanStatus.toLowerCase().includes('progress') || cleanStatus.toLowerCase().includes('development')) {
                phase = 'In Progress';
            } else if (cleanStatus.toLowerCase().includes('planning')) {
                phase = 'Planning';
            } else {
                // Extract first meaningful word as phase
                const phaseMatch = cleanStatus.match(/(\w+)/i);
                if (phaseMatch) {
                    phase = phaseMatch[1];
                }
            }
        }

        // Extract progress percentage - handle various formats
        let progressMatch = statusSection.match(/(\d+)%/i);
        if (!progressMatch) {
            // Try alternative patterns like "80% Complete"
            progressMatch = statusSection.match(/(\d+)%\s*complete/i);
        }
        if (!progressMatch) {
            // Try "X% Complete - Production Ready" format
            progressMatch = statusSection.match(/(\d+)%\s*complete\s*-\s*production\s*ready/i);
        }
        
        if (progressMatch) {
            progress = parseInt(progressMatch[1]);
        } else {
            // Calculate progress from features if no percentage found
            const completedCount = this.extractCompletedFeatures(sections).length;
            const inProgressCount = this.extractInProgressFeatures(sections).length;
            const pendingCount = this.extractPendingTasks(sections).length;
            
            const total = completedCount + inProgressCount + pendingCount;
            if (total > 0) {
                progress = Math.round(((completedCount + (inProgressCount * 0.5)) / total) * 100);
            }
        }

        return { phase, progress };
    }

    /**
     * Extract completed features from sections
     * @param {Object} sections - Parsed sections
     * @returns {Array} Array of completed features
     */
    extractCompletedFeatures(sections) {
        const completedSection = sections['completed features'] || '';
        if (!completedSection) return [];

        return this.extractFeatureList(completedSection);
    }

    /**
     * Extract in-progress features from sections
     * @param {Object} sections - Parsed sections
     * @returns {Array} Array of in-progress features
     */
    extractInProgressFeatures(sections) {
        const inProgressSection = sections['in progress'] || sections['in-progress'] || '';
        if (!inProgressSection) return [];

        return this.extractFeatureList(inProgressSection);
    }

    /**
     * Extract pending tasks from sections
     * @param {Object} sections - Parsed sections
     * @returns {Array} Array of pending tasks
     */
    extractPendingTasks(sections) {
        const pendingSection = sections['pending tasks'] || sections['todo'] || sections['development todo'] || '';
        if (!pendingSection) return [];

        return this.extractFeatureList(pendingSection);
    }

    /**
     * Extract technical stack from sections
     * @param {Object} sections - Parsed sections
     * @returns {Array} Array of technical stack items
     */
    extractTechnicalStack(sections) {
        const techSection = sections['technical stack'] || sections['technology stack'] || sections['tech stack'] || '';
        if (!techSection) return [];

        return this.extractFeatureList(techSection);
    }

    /**
     * Extract key features from sections
     * @param {Object} sections - Parsed sections
     * @returns {Array} Array of key features
     */
    extractKeyFeatures(sections) {
        const keyFeaturesSection = sections['key features'] || sections['features'] || '';
        if (!keyFeaturesSection) return [];

        return this.extractFeatureList(keyFeaturesSection);
    }

    /**
     * Extract feature list from section content
     * @param {string} sectionContent - Section content
     * @returns {Array} Array of features
     */
    extractFeatureList(sectionContent) {
        const features = [];
        const lines = sectionContent.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Handle checkbox format: - [x] Feature description
            if (trimmed.startsWith('- [x]') || trimmed.startsWith('- [ ]')) {
                const featureText = trimmed.replace(/^- \[[x ]\]\s*/, '').trim();
                if (featureText) {
                    // Clean up markdown formatting
                    const cleanFeature = featureText
                        .replace(/\*\*/g, '') // Remove bold
                        .replace(/`/g, '') // Remove code formatting
                        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Convert links to text
                    features.push(cleanFeature);
                }
            } 
            // Handle numbered lists: 1. Feature description
            else if (/^\d+\.\s/.test(trimmed)) {
                const featureText = trimmed.replace(/^\d+\.\s*/, '').trim();
                if (featureText) {
                    const cleanFeature = featureText
                        .replace(/\*\*/g, '')
                        .replace(/`/g, '')
                        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
                    features.push(cleanFeature);
                }
            }
            // Handle regular list items: - Feature description
            else if (trimmed.startsWith('- ') && !trimmed.startsWith('- [x]') && !trimmed.startsWith('- [ ]')) {
                const featureText = trimmed.replace(/^-\s*/, '').trim();
                if (featureText) {
                    const cleanFeature = featureText
                        .replace(/\*\*/g, '')
                        .replace(/`/g, '')
                        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
                    features.push(cleanFeature);
                }
            }
            // Handle bold headers that might be features: **Feature Name**
            else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                const featureText = trimmed.replace(/\*\*/g, '').trim();
                if (featureText && !featureText.includes(':') && featureText.length > 3) {
                    features.push(featureText);
                }
            }
            // Fallback: any line with content (original logic)
            else if (trimmed && trimmed.length > 3 && !trimmed.startsWith('#')) {
                const cleanFeature = trimmed
                    .replace(/^[-*•]\s*/, '') // Remove bullet points
                    .replace(/^\[[x ]\]\s*/, '') // Remove checkboxes
                    .replace(/\*\*/g, '') // Remove bold formatting
                    .replace(/`/g, '') // Remove code formatting
                    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Convert links to text
                
                if (cleanFeature && cleanFeature.length > 3) {
                    features.push(cleanFeature);
                }
            }
        }

        return features;
    }

    /**
     * Robust markdown parser that supports both "## Sections" and "Label: Value" formats
     * @param {string} markdown - Raw markdown content
     * @returns {Object} Parsed project data
     */
    parseProjectMarkdown(markdown) {
        const text = markdown || "";

        const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const grabSection = (titles) => {
            const t = titles.map(esc).join("|");
            // Handle both standard format and emoji/bold format
            const re = new RegExp(`(?:^|\\n)##\\s*[🎯✅🚧📊]*\\s*\\*\\*(?:${t})\\*\\*\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "i");
            let m = text.match(re);
            if (!m) {
                // Fallback to standard format
                const re2 = new RegExp(`(?:^|\\n)##\\s*(?:${t})\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "i");
                m = text.match(re2);
            }
            return m ? m[1].trim() : "";
        };
        const grabLabel = (labels) => {
            const t = labels.map(esc).join("|");
            const re = new RegExp(`(?:^|\\n)\\s*(?:${t})\\s*[:\\-]\\s*([^\\n]+)`, "i");
            const m = text.match(re);
            return m ? m[1].trim() : "";
        };

        const title = (text.match(/^\s*#\s+(.+)\s*$/m) || [,""])[1].trim();

        // Try label-based overview first, then section-based
        const overviewLabel = grabLabel(["Project Overview", "Overview"]);
        const overviewSec = grabSection(["Overview","Project Overview","Summary"]);
        const overview = overviewLabel || overviewSec || "";
        
        // Try label-based status first, then extract from section
        const statusLabel = grabLabel(["Status","Project Status"]);
        const statusSection = grabSection(["Status", "Project Status"]);
        let statusTxt = statusLabel || "";
        
        if (!statusTxt && statusSection) {
            // Look for "Current Phase" in the status section (handle bullet points and bold formatting)
            const phaseMatch = statusSection.match(/[-*•]\s*\*\*Current Phase\*\*[:\s]*([^\n]+)/i);
            if (phaseMatch) {
                statusTxt = phaseMatch[1].trim();
            } else {
                // Look for status in the overview section (GitHub format)
                const overviewSection = grabSection(["PROJECT OVERVIEW", "Project Overview", "Overview"]);
                if (overviewSection) {
                    const statusMatch = overviewSection.match(/\*\*Status:\*\*\s*([^\n]+)/i);
                    if (statusMatch) {
                        statusTxt = statusMatch[1].trim();
                    }
                }
                
                if (!statusTxt) {
                    // Fallback to first line - remove all markdown formatting
                    const firstLine = statusSection.split(/\n/)[0];
                    statusTxt = firstLine
                        .replace(/^[-*•]\s*/, "") // Remove bullet points
                        .replace(/\*\*([^*]+)\*\*/, "$1") // Remove bold formatting
                        .replace(/:\s*$/, "") // Remove trailing colon
                        .trim();
                }
            }
        }
        
        const phaseTxt = grabLabel(["Phase","Project Phase"]) || "";
        let progressTxt = grabLabel(["Progress","Completion"]) || "";
        
        // If no progress from label, try to extract from status section
        if (!progressTxt && statusSection) {
            const progressMatch = statusSection.match(/[-*•]\s*\*\*Progress\*\*[:\s]*(\d+)%/i);
            if (progressMatch) {
                progressTxt = progressMatch[1] + "%";
            }
        }
        
        // Try to extract progress from overview section (GitHub format)
        if (!progressTxt) {
            const overviewSection = grabSection(["PROJECT OVERVIEW", "Project Overview", "Overview"]);
            if (overviewSection) {
                const progressMatch = overviewSection.match(/\*\*Status:\*\*\s*[^0-9]*(\d+)%/i);
                if (progressMatch) {
                    progressTxt = progressMatch[1] + "%";
                }
            }
        }
        
        const lastUpdated = grabLabel(["Last Updated","Updated"]) || null;

        const listFromSec = (sec) => !sec ? [] :
            sec.split(/\n/).map(l => l.trim())
               .filter(l => /^[-*+•✅🔄]\s+/.test(l)) // Handle checkmarks and arrows
               .map(l => l.replace(/^[-*+•✅🔄]\s+/, "").replace(/\*\*([^*]+)\*\*/, "$1").trim())
               .filter(l => l.length > 0 && !l.startsWith('#'));

        // Try section-based first, then label-based
        let keyFeatures = listFromSec(grabSection(["Key Features","Features", "COMPLETED FEATURES", "Completed Features"]));
        let technical = listFromSec(grabSection(["Technical Stack","Technical","Tech Stack","Technology","Stack"]));
        
        // If no features from sections, try to find them after labels
        if (keyFeatures.length === 0) {
            const featuresMatch = text.match(/Key Features:\s*\n((?:[-*+•]\s+[^\n]+\n?)*)/i);
            if (featuresMatch) {
                keyFeatures = listFromSec(featuresMatch[1]);
            }
        }
        
        if (technical.length === 0) {
            // Look for Technical Stack label (not in a section)
            const techMatch = text.match(/Technical Stack:\s*\n((?:[-*+•]\s+[^\n]+\n?)*)/i);
            if (techMatch && !text.includes('## Technical Stack')) {
                technical = listFromSec(techMatch[1]);
            }
        }
        
        // Try to extract tech stack from overview section (GitHub format)
        if (technical.length === 0) {
            const overviewSection = grabSection(["PROJECT OVERVIEW", "Project Overview", "Overview"]);
            if (overviewSection) {
                const techMatch = overviewSection.match(/\*\*Tech Stack:\*\*\s*([^\n]+)/i);
                if (techMatch) {
                    technical = [techMatch[1].trim()];
                }
            }
        }

        const progressMatch = progressTxt.match(/(\d+)\s*%/);
        const progress = progressMatch ? Number(progressMatch[1]) : (Number(progressTxt) || null);

        return {
            title: title || "",
            overview: overview || "",
            status: statusTxt || "",
            phase: phaseTxt || "",
            progress: progress,
            lastUpdated: lastUpdated || null,
            keyFeatures: keyFeatures || [],
            technical: technical || []
        };
    }

    /**
     * Normalize project fields to fill sensible defaults and clamp progress
     * @param {Object} p - Project data object
     * @returns {Object} Normalized project data
     */
    normalizeProjectFields(p) {
        const out = { ...p };
        out.name = out.name || out.title || out.id || "Untitled Project";

        // Handle status - preserve existing status structure if it exists
        if (out.status && typeof out.status === 'object') {
            // Status is already an object, preserve it
            if (!out.status.phase && out.status.phase !== '') {
                out.status.phase = "Unknown";
            }
        } else {
            // Legacy status handling
            const s = (out.status || "").toString().toLowerCase();
            if (!s.trim()) {
                out.status = { phase: "Unknown", progress: 0 };
            } else if (s.includes("active") || s.includes("progress") || s.includes("build")) {
                out.status = { phase: "Active", progress: out.progress || 0 };
            } else if (s.includes("paused") || s.includes("hold")) {
                out.status = { phase: "Paused", progress: out.progress || 0 };
            } else if (s.includes("done") || s.includes("complete") || s.includes("production ready")) {
                out.status = { phase: "Complete", progress: out.progress || 100 };
            } else if (s.includes("unknown")) {
                out.status = { phase: "Unknown", progress: out.progress || 0 };
            } else {
                // Keep the original status string as phase
                out.status = { phase: out.status || "Unknown", progress: out.progress || 0 };
            }
        }

        // Ensure status object exists
        if (!out.status) {
            out.status = { phase: "Unknown", progress: 0 };
        }

        // Ensure phase exists
        if (!out.status.phase) {
            out.status.phase = "Unknown";
        }

        // Ensure progress is a number
        if (typeof out.status.progress !== "number" || isNaN(out.status.progress)) {
            out.status.progress = 0;
        }
        out.status.progress = Math.max(0, Math.min(100, Math.round(out.status.progress)));

        out.lastUpdatedRaw = out.lastUpdated || null;

        out.keyFeatures = Array.isArray(out.keyFeatures) ? out.keyFeatures : [];
        out.technical   = Array.isArray(out.technical)   ? out.technical   : [];

        // Fallback overview: first paragraph after H1 if Overview section is missing
        if (!out.overview && typeof p.markdown === "string") {
            const lines = p.markdown.split(/\n/);
            const i = lines.findIndex(l => /^#\s+/.test(l));
            const paras = lines.slice(i + 1).join("\n").split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
            if (paras[0]) out.overview = paras[0];
        }
        return out;
    }

    /**
     * Get fallback structured data for failed fetches
     * @param {string} projectName - Name of the project
     * @param {string} reason - Reason for fallback
     * @returns {Object} Fallback structured data
     */
    getFallbackStructuredData(projectName, reason = 'error') {
        let overview = 'Project data not available from GitHub';
        
        if (reason === 'private') {
            overview = 'Private repository - requires authentication to access project data';
        }
        
        return {
            name: projectName,
            overview: overview,
            status: { phase: 'Unknown', progress: 0 },
            features: {
                completed: [],
                inProgress: [],
                pending: []
            },
            technical: [],
            keyFeatures: []
        };
    }

    /**
     * Get project data in legacy format (backward compatibility)
     * @param {string} query - Project identifier, title, or alias
     * @returns {Object|null} Project data in legacy format
     */
    getProjectData(query) {
        if (!this.initialized) {
            console.warn('GitHubDataManager not initialized. Call initialize() first.');
            return null;
        }
        
        const id = this._resolveProjectId(query);
        if (!id) {
            console.warn("[Projects] No match for query:", query, "Known IDs:", [...this._index.byId.keys()]);
            return null;
        }
        
        return this.dataCache.get(id) || null;
    }

    /**
     * Get project by ID (exact match only)
     * @param {string} id - Project ID
     * @returns {Object|null} Project data in legacy format
     */
    getById(id) {
        if (!this.initialized) {
            console.warn('GitHubDataManager not initialized. Call initialize() first.');
            return null;
        }
        
        return this.dataCache.get(id) || null;
    }

    /**
     * Get project by alias
     * @param {string} alias - Project alias
     * @returns {Object|null} Project data in legacy format
     */
    getByAlias(alias) {
        if (!this.initialized) {
            console.warn('GitHubDataManager not initialized. Call initialize() first.');
            return null;
        }
        
        const targetId = this._index.aliases.get(alias);
        if (!targetId) {
            return null;
        }
        
        return this.dataCache.get(targetId) || null;
    }

    /**
     * Get project by title
     * @param {string} title - Project title
     * @returns {Object|null} Project data in legacy format
     */
    getByTitle(title) {
        if (!this.initialized) {
            console.warn('GitHubDataManager not initialized. Call initialize() first.');
            return null;
        }
        
        const projectData = this._index.byTitle.get(title);
        if (!projectData) {
            return null;
        }
        
        return this.dataCache.get(projectData.id) || null;
    }

    /**
     * Get project data in new structured format
     * @param {string} query - Project identifier, title, or alias
     * @returns {Object|null} Project data in structured format
     */
    getProjectById(query) {
        if (!this.initialized) {
            console.warn('GitHubDataManager not initialized. Call initialize() first.');
            return null;
        }
        
        const id = this._resolveProjectId(query);
        if (!id) {
            console.warn("[Projects] No match for query:", query, "Known IDs:", [...this._index.byId.keys()]);
            return null;
        }
        
        return this.sessionData.get(id) || null;
    }

    /**
     * Get all projects in legacy format (backward compatibility)
     * @returns {Array} Array of project data in legacy format
     */
    getAllProjects() {
        if (!this.initialized) {
            console.warn('GitHubDataManager not initialized. Call initialize() first.');
            return [];
        }
        
        const projects = [];
        
        // Convert session data (new format) to legacy format
        for (const [id, projectData] of this.sessionData) {
            const legacyData = this.convertToLegacyFormat(projectData);
            projects.push(legacyData);
        }
        
        // Also include any cached data (for backward compatibility)
        for (const [id, projectData] of this.dataCache) {
            // Skip if we already have this project from session data
            if (!projects.find(p => p.id === id)) {
                // Ensure each project has id and title fields
                if (!projectData.id && projectData.name) {
                    projectData.id = this.slugify(projectData.name);
                }
                if (!projectData.title && projectData.name) {
                    projectData.title = projectData.name;
                }
                projects.push(projectData);
            }
        }
        
        console.log(`getAllProjects: returning ${projects.length} projects`);
        return projects;
    }

    /**
     * Get all projects in new structured format
     * @returns {Array} Array of project data in structured format
     */
    getAllProjectsStructured() {
        if (!this.initialized) {
            console.warn('GitHubDataManager not initialized. Call initialize() first.');
            return [];
        }
        
        return Array.from(this.sessionData.values());
    }

    /**
     * Clear session data and force refresh from GitHub
     */
    async refreshProjectData() {
        console.log('Refreshing project data from GitHub...');
        
        // Clear all caches
        this.dataCache.clear();
        this.sessionData.clear();
        this.initialized = false;
        
        // Clear session storage
        try {
            sessionStorage.removeItem('githubProjectData');
        } catch (error) {
            console.warn('Failed to clear session storage:', error);
        }
        
        // Re-initialize
        await this.initialize();
    }

    /**
     * Check if session data exists and is valid
     * @returns {boolean} True if session data is available
     */
    hasSessionData() {
        return this.sessionData.size > 0;
    }

    /**
     * Get session data statistics
     * @returns {Object} Statistics about session data
     */
    getSessionStats() {
        return {
            totalProjects: this.sessionData.size,
            hasData: this.hasSessionData(),
            initialized: this.initialized,
            cacheSize: this.dataCache.size
        };
    }

    /**
     * Ensure project has full details loaded from markdown file
     * @param {string} idOrAlias - Project ID or alias
     * @returns {Object|null} Project with full details or null if not found
     */
    async ensureDetails(idOrAlias) {
        const id = this._resolveProjectId(idOrAlias);
        const proj = id ? this._index.byId.get(id) : null;
        if (!proj) return null;

        const needsDetails =
            !proj._detailsLoaded ||
            proj.overview === 'Project overview not available' ||
            (!Array.isArray(proj.features?.completed) || proj.features.completed.length === 0) &&
            (!Array.isArray(proj.features?.inProgress) || proj.features.inProgress.length === 0) &&
            (!Array.isArray(proj.features?.pending) || proj.features.pending.length === 0);

        if (needsDetails) {
            console.log(`Fetching detailed data for project: ${id}`);
            
            // Lookup repo info using explicit mapping
            const repoInfo = this._projectRepo?.get(id) || null;
            if (!repoInfo) {
                console.warn('[details] no-repo', { id });
                return proj; // DO NOT set _detailsLoaded
            }
            
            // Try to fetch and merge details
            const success = await this._fetchAndMergeDetails(proj, repoInfo);
            if (success) {
                proj._detailsLoaded = true;
                this._saveToSession();
            }
        }
        return proj;
    }

    /**
     * Fetch and merge detailed project data from markdown file
     * @param {Object} proj - Project object to enrich
     * @param {Object} repoInfo - Repository information {owner, repo, basePath}
     * @returns {boolean} True if successful, false otherwise
     */
    async _fetchAndMergeDetails(proj, repoInfo) {
        try {
            // Try candidate paths in order - lowercase first to prevent initial 404
            const candidates = [
                { path: "project_details.md", url: `https://raw.githubusercontent.com/${repoInfo.owner}/${repoInfo.repo}/main/project_details.md` },
                { path: "ProjectDetails.md",  url: `https://raw.githubusercontent.com/${repoInfo.owner}/${repoInfo.repo}/main/ProjectDetails.md` }
            ];
            
            for (const candidate of candidates) {
                console.log(`[ProjectStatus] trying`, { id: proj.id, path: candidate.path, url: candidate.url });
                
                const res = await fetch(candidate.url, { cache: 'no-store' });
                if (res.ok) {
                    const md = await res.text();
                    const parsed = this.parseProjectMarkdown(md);
                    const normalized = this.normalizeProjectFields(parsed);
                    this._mergeProjectData(proj, normalized);
                    console.log('[ProjectStatus] used', { id: proj.id, path: candidate.path });
                    return true;
                }
            }
            
            // If none succeed, log warning and return false
            console.warn('[ProjectStatus] no-file-found', { id: proj.id, repoInfo });
            return false;
            
        } catch (error) {
            console.error(`[ProjectStatus] Error fetching detailed data for ${proj.id}:`, error);
            return false;
        }
    }

    /**
     * Merge parsed markdown data into existing project object
     * @param {Object} proj - Existing project object
     * @param {Object} parsedData - Parsed data from markdown
     */
    _mergeProjectData(proj, parsedData) {
        // Merge title/name
        if (parsedData.title && !proj.title) {
            proj.title = parsedData.title;
        }
        if (parsedData.name && !proj.name) {
            proj.name = parsedData.name;
        }
        
        // Merge overview/description
        if (parsedData.overview && parsedData.overview !== 'Project overview not available') {
            proj.overview = parsedData.overview;
        }
        
        // Merge status information
        if (parsedData.status) {
            if (!proj.status) proj.status = {};
            if (typeof parsedData.status === 'string') {
                proj.status.phase = parsedData.status;
            } else {
                proj.status = parsedData.status;
            }
        }
        
        // Merge phase
        if (parsedData.phase) {
            if (!proj.status) proj.status = {};
            proj.status.phase = parsedData.phase;
        }
        
        // Merge progress
        if (typeof parsedData.progress === 'number') {
            if (!proj.status) proj.status = {};
            proj.status.progress = parsedData.progress;
        }
        
        // Merge last updated
        if (parsedData.lastUpdatedRaw) {
            proj.lastUpdated = parsedData.lastUpdatedRaw;
        }
        
        // Merge key features
        if (Array.isArray(parsedData.keyFeatures) && parsedData.keyFeatures.length > 0) {
            proj.keyFeatures = parsedData.keyFeatures;
        }
        
        // Merge technical stack
        if (Array.isArray(parsedData.technical) && parsedData.technical.length > 0) {
            proj.technical = parsedData.technical;
        }
        
        // Update the legacy format cache as well
        const legacyData = this.convertToLegacyFormat(proj);
        this.dataCache.set(proj.id, legacyData);
        
        // Update session data
        this.sessionData.set(proj.id, proj);
        
        console.log('[ProjectStatus] Project data merged successfully:', {
            id: proj.id,
            title: proj.title,
            status: proj.status,
            features: proj.keyFeatures?.length || 0,
            tech: proj.technical?.length || 0
        });
    }

    /**
     * Invalidate cache for a specific project to force re-fetch
     * @param {string} idOrAlias - Project ID or alias
     */
    invalidateCacheFor(idOrAlias) {
        const id = this._resolveProjectId(idOrAlias);
        const proj = id ? this._index.byId.get(id) : null;
        
        if (proj) {
            console.log(`Invalidating cache for project: ${id}`);
            proj._detailsLoaded = false;
            delete proj._detailsSource; // Remove source tracking if it exists
            this._saveToSession();
        }
    }

    /**
     * Save current session data to sessionStorage
     */
    _saveToSession() {
        try {
            const sessionData = Object.fromEntries(this.sessionData);
            sessionStorage.setItem('githubProjectData', JSON.stringify(sessionData));
            console.log('Session data saved to sessionStorage');
        } catch (error) {
            console.warn('Failed to save session data:', error);
        }
    }

    // Method to update GitHub username (useful for different users)
    updateGitHubUsername(username) {
        this.repositories.forEach(repo => {
            repo.owner = username;
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubDataManager;
}

// Global compatibility for backwards compatibility
window.ProjectDataManager = GitHubDataManager;
