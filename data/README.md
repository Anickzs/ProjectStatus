# Project Documentation System

## Overview
This directory contains individual markdown files for each project in your ProjectStatus web application. Each project should have its own `.md` file named after the project ID.

## How It Works
1. **Project-Specific Files**: Each project gets its own markdown file (e.g., `BusinessLoclAi.md`, `DIYAPP.md`)
2. **Consistent Structure**: All project files follow the same format for easy parsing
3. **Automatic Discovery**: The web app automatically finds and processes these files
4. **Fallback Support**: If no markdown file exists, the system generates default data

## File Naming Convention
- Use the exact project ID as the filename
- Example: `BusinessLoclAi.md` for project ID "BusinessLoclAi"
- File extension must be `.md`

## Required Sections
Each project markdown file should include:

### Project Overview
- Brief description of what the project does

### Project Status
- Current phase (Planning, Development, Testing, etc.)
- Progress percentage
- Target launch date

### Completed Features
- List of completed features with checkboxes `[x]`

### In Progress
- List of features currently being worked on `[ ]`

### Pending Tasks
- List of upcoming tasks `[ ]`

### Technical Stack
- Frontend framework
- Backend technology
- Database
- Other key technologies

### Key Features
- Numbered list of main features

### Notes
- Any additional information or context

## Example Structure
```markdown
# Project Name

## Project Overview
Description here...

## Project Status
- **Current Phase**: Development
- **Progress**: 50%
- **Target Launch**: Q2 2024

## Completed Features
- [x] Feature 1
- [x] Feature 2

## In Progress
- [ ] Feature 3

## Pending Tasks
- [ ] Feature 4
- [ ] Feature 5

## Technical Stack
- **Frontend**: React
- **Backend**: Node.js

## Key Features
1. Feature description
2. Feature description

## Notes
Additional context...
```

## Benefits
- **Centralized Documentation**: All project info in one place
- **Easy Updates**: Modify markdown files to update project status
- **Version Control**: Track changes to project documentation
- **Consistent Format**: Standardized structure across all projects
- **Automatic Processing**: Web app automatically reads and displays the data

## Adding New Projects
1. Create a new markdown file with the project ID as the filename
2. Follow the required structure above
3. The web app will automatically detect and process the new file
4. No code changes needed in the web application

## Troubleshooting
- **Project Not Found**: Ensure the markdown filename matches the project ID exactly
- **No Data Displayed**: Check that the markdown file follows the required structure
- **Syntax Errors**: Validate markdown syntax in your editor
