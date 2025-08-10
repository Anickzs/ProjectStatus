import { describe, it, expect, beforeEach } from 'vitest';

// Mock GitHubDataManager class with the new parsing methods
class MockGitHubDataManager {
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
      const re = new RegExp(`(?:^|\\n)##\\s*(?:${t})\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "i");
      const m = text.match(re);
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
                // Fallback to first line - remove all markdown formatting
                const firstLine = statusSection.split(/\n/)[0];
                statusTxt = firstLine
                    .replace(/^[-*•]\s*/, "") // Remove bullet points
                    .replace(/\*\*([^*]+)\*\*/, "$1") // Remove bold formatting
                    .replace(/:\s*$/, "") // Remove trailing colon
                    .trim();
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
        
        const lastUpdated = grabLabel(["Last Updated","Updated"]) || null;

    const listFromSec = (sec) => {
      if (!sec) return [];
      
      const lines = sec.split(/\n/).map(l => l.trim());
      const items = [];
      
      for (const line of lines) {
        // Stop processing if we encounter a line that looks like a section label
        if (line.endsWith(':') && !line.startsWith('-') && !line.startsWith('*') && !line.startsWith('•')) {
          break;
        }
        
        // Process bullet points
        if (/^[-*+•]\s+/.test(line)) {
          const item = line.replace(/^[-*+•]\s+/, "").replace(/\*\*([^*]+)\*\*/, "$1").trim();
          if (item.length > 0 && !item.startsWith('#')) {
            items.push(item);
          }
        }
      }
      
      return items;
    };

    // Try section-based first, then label-based
    let keyFeatures = listFromSec(grabSection(["Key Features","Features"]));
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

            const s = (out.status || "").toString().toLowerCase();
        if (!s.trim()) out.status = "Unknown";
        else if (s.includes("active") || s.includes("progress") || s.includes("build")) out.status = "Active";
        else if (s.includes("paused") || s.includes("hold")) out.status = "Paused";
        else if (s.includes("done") || s.includes("complete")) out.status = "Complete";
        else if (s.includes("unknown")) out.status = "Unknown";
        else out.status = "Unknown";

    out.phase = out.phase && out.phase.trim() ? out.phase : "Unknown";

    if (typeof out.progress !== "number" || isNaN(out.progress)) out.progress = 0;
    out.progress = Math.max(0, Math.min(100, Math.round(out.progress)));

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
}

describe('Markdown Parsing', () => {
  let manager;

  beforeEach(() => {
    manager = new MockGitHubDataManager();
  });

  describe('parseProjectMarkdown', () => {
    it('should parse section-based markdown correctly', () => {
      const markdown = `# Business Local AI

## Project Overview
AI-powered local business directory and review platform that helps users discover and review local businesses using intelligent recommendations.

## Project Status
- **Current Phase**: Planning
- **Progress**: 10%
- **Target Launch**: Q2 2024

## Key Features
- Smart Business Discovery
- Review Management
- Local SEO
- Mobile-First Design

## Technical Stack
- **Frontend**: React.js with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Redis cache`;

      const result = manager.parseProjectMarkdown(markdown);
      
      expect(result.title).toBe('Business Local AI');
      expect(result.overview).toContain('AI-powered local business directory');
      expect(result.status).toBe('Planning');
      expect(result.progress).toBe(10);
      expect(result.keyFeatures).toHaveLength(4);
      expect(result.technical).toHaveLength(3);
    });

    it('should parse label-based markdown correctly', () => {
      const markdown = `# At Home DIY

Project Overview: Next.js 14 DIY project planning app with build planner and responsive design.

Status: In Progress
Phase: Development
Progress: 65%
Last Updated: 2024-01-15

Key Features:
- Project Planner
- Material Calculator
- Progress Tracking
- Responsive Design

Technical Stack:
- Frontend: Next.js 14 with React
- Styling: Tailwind CSS
- Database: PostgreSQL`;

      const result = manager.parseProjectMarkdown(markdown);
      
      expect(result.title).toBe('At Home DIY');
      expect(result.overview).toBe('Next.js 14 DIY project planning app with build planner and responsive design.');
      expect(result.status).toBe('In Progress');
      expect(result.phase).toBe('Development');
      expect(result.progress).toBe(65);
      expect(result.keyFeatures).toHaveLength(4);
      expect(result.technical).toHaveLength(3);
    });

    it('should handle mixed format markdown', () => {
      const markdown = `# Mixed Format Project

## Project Overview
This project uses mixed formatting.

Status: Active
Phase: Development
Progress: 45%

## Key Features
- Feature 1
- Feature 2

Technical Stack:
- Tech 1
- Tech 2`;

      const result = manager.parseProjectMarkdown(markdown);
      
      expect(result.title).toBe('Mixed Format Project');
      expect(result.overview).toContain('This project uses mixed formatting');
      expect(result.status).toBe('Active');
      expect(result.phase).toBe('Development');
      expect(result.progress).toBe(45);
      expect(result.keyFeatures).toHaveLength(2);
      expect(result.technical).toHaveLength(2);
    });

    it('should handle empty or missing sections gracefully', () => {
      const markdown = `# Minimal Project

Just a title and some text.`;

      const result = manager.parseProjectMarkdown(markdown);
      
      expect(result.title).toBe('Minimal Project');
      expect(result.overview).toBe('');
      expect(result.status).toBe('');
      expect(result.phase).toBe('');
      expect(result.progress).toBe(null);
      expect(result.keyFeatures).toHaveLength(0);
      expect(result.technical).toHaveLength(0);
    });
  });

  describe('normalizeProjectFields', () => {
    it('should normalize status values correctly', () => {
      const testCases = [
        { input: 'active', expected: 'Active' },
        { input: 'in progress', expected: 'Active' },
        { input: 'building', expected: 'Active' },
        { input: 'paused', expected: 'Paused' },
        { input: 'on hold', expected: 'Paused' },
        { input: 'done', expected: 'Complete' },
        { input: 'completed', expected: 'Complete' },
        { input: '', expected: 'Unknown' },
        { input: 'unknown', expected: 'Unknown' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = manager.normalizeProjectFields({ status: input });
        expect(result.status).toBe(expected);
      });
    });

    it('should clamp progress values correctly', () => {
      const testCases = [
        { input: -10, expected: 0 },
        { input: 0, expected: 0 },
        { input: 50, expected: 50 },
        { input: 100, expected: 100 },
        { input: 150, expected: 100 },
        { input: null, expected: 0 },
        { input: undefined, expected: 0 },
        { input: 'invalid', expected: 0 }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = manager.normalizeProjectFields({ progress: input });
        expect(result.progress).toBe(expected);
      });
    });

    it('should provide sensible defaults', () => {
      const result = manager.normalizeProjectFields({});
      
      expect(result.name).toBe('Untitled Project');
      expect(result.status).toBe('Unknown');
      expect(result.phase).toBe('Unknown');
      expect(result.progress).toBe(0);
      expect(result.keyFeatures).toHaveLength(0);
      expect(result.technical).toHaveLength(0);
    });

    it('should preserve valid data', () => {
      const input = {
        title: 'Test Project',
        status: 'Active',
        phase: 'Development',
        progress: 75,
        keyFeatures: ['Feature 1', 'Feature 2'],
        technical: ['Tech 1', 'Tech 2']
      };

      const result = manager.normalizeProjectFields(input);
      
      expect(result.name).toBe('Test Project');
      expect(result.status).toBe('Active');
      expect(result.phase).toBe('Development');
      expect(result.progress).toBe(75);
      expect(result.keyFeatures).toHaveLength(2);
      expect(result.technical).toHaveLength(2);
    });
  });
});
