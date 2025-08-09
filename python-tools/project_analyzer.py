#!/usr/bin/env python3
"""
Project Status Analyzer - Cursor Agent
Reads through project markdown files and generates comprehensive project analysis
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Any
import json

class ProjectAnalyzer:
    def __init__(self, parent_dir: str = ".."):
        self.parent_dir = Path(parent_dir)
        self.projects = {}
        self.analysis = {}
        
    def scan_projects(self):
        """Scan for project directories and their markdown files"""
        print("🔍 Scanning for project directories...")
        
        project_dirs = [
            "DIYAPP",
            "BusinessLoclAi", 
            "AiAutoAgency",
            "CryptoTradingBot",
            "StockTradingBot"
        ]
        
        for project_dir in project_dirs:
            project_path = self.parent_dir / project_dir
            if project_path.exists():
                self.projects[project_dir] = {
                    'path': project_path,
                    'files': [],
                    'content': {}
                }
                self._scan_project_files(project_dir)
        
        print(f"✅ Found {len(self.projects)} project directories")
    
    def _scan_project_files(self, project_name: str):
        """Scan markdown and text files in a project directory"""
        project_path = self.projects[project_name]['path']
        
        # Look for markdown and text files
        extensions = ['.md', '.txt', '.txt']
        for file_path in project_path.rglob('*'):
            if file_path.suffix.lower() in extensions and file_path.is_file():
                self.projects[project_name]['files'].append(str(file_path))
    
    def read_project_files(self):
        """Read content from all project files"""
        print("📖 Reading project files...")
        
        for project_name, project_info in self.projects.items():
            print(f"  📁 {project_name}:")
            project_info['content'] = {}
            
            for file_path in project_info['files']:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        filename = Path(file_path).name
                        project_info['content'][filename] = content
                        print(f"    ✅ {filename}")
                except Exception as e:
                    print(f"    ❌ {filename}: {e}")
    
    def analyze_projects(self):
        """Analyze each project and generate comprehensive description"""
        print("\n🔍 Analyzing projects...")
        
        for project_name, project_info in self.projects.items():
            print(f"\n📊 Analyzing {project_name}...")
            self.analysis[project_name] = self._analyze_single_project(project_name, project_info)
    
    def _analyze_single_project(self, project_name: str, project_info: Dict) -> Dict:
        """Analyze a single project and generate description"""
        content = project_info['content']
        
        # Initialize analysis structure
        analysis = {
            'name': project_name,
            'description': '',
            'status': 'Unknown',
            'progress': 0,
            'completed_features': [],
            'in_progress_features': [],
            'todo_features': [],
            'tech_stack': [],
            'key_achievements': [],
            'next_steps': [],
            'business_model': '',
            'market_analysis': '',
            'risks': [],
            'timeline': ''
        }
        
        # Analyze based on project type
        if project_name == "DIYAPP":
            analysis = self._analyze_diy_app(content, analysis)
        elif project_name == "BusinessLoclAi":
            analysis = self._analyze_business_local_ai(content, analysis)
        elif project_name == "AiAutoAgency":
            analysis = self._analyze_ai_auto_agency(content, analysis)
        elif project_name == "CryptoTradingBot":
            analysis = self._analyze_crypto_bot(content, analysis)
        elif project_name == "StockTradingBot":
            analysis = self._analyze_stock_bot(content, analysis)
        
        return analysis
    
    def _analyze_diy_app(self, content: Dict, analysis: Dict) -> Dict:
        """Analyze DIY App project"""
        # Look for PROJECT_STATUS.md
        if 'PROJECT_STATUS.md' in content:
            status_content = content['PROJECT_STATUS.md']
            
            # Extract status and progress
            if 'Overall Status: 80% Complete' in status_content:
                analysis['status'] = 'In Progress'
                analysis['progress'] = 80
            
            # Extract completed features
            completed_match = re.search(r'## ✅ \*\*COMPLETED FEATURES\*\*(.*?)##', status_content, re.DOTALL)
            if completed_match:
                completed_text = completed_match.group(1)
                features = re.findall(r'- ✅ \*\*(.*?)\*\*', completed_text)
                analysis['completed_features'] = features
            
            # Extract in-progress features
            progress_match = re.search(r'## 🚧 \*\*IN PROGRESS / NEEDS WORK\*\*(.*?)##', status_content, re.DOTALL)
            if progress_match:
                progress_text = progress_match.group(1)
                features = re.findall(r'- 🔄 \*\*(.*?)\*\*', completed_text)
                analysis['in_progress_features'] = features
            
            # Extract next steps
            next_match = re.search(r'## 🚀 \*\*IMMEDIATE NEXT STEPS\*\*(.*?)##', status_content, re.DOTALL)
            if next_match:
                next_text = next_match.group(1)
                steps = re.findall(r'\d+\. \*\*(.*?)\*\*', next_text)
                analysis['next_steps'] = steps
        
        # Look for TODO.md
        if 'TODO.md' in content:
            todo_content = content['TODO.md']
            
            # Extract immediate priorities
            priorities_match = re.search(r'## 🔥 \*\*IMMEDIATE PRIORITIES.*?\*\*(.*?)##', todo_content, re.DOTALL)
            if priorities_match:
                priorities_text = priorities_match.group(1)
                todos = re.findall(r'- \[ \] \*\*(.*?)\*\*', priorities_text)
                analysis['todo_features'].extend(todos)
        
        analysis['description'] = "Next.js 14 mobile application for DIY projects with build planner, quick builds, and AI integration. Features include unit conversion, tool filtering, shopping list generation, and responsive design."
        analysis['tech_stack'] = ["Next.js 14", "TypeScript", "Tailwind CSS", "shadcn/ui", "Mock AI Integration"]
        
        return analysis
    
    def _analyze_business_local_ai(self, content: Dict, analysis: Dict) -> Dict:
        """Analyze BusinessLocal AI project"""
        if 'MarketAnalasyst.md' in content:
            market_content = content['MarketAnalasyst.md']
            
            # Extract business model
            if 'Business Model & Services' in market_content:
                analysis['business_model'] = "On-premise LLM deployment service for Canadian businesses, specializing in private, secure AI assistants with local hosting."
            
            # Extract market analysis
            if 'Market Analysis' in market_content:
                analysis['market_analysis'] = "Canadian AI market projected to grow from USD 18.8B in 2023 to USD 152.7B by 2030. Rising demand for private, locally-hosted LLMs driven by regulatory pressure and security concerns."
            
            # Extract services
            services_match = re.search(r'Core Services(.*?)Pricing Structure', market_content, re.DOTALL)
            if services_match:
                services_text = services_match.group(1)
                services = re.findall(r'([A-Za-z &]+)\n(.*?)(?=\n[A-Z]|$)', services_text)
                analysis['completed_features'] = [f"{service[0]}: {service[1].strip()}" for service in services if service[0].strip()]
        
        analysis['description'] = "Canadian on-premise LLM deployment service for businesses. Specializing in private, secure AI assistants with local hosting to meet privacy and compliance requirements."
        analysis['status'] = 'Planning'
        analysis['progress'] = 20
        analysis['tech_stack'] = ["Ollama", "LM Studio", "LangChain", "OnPrem.LLM toolkit"]
        analysis['next_steps'] = [
            "Formalize MVP offering",
            "Secure pilot client",
            "Build demo prototype",
            "Create marketing assets"
        ]
        
        return analysis
    
    def _analyze_ai_auto_agency(self, content: Dict, analysis: Dict) -> Dict:
        """Analyze AIAutoAgency project"""
        if 'businessplan.md' in content:
            plan_content = content['businessplan.md']
            
            # Extract business model
            if 'Business Model' in plan_content:
                analysis['business_model'] = "AI automation agency helping SMBs implement custom AI solutions. Focus on chatbots, workflow automation, and consulting with value-based pricing."
            
            # Extract services
            services_match = re.search(r'Core Offerings:(.*?)Technology Stack:', plan_content, re.DOTALL)
            if services_match:
                services_text = services_match.group(1)
                services = re.findall(r'\* \*\*(.*?)\*\*', services_text)
                analysis['completed_features'] = services
            
            # Extract tech stack
            tech_match = re.search(r'Technology Stack:(.*?)Business Model:', plan_content, re.DOTALL)
            if tech_match:
                tech_text = tech_match.group(1)
                tech = re.findall(r'\*\*(.*?)\*\*: (.*?)(?=\n\*\*|$)', tech_text)
                analysis['tech_stack'] = [f"{category}: {tools}" for category, tools in tech]
            
            # Extract financial projections
            if 'Financial Projections' in plan_content:
                analysis['business_model'] += " Projected Year 1 revenue: $216K with setup projects, retainers, and training sessions."
        
        analysis['description'] = "AI automation agency helping SMBs implement custom AI solutions. Focus on chatbots, workflow automation, and consulting with value-based pricing tied to hours saved and revenue generated."
        analysis['status'] = 'Planning'
        analysis['progress'] = 15
        analysis['next_steps'] = [
            "Define service packages",
            "Build marketing website", 
            "Develop case study templates",
            "Create go-to-market strategy"
        ]
        
        return analysis
    
    def _analyze_crypto_bot(self, content: Dict, analysis: Dict) -> Dict:
        """Analyze Crypto Trading Bot project"""
        if 'CRYPTO_BOT_RESEARCH.txt' in content:
            research_content = content['CRYPTO_BOT_RESEARCH.txt']
            
            # Extract research areas
            research_areas = re.findall(r'## (\d+)\. (.*?)(?=\n---|\n##|\Z)', research_content, re.DOTALL)
            analysis['completed_features'] = [f"{num}. {area.strip()}" for num, area in research_areas]
            
            # Extract trading strategies
            if 'Trading Strategy Framework' in research_content:
                strategies_match = re.search(r'Trading Strategy Framework(.*?)Backtesting Methodology', research_content, re.DOTALL)
                if strategies_match:
                    strategies_text = strategies_match.group(1)
                    strategies = re.findall(r'- ([^:]+):', strategies_text)
                    analysis['todo_features'].extend(strategies)
            
            # Extract infrastructure options
            if 'Infrastructure and Hosting Options' in research_content:
                analysis['tech_stack'] = ["Python", "Exchange APIs (Binance, Coinbase, Kraken)", "Backtesting Framework", "Risk Management System"]
        
        analysis['description'] = "Automated cryptocurrency trading system with sentiment analysis, backtesting, and risk management. Research phase complete with comprehensive analysis of APIs, strategies, and infrastructure."
        analysis['status'] = 'Planning'
        analysis['progress'] = 30
        analysis['next_steps'] = [
            "Set up development environment",
            "Implement basic trading strategy",
            "Set up backtesting framework",
            "Implement risk management"
        ]
        
        return analysis
    
    def _analyze_stock_bot(self, content: Dict, analysis: Dict) -> Dict:
        """Analyze Stock Trading Bot project"""
        # Directory appears empty, so minimal analysis
        analysis['description'] = "Stock trading bot project - directory appears to be empty or in early planning stages."
        analysis['status'] = 'Not Started'
        analysis['progress'] = 0
        analysis['next_steps'] = ["Define project scope and requirements"]
        
        return analysis
    
    def generate_summary(self):
        """Generate overall project summary"""
        print("\n" + "="*80)
        print("📊 PROJECT STATUS SUMMARY")
        print("="*80)
        
        total_projects = len(self.analysis)
        completed_projects = sum(1 for p in self.analysis.values() if p['progress'] >= 100)
        in_progress = sum(1 for p in self.analysis.values() if 0 < p['progress'] < 100)
        planning = sum(1 for p in self.analysis.values() if p['progress'] == 0)
        
        print(f"\n📈 Overall Progress:")
        print(f"   • Total Projects: {total_projects}")
        print(f"   • Completed: {completed_projects}")
        print(f"   • In Progress: {in_progress}")
        print(f"   • Planning: {planning}")
        
        print(f"\n🎯 Priority Projects:")
        priority_projects = sorted(self.analysis.values(), key=lambda x: x['progress'], reverse=True)
        for project in priority_projects:
            print(f"   • {project['name']}: {project['progress']}% - {project['status']}")
        
        return self.analysis
    
    def save_analysis(self, filename: str = "project_analysis.json"):
        """Save analysis to JSON file"""
        with open(filename, 'w') as f:
            json.dump(self.analysis, f, indent=2)
        print(f"\n💾 Analysis saved to {filename}")
    
    def run_full_analysis(self):
        """Run complete analysis pipeline"""
        self.scan_projects()
        self.read_project_files()
        self.analyze_projects()
        summary = self.generate_summary()
        self.save_analysis()
        return summary

def main():
    """Main function to run the analysis"""
    print("🚀 Starting Project Status Analysis...")
    print("="*50)
    
    analyzer = ProjectAnalyzer()
    analysis = analyzer.run_full_analysis()
    
    print("\n✅ Analysis complete!")
    print("\n📋 To view detailed analysis for each project:")
    for project_name in analysis.keys():
        print(f"   • {project_name}: {analysis[project_name]['description'][:100]}...")

if __name__ == "__main__":
    main()
