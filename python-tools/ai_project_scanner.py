#!/usr/bin/env python3
"""
AI Project Scanner Agent
Scans through project folders for markdown files and extracts structured project information.
"""

import os
import json
import re
from pathlib import Path
from datetime import datetime
import argparse
from typing import Dict, List, Any, Optional

class AIProjectScanner:
    def __init__(self, projects_root: str = "../"):
        self.projects_root = Path(projects_root)
        self.projects_data = {}
        
    def scan_for_projects(self) -> Dict[str, Any]:
        """Scan for project folders and their markdown files."""
        print("🔍 Scanning for project folders...")
        
        # Known project folders based on the analysis
        known_projects = [
            "DIYAPP", "BusinessLoclAi", "AiAutoAgency", 
            "CryptoTradingBot", "StockTradingBot"
        ]
        
        for project_name in known_projects:
            project_path = self.projects_root / project_name
            if project_path.exists() and project_path.is_dir():
                print(f"📁 Found project: {project_name}")
                self.projects_data[project_name] = self.analyze_project_folder(project_path, project_name)
            else:
                print(f"⚠️  Project folder not found: {project_name}")
                
        return self.projects_data
    
    def analyze_project_folder(self, project_path: Path, project_name: str) -> Dict[str, Any]:
        """Analyze a single project folder for markdown files and extract information."""
        project_data = {
            "name": project_name,
            "description": "",
            "short_description": "",
            "status": "Not Started",
            "progress": 0,
            "completed_features": [],
            "in_progress_features": [],
            "todo_features": [],
            "tech_stack": [],
            "key_achievements": [],
            "next_steps": [],
            "business_model": "",
            "market_analysis": "",
            "risks": [],
            "timeline": "",
            "last_updated": datetime.now().isoformat(),
            "markdown_files": []
        }
        
        # Find all markdown files in the project folder
        md_files = list(project_path.glob("**/*.md"))
        md_files = [f for f in md_files if "node_modules" not in str(f)]
        
        print(f"   📄 Found {len(md_files)} markdown files")
        
        for md_file in md_files:
            print(f"   📖 Analyzing: {md_file.name}")
            file_data = self.parse_markdown_file(md_file)
            project_data["markdown_files"].append({
                "filename": md_file.name,
                "path": str(md_file.relative_to(self.projects_root)),
                "data": file_data
            })
            
            # Merge information from all markdown files
            self.merge_project_data(project_data, file_data)
        
        # Calculate overall progress based on completed vs total features
        project_data["progress"] = self.calculate_progress(project_data)
        
        # Generate clean, concise description for UI cards
        project_data["short_description"] = self.generate_short_description(project_data)
        
        return project_data
    
    def parse_markdown_file(self, file_path: Path) -> Dict[str, Any]:
        """Parse a markdown file and extract structured information."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"   ❌ Error reading {file_path}: {e}")
            return {}
        
        parsed_data = {
            "title": "",
            "description": "",
            "status": "",
            "progress": 0,
            "completed_features": [],
            "in_progress_features": [],
            "todo_features": [],
            "tech_stack": [],
            "key_achievements": [],
            "next_steps": [],
            "business_model": "",
            "market_analysis": "",
            "risks": [],
            "timeline": ""
        }
        
        # Extract title from first heading
        title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
        if title_match:
            parsed_data["title"] = title_match.group(1).strip()
        
        # Extract description from content
        lines = content.split('\n')
        description_lines = []
        in_description = False
        
        for line in lines:
            if line.startswith('##') or line.startswith('---'):
                if in_description:
                    break
            elif line.strip() and not line.startswith('#'):
                if not in_description:
                    in_description = True
                description_lines.append(line.strip())
        
        if description_lines:
            parsed_data["description"] = ' '.join(description_lines[:3])  # First 3 lines
        
        # Extract features by status
        self.extract_features_by_status(content, parsed_data)
        
        # Extract tech stack
        self.extract_tech_stack(content, parsed_data)
        
        # Extract business information
        self.extract_business_info(content, parsed_data)
        
        return parsed_data
    
    def extract_features_by_status(self, content: str, parsed_data: Dict[str, Any]):
        """Extract features categorized by their status."""
        # Look for completed features
        completed_patterns = [
            r'✅\s*(.+)',
            r'- \[x\]\s*(.+)',
            r'COMPLETED[:\s]+(.+)',
            r'DONE[:\s]+(.+)'
        ]
        
        for pattern in completed_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE)
            parsed_data["completed_features"].extend([m.strip() for m in matches])
        
        # Look for in-progress features
        in_progress_patterns = [
            r'🔄\s*(.+)',
            r'IN PROGRESS[:\s]+(.+)',
            r'WORKING ON[:\s]+(.+)'
        ]
        
        for pattern in in_progress_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE)
            parsed_data["in_progress_features"].extend([m.strip() for m in matches])
        
        # Look for todo features
        todo_patterns = [
            r'- \[ \]\s*(.+)',
            r'TODO[:\s]+(.+)',
            r'NEEDS WORK[:\s]+(.+)',
            r'NEXT STEPS[:\s]+(.+)'
        ]
        
        for pattern in todo_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE)
            parsed_data["todo_features"].extend([m.strip() for m in matches])
    
    def extract_tech_stack(self, content: str, parsed_data: Dict[str, Any]):
        """Extract technology stack information."""
        tech_patterns = [
            r'Tech Stack[:\s]+(.+)',
            r'Technologies[:\s]+(.+)',
            r'Built with[:\s]+(.+)',
            r'Stack[:\s]+(.+)'
        ]
        
        for pattern in tech_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                # Split by common delimiters and clean up
                tech_items = re.split(r'[,•\n]+', match)
                for tech in tech_items:
                    tech = tech.strip()
                    if tech and len(tech) > 2:
                        parsed_data["tech_stack"].append(tech)
    
    def extract_business_info(self, content: str, parsed_data: Dict[str, Any]):
        """Extract business-related information."""
        # Business model
        business_patterns = [
            r'Business Model[:\s]+(.+)',
            r'Revenue Model[:\s]+(.+)',
            r'Pricing[:\s]+(.+)'
        ]
        
        for pattern in business_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE)
            if matches:
                parsed_data["business_model"] = matches[0].strip()
                break
        
        # Market analysis
        market_patterns = [
            r'Market Analysis[:\s]+(.+)',
            r'Market Opportunity[:\s]+(.+)',
            r'Industry Trends[:\s]+(.+)'
        ]
        
        for pattern in market_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE)
            if matches:
                parsed_data["market_analysis"] = matches[0].strip()
                break
    
    def merge_project_data(self, project_data: Dict[str, Any], file_data: Dict[str, Any]):
        """Merge information from multiple markdown files into project data."""
        # Merge features
        if file_data.get("completed_features"):
            project_data["completed_features"].extend(file_data["completed_features"])
        
        if file_data.get("in_progress_features"):
            project_data["in_progress_features"].extend(file_data["in_progress_features"])
        
        if file_data.get("todo_features"):
            project_data["todo_features"].extend(file_data["todo_features"])
        
        # Merge tech stack
        if file_data.get("tech_stack"):
            project_data["tech_stack"].extend(file_data["tech_stack"])
        
        # Merge other fields if not already set
        if not project_data.get("description") and file_data.get("description"):
            project_data["description"] = file_data["description"]
        
        if not project_data.get("business_model") and file_data.get("business_model"):
            project_data["business_model"] = file_data["business_model"]
        
        if not project_data.get("market_analysis") and file_data.get("market_analysis"):
            project_data["market_analysis"] = file_data["market_analysis"]
    
    def calculate_progress(self, project_data: Dict[str, Any]) -> int:
        """Calculate overall project progress based on completed features."""
        total_features = (
            len(project_data["completed_features"]) +
            len(project_data["in_progress_features"]) +
            len(project_data["todo_features"])
        )
        
        if total_features == 0:
            return 0
        
        # Weight completed features higher than in-progress
        completed_weight = len(project_data["completed_features"]) * 1.0
        in_progress_weight = len(project_data["in_progress_features"]) * 0.5
        
        progress = int(((completed_weight + in_progress_weight) / total_features) * 100)
        return min(progress, 100)
    
    def determine_status(self, project_data: Dict[str, Any]) -> str:
        """Determine project status based on progress and features."""
        progress = project_data["progress"]
        
        if progress >= 80:
            return "Completed"
        elif progress >= 50:
            return "In Progress"
        elif progress >= 20:
            return "Planning"
        else:
            return "Not Started"
    
    def generate_short_description(self, project_data: Dict[str, Any]) -> str:
        """Generate a clean, concise description for project cards."""
        project_name = project_data["name"]
        
        # Custom descriptions for known projects
        if project_name == "DIYAPP":
            return "Next.js 14 DIY project planning app with build planner, quick builds, and responsive design. Features unit conversion, tool filtering, and shopping list generation."
        elif project_name == "BusinessLoclAi":
            return "Canadian on-premise LLM deployment service for businesses. Specializing in private, secure AI assistants with local hosting for privacy and compliance."
        elif project_name == "AiAutoAgency":
            return "AI automation agency helping SMBs implement custom AI solutions. Focus on chatbots, workflow automation, and consulting with value-based pricing."
        elif project_name == "CryptoTradingBot":
            return "Automated cryptocurrency trading system with sentiment analysis, backtesting, and risk management. Research phase complete with comprehensive analysis."
        elif project_name == "StockTradingBot":
            return "Automated stock trading system with technical analysis, backtesting, and risk management. Designed for algorithmic trading strategies."
        else:
            # Fallback: create description from available data
            if project_data.get("tech_stack"):
                tech = ", ".join(project_data["tech_stack"][:3])  # First 3 tech items
                return f"{project_name} project using {tech}."
            elif project_data.get("description"):
                # Clean up the description and limit length
                desc = project_data["description"]
                # Remove markdown formatting and limit to 150 characters
                desc = re.sub(r'\*\*([^*]+)\*\*', r'\1', desc)  # Remove bold
                desc = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', desc)  # Remove links
                desc = re.sub(r'[^\w\s,.-]', '', desc)  # Remove special chars
                desc = desc[:150].strip()
                if len(desc) > 147:
                    desc = desc[:147] + "..."
                return desc
            else:
                return f"{project_name} project in development."
    
    def generate_report(self) -> str:
        """Generate a human-readable report of all projects."""
        report = "# 📊 AI Project Scanner Report\n\n"
        report += f"*Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n\n"
        
        for project_name, project_data in self.projects_data.items():
            report += f"## 🚀 {project_name}\n\n"
            report += f"**Status:** {project_data['status']}\n"
            report += f"**Progress:** {project_data['progress']}%\n"
            report += f"**Description:** {project_data['description']}\n\n"
            
            if project_data['completed_features']:
                report += "### ✅ Completed Features\n"
                for feature in project_data['completed_features'][:5]:  # Show first 5
                    report += f"- {feature}\n"
                report += "\n"
            
            if project_data['in_progress_features']:
                report += "### 🔄 In Progress\n"
                for feature in project_data['in_progress_features'][:3]:  # Show first 3
                    report += f"- {feature}\n"
                report += "\n"
            
            if project_data['next_steps']:
                report += "### 🎯 Next Steps\n"
                for step in project_data['next_steps'][:3]:  # Show first 3
                    report += f"- {step}\n"
                report += "\n"
            
            report += "---\n\n"
        
        return report
    
    def save_to_json(self, output_file: str = "ai_project_analysis.json"):
        """Save the analyzed data to a JSON file."""
        # Update status for all projects
        for project_data in self.projects_data.values():
            project_data["status"] = self.determine_status(project_data)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.projects_data, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Project data saved to {output_file}")
    
    def run_scan(self, output_file: str = "ai_project_analysis.json") -> Dict[str, Any]:
        """Run the complete project scanning process."""
        print("🤖 AI Project Scanner Agent Starting...\n")
        
        # Scan for projects
        projects_data = self.scan_for_projects()
        
        # Generate and display report
        report = self.generate_report()
        print("\n" + "="*60)
        print("📋 SCANNING REPORT")
        print("="*60)
        print(report)
        
        # Save to JSON
        self.save_to_json(output_file)
        
        print(f"\n✅ Scan complete! Found {len(projects_data)} projects.")
        return projects_data

def main():
    parser = argparse.ArgumentParser(description="AI Project Scanner Agent")
    parser.add_argument("--root", default="../", help="Root directory to scan for projects")
    parser.add_argument("--output", default="ai_project_analysis.json", help="Output JSON file")
    
    args = parser.parse_args()
    
    scanner = AIProjectScanner(args.root)
    projects_data = scanner.run_scan(args.output)
    
    # Print summary
    print("\n📊 PROJECT SUMMARY:")
    for project_name, data in projects_data.items():
        print(f"  {project_name}: {data['progress']}% - {data['status']}")

if __name__ == "__main__":
    main()
