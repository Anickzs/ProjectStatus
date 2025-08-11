# ProjectStatus

A comprehensive project management and analysis tool with web interface and Python analysis capabilities.

## 📁 Project Structure

```
ProjectStatus/
├── web-app/                 # Web application files
│   ├── index.html          # Main dashboard
│   ├── project-detail.html # Project detail view
│   ├── styles.css          # Main stylesheet
│   ├── script.js           # Main application logic
│   ├── project-detail.js   # Project detail functionality
│   ├── modules/            # JavaScript modules
│   │   ├── EventManager.js
│   │   ├── GitHubDataManager.js
│   │   ├── ModalManager.js
│   │   ├── NotificationManager.js
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
│   └── PROJECTS.md         # All project documentation
├── docs/                    # Documentation
│   ├── TECHNICAL_DOCUMENTATION.md
│   ├── DEVELOPMENT_LOG.md
│   ├── GITHUB_INTEGRATION.md
│   └── ID_NORMALIZATION.md
└── README.md               # This file
```

## 🚀 Quick Start

### Web Application
🎯 How to Use:
   ```
Option 1 - Custom Server (Recommended):
   ./start-server.sh

Option 2 - Direct Command:
   cd web-app && python3 server.py 8000

Option 3 - Standard Python Server:
   cd web-app && python3 -m http.server 8000

   ```

2. **Open the dashboard**: Navigate to `http://localhost:8000/index.html`

3. **Test GitHub integration**: Visit `http://localhost:8000/test-github.html`

### Python Analysis Tools
1. Navigate to `python-tools/`
2. Run analysis scripts as needed:
   ```bash
   cd python-tools
   python ai_project_scanner.py
   python project_analyzer.py
   ```

## 📋 Features

- **Web Dashboard**: Interactive project status overview with GitHub integration
- **Project Management**: Detailed project tracking and analysis
- **Task Management**: Comprehensive task organization
- **AI Analysis**: Automated project scanning and analysis
- **Modular Architecture**: Clean separation of concerns
- **Real-time Updates**: Changes to project files are reflected immediately
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean, professional interface with animations
- **No Local Dependencies**: Fully deployable without local data files

## 🔧 Development

The project uses a modular JavaScript architecture with separate Python tools for analysis. The web application is self-contained and can run locally without additional dependencies.

### Python Tools Requirements
- Python 3.6+
- No external dependencies required (uses standard library)

### Web Application Architecture
- Vanilla JavaScript with GitHub API integration
- All project data comes from GitHub repositories containing `ProjectDetails.md` files
- Session-based caching for improved performance

### Testing

The project includes comprehensive end-to-end tests using Playwright:

```bash
# Run all e2e tests
cd e2e-tests
./run-project-detail-tests.sh

# Run specific test suites
./run-project-detail-tests.sh --features    # Project detail features
./run-project-detail-tests.sh --data        # Data population validation
./run-project-detail-tests.sh --cards       # Basic project card functionality
```

**Test Coverage:**
- ✅ Project detail page functionality
- ✅ Task management and categorization
- ✅ Project timeline and activity log
- ✅ File management and uploads
- ✅ Navigation and mobile responsiveness
- ✅ Keyboard shortcuts and accessibility
- ✅ Data population from GitHub
- ✅ Error handling and edge cases

See `e2e-tests/README.md` for detailed testing documentation.

## 📊 Data Files

Analysis results and project data are stored in the `data/` directory as JSON files for easy access and processing.

## 📝 Project Documentation System

### Overview
The `data/PROJECTS.md` file contains individual project documentation for each project in your ProjectStatus web application. Each project has its own section with consistent formatting.

### How It Works
1. **Project-Specific Sections**: Each project gets its own section in the PROJECTS.md file
2. **Consistent Structure**: All project sections follow the same format for easy parsing
3. **Automatic Discovery**: The web app automatically finds and processes these sections
4. **Fallback Support**: If no project data exists, the system generates default data

### Required Sections for Each Project
Each project section should include:

#### Project Overview
- Brief description of what the project does

#### Project Status
- Current phase (Planning, Development, Testing, etc.)
- Progress percentage
- Target launch date

#### Completed Features
- List of completed features with checkboxes `[x]`

#### In Progress
- List of features currently being worked on `[ ]`

#### Pending Tasks
- List of upcoming tasks `[ ]`

#### Technical Stack
- Frontend framework
- Backend technology
- Database
- Other key technologies

#### Key Features
- Numbered list of main features

#### Notes
- Any additional information or context

### Benefits
- **Centralized Documentation**: All project info in one place
- **Easy Updates**: Modify PROJECTS.md to update project status
- **Version Control**: Track changes to project documentation
- **Consistent Format**: Standardized structure across all projects
- **Automatic Processing**: Web app automatically reads and displays the data

## 🔧 Troubleshooting

### Common Issues

**Broken Pipe Errors in Terminal**
- These are normal when users close browser tabs or navigate away
- The custom server (`server.py`) handles these gracefully
- No action needed - your application is working correctly

**404 Errors for favicon.ico**
- Fixed by adding inline favicon to HTML files
- No external favicon file needed

**Server Won't Start**
- Ensure you're in the `web-app` directory
- Check if port 8000 is already in use
- Try a different port: `python3 server.py 8001`

### Recent Fixes (✅ Resolved)

**Project Overview Display Issues**
- ✅ Fixed raw markdown display in project overview
- ✅ Added proper HTML formatting for bold text, checkmarks, and line breaks
- ✅ Status now displays correctly from GitHub data

**GitHub Data Parsing Issues**
- ✅ Enhanced markdown parser to handle GitHub's emoji and bold format
- ✅ Fixed status extraction from overview sections
- ✅ Improved progress bar display (80% showing correctly)
- ✅ Technical stack now displays properly

**SES Deprecation Warnings**
- These are from a third-party security library
- Harmless warnings that don't affect functionality
- Can be safely ignored

### Performance Tips
- Use the custom server (`server.py`) for better error handling
- Check `server.log` for detailed request logs
- The application includes session caching for improved performance

## 📚 Documentation

- **Comprehensive Documentation**: See `docs/COMPREHENSIVE_DOCUMENTATION.md` for all technical details, development history, and implementation guides
  - Technical architecture and development details
  - Development log with fixes and implementations
  - GitHub integration setup and configuration
  - ID normalization system implementation
  - Recent fixes and troubleshooting
