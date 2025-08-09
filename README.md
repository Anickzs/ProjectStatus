# ProjectStatus

A comprehensive project management and analysis tool with web interface and Python analysis capabilities.

## 📁 Project Structure

```
ProjectStatus/
├── web-app/                 # Web application files
│   ├── index.html          # Main dashboard
│   ├── project-detail.html # Project detail view
│   ├── tasks.html          # Task management view
│   ├── styles.css          # Main stylesheet
│   ├── script.js           # Main application logic
│   ├── project-detail.js   # Project detail functionality
│   ├── tasks.js            # Task management functionality
│   ├── modules/            # JavaScript modules
│   │   ├── EventManager.js
│   │   ├── ModalManager.js
│   │   ├── NotificationManager.js
│   │   ├── ProjectDataManager.js
│   │   └── UIRenderer.js
│   └── utils/              # Utility functions
│       ├── data-utils.js
│       └── dom-utils.js
├── python-tools/            # Python analysis tools
│   ├── ai_project_scanner.py
│   └── project_analyzer.py
├── data/                    # Data and configuration files
│   ├── project_analysis.json
│   ├── ai_project_analysis.json
│   ├── current_dir_scan.json
│   ├── test_scan_results.json
│   ├── BusinessLoclAi.md   # Project-specific documentation
│   ├── DIYAPP.md           # Project-specific documentation
│   └── README.md           # Documentation system guide
├── docs/                    # Documentation
│   ├── WEBSITE_FLOW_STRUCTURE.md
│   └── PROJECT_ANALYSIS_REPORT.md
└── README.md               # This file
```

## 🚀 Quick Start

### Web Application
1. Open `web-app/index.html` in your browser
2. Navigate through the dashboard, project details, and task management

### Python Analysis Tools
1. Navigate to `python-tools/`
2. Run analysis scripts as needed:
   ```bash
   cd python-tools
   python ai_project_scanner.py
   python project_analyzer.py
   ```

## 📋 Features

- **Web Dashboard**: Interactive project status overview
- **Project Management**: Detailed project tracking and analysis
- **Task Management**: Comprehensive task organization
- **AI Analysis**: Automated project scanning and analysis
- **Modular Architecture**: Clean separation of concerns
- **Project Documentation**: Individual markdown files for each project

## 🔧 Development

The project uses a modular JavaScript architecture with separate Python tools for analysis. The web application is self-contained and can run locally without additional dependencies.

## 📊 Data Files

Analysis results and project data are stored in the `data/` directory as JSON files for easy access and processing.

## 📝 Project Documentation System

Each project now has its own markdown file in the `data/` directory (e.g., `BusinessLoclAi.md`, `DIYAPP.md`). These files contain:

- Project overview and status
- Completed, in-progress, and pending tasks
- Technical stack information
- Timeline and key features

### Adding New Projects
1. Create a new `.md` file in the `data/` directory
2. Name it after the project ID (e.g., `MyProject.md`)
3. Follow the template structure in `data/README.md`
4. The web app automatically detects and processes new files

### Benefits
- **Centralized Documentation**: All project info in one place
- **Easy Updates**: Modify markdown files to update project status
- **Version Control**: Track changes to project documentation
- **No Code Changes**: Add projects without modifying the web application

See `data/README.md` for detailed documentation on the markdown system.
