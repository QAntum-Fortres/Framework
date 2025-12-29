/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 40/50: Self Documentation                          ║
 * ║  Part of: Phase 3 - Domination                                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description AI-Powered Self-Documentation System
 * @phase 3 - Domination
 * @step 40 of 50
 */

'use strict';

const EventEmitter = require('events');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════════
// DOC TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DocFormat - Documentation formats
 */
const DocFormat = {
    MARKDOWN: 'markdown',
    HTML: 'html',
    JSON: 'json',
    OPENAPI: 'openapi',
    DOCUSAURUS: 'docusaurus'
};

/**
 * DocSection - Documentation sections
 */
const DocSection = {
    OVERVIEW: 'overview',
    INSTALLATION: 'installation',
    QUICKSTART: 'quickstart',
    API: 'api',
    EXAMPLES: 'examples',
    FAQ: 'faq',
    CHANGELOG: 'changelog'
};

// ═══════════════════════════════════════════════════════════════════════════════
// CODE ANALYZER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CodeAnalyzer - Analyze code for documentation
 */
class CodeAnalyzer extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = options;
        
        // Patterns for extracting documentation
        this.patterns = {
            jsdoc: /\/\*\*[\s\S]*?\*\//g,
            class: /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{/g,
            method: /(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*\{/g,
            function: /(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g,
            export: /module\.exports\s*=\s*\{([^}]+)\}/g,
            const: /const\s+(\w+)\s*=/g
        };
    }

    /**
     * Analyze file
     */
    analyzeFile(content, filePath) {
        const analysis = {
            path: filePath,
            name: path.basename(filePath, path.extname(filePath)),
            classes: [],
            functions: [],
            exports: [],
            comments: [],
            constants: []
        };
        
        // Extract classes
        let match;
        while ((match = this.patterns.class.exec(content)) !== null) {
            analysis.classes.push({
                name: match[1],
                extends: match[2] || null,
                position: match.index
            });
        }
        
        // Extract JSDoc comments
        this.patterns.jsdoc.lastIndex = 0;
        while ((match = this.patterns.jsdoc.exec(content)) !== null) {
            const parsed = this._parseJSDoc(match[0]);
            analysis.comments.push({
                raw: match[0],
                parsed,
                position: match.index
            });
        }
        
        // Extract exports
        this.patterns.export.lastIndex = 0;
        while ((match = this.patterns.export.exec(content)) !== null) {
            const exports = match[1].split(',').map(e => e.trim().split(':')[0].trim());
            analysis.exports.push(...exports);
        }
        
        return analysis;
    }

    /**
     * Parse JSDoc comment
     */
    _parseJSDoc(comment) {
        const result = {
            description: '',
            params: [],
            returns: null,
            example: null,
            tags: {}
        };
        
        // Extract description
        const descMatch = comment.match(/\/\*\*\s*\n?\s*\*?\s*([^@\*][^\n]*)/);
        if (descMatch) {
            result.description = descMatch[1].trim();
        }
        
        // Extract @param
        const paramRegex = /@param\s+\{([^}]+)\}\s+(\w+)\s*-?\s*(.*)/g;
        let paramMatch;
        while ((paramMatch = paramRegex.exec(comment)) !== null) {
            result.params.push({
                type: paramMatch[1],
                name: paramMatch[2],
                description: paramMatch[3].trim()
            });
        }
        
        // Extract @returns
        const returnMatch = comment.match(/@returns?\s+\{([^}]+)\}\s*(.*)/);
        if (returnMatch) {
            result.returns = {
                type: returnMatch[1],
                description: returnMatch[2].trim()
            };
        }
        
        // Extract @example
        const exampleMatch = comment.match(/@example\s*([\s\S]*?)(?=@|\*\/)/);
        if (exampleMatch) {
            result.example = exampleMatch[1].replace(/\s*\*\s*/g, '\n').trim();
        }
        
        return result;
    }

    /**
     * Analyze module
     */
    analyzeModule(files) {
        const moduleAnalysis = {
            files: [],
            allClasses: [],
            allFunctions: [],
            allExports: []
        };
        
        for (const file of files) {
            const analysis = this.analyzeFile(file.content, file.path);
            moduleAnalysis.files.push(analysis);
            moduleAnalysis.allClasses.push(...analysis.classes);
            moduleAnalysis.allExports.push(...analysis.exports);
        }
        
        return moduleAnalysis;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOC GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DocGenerator - Generate documentation
 */
class DocGenerator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            format: options.format || DocFormat.MARKDOWN,
            template: options.template || 'default',
            includeExamples: options.includeExamples !== false,
            ...options
        };
        
        this.analyzer = new CodeAnalyzer(options);
    }

    /**
     * Generate documentation
     */
    generate(analysis, options = {}) {
        switch (this.options.format) {
            case DocFormat.MARKDOWN:
                return this._generateMarkdown(analysis, options);
            case DocFormat.HTML:
                return this._generateHTML(analysis, options);
            case DocFormat.JSON:
                return this._generateJSON(analysis, options);
            case DocFormat.OPENAPI:
                return this._generateOpenAPI(analysis, options);
            default:
                return this._generateMarkdown(analysis, options);
        }
    }

    /**
     * Generate Markdown
     */
    _generateMarkdown(analysis, options) {
        let md = '';
        
        // Title
        md += `# ${options.title || analysis.name || 'Documentation'}\n\n`;
        
        // Overview
        md += `## Overview\n\n`;
        md += `${options.description || 'Auto-generated documentation'}\n\n`;
        
        // Classes
        if (analysis.classes && analysis.classes.length > 0) {
            md += `## Classes\n\n`;
            
            for (const cls of analysis.classes) {
                md += `### ${cls.name}\n\n`;
                if (cls.extends) {
                    md += `Extends: \`${cls.extends}\`\n\n`;
                }
                
                // Find related JSDoc
                const doc = this._findRelatedDoc(analysis.comments, cls.position);
                if (doc) {
                    md += `${doc.parsed.description}\n\n`;
                }
            }
        }
        
        // Exports
        if (analysis.exports && analysis.exports.length > 0) {
            md += `## Exports\n\n`;
            md += `| Name | Type |\n`;
            md += `|------|------|\n`;
            
            for (const exp of analysis.exports) {
                md += `| \`${exp}\` | - |\n`;
            }
            md += '\n';
        }
        
        // Examples
        if (this.options.includeExamples) {
            md += `## Usage Examples\n\n`;
            md += '```javascript\n';
            md += `const module = require('./${analysis.name}');\n\n`;
            md += `// Create instance\n`;
            if (analysis.classes && analysis.classes.length > 0) {
                md += `const instance = new module.${analysis.classes[0].name}();\n`;
            }
            md += '```\n\n';
        }
        
        return md;
    }

    /**
     * Generate HTML
     */
    _generateHTML(analysis, options) {
        const md = this._generateMarkdown(analysis, options);
        
        // Simple MD to HTML conversion
        return `
<!DOCTYPE html>
<html>
<head>
    <title>${options.title || analysis.name}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
               max-width: 800px; margin: 0 auto; padding: 20px; }
        pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
        code { background: #f6f8fa; padding: 2px 6px; border-radius: 3px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    </style>
</head>
<body>
${this._mdToHTML(md)}
</body>
</html>
        `.trim();
    }

    /**
     * Simple MD to HTML
     */
    _mdToHTML(md) {
        return md
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^\|(.+)\|$/gm, (match) => {
                const cells = match.split('|').filter(c => c.trim());
                return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
            });
    }

    /**
     * Generate JSON
     */
    _generateJSON(analysis, options) {
        return JSON.stringify({
            title: options.title || analysis.name,
            version: options.version || '1.0.0',
            ...analysis
        }, null, 2);
    }

    /**
     * Generate OpenAPI
     */
    _generateOpenAPI(analysis, options) {
        return {
            openapi: '3.0.0',
            info: {
                title: options.title || analysis.name,
                version: options.version || '1.0.0',
                description: options.description || 'Auto-generated API documentation'
            },
            paths: {},
            components: {
                schemas: {}
            }
        };
    }

    /**
     * Find related doc comment
     */
    _findRelatedDoc(comments, position) {
        for (const comment of comments) {
            if (comment.position < position && position - comment.position < 500) {
                return comment;
            }
        }
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SELF DOC ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SelfDocEngine - Main self-documentation engine
 */
class SelfDocEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = options;
        
        this.analyzer = new CodeAnalyzer(options);
        this.generator = new DocGenerator(options);
        
        this.generated = [];
    }

    /**
     * Document file
     */
    documentFile(content, filePath, options = {}) {
        const analysis = this.analyzer.analyzeFile(content, filePath);
        const doc = this.generator.generate(analysis, options);
        
        this.generated.push({
            source: filePath,
            doc,
            analysis,
            generatedAt: new Date()
        });
        
        this.emit('documented', { source: filePath });
        
        return doc;
    }

    /**
     * Document module
     */
    documentModule(files, options = {}) {
        const analysis = this.analyzer.analyzeModule(files);
        const docs = [];
        
        for (const fileAnalysis of analysis.files) {
            const doc = this.generator.generate(fileAnalysis, options);
            docs.push({ path: fileAnalysis.path, doc });
        }
        
        // Generate index
        const indexDoc = this._generateIndex(analysis, options);
        docs.unshift({ path: 'index', doc: indexDoc });
        
        return docs;
    }

    /**
     * Generate index
     */
    _generateIndex(analysis, options) {
        let md = `# ${options.title || 'Module Documentation'}\n\n`;
        
        md += `## Files\n\n`;
        for (const file of analysis.files) {
            md += `- [${file.name}](./${file.name}.md)\n`;
        }
        
        md += `\n## All Classes\n\n`;
        for (const cls of analysis.allClasses) {
            md += `- \`${cls.name}\`\n`;
        }
        
        md += `\n## All Exports\n\n`;
        for (const exp of analysis.allExports) {
            md += `- \`${exp}\`\n`;
        }
        
        return md;
    }

    /**
     * Auto-update docs
     */
    watch(files, callback) {
        // In real implementation, use fs.watch
        console.log('Watching for changes...');
        
        return {
            stop: () => console.log('Stopped watching')
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    // Classes
    CodeAnalyzer,
    DocGenerator,
    SelfDocEngine,
    
    // Types
    DocFormat,
    DocSection,
    
    // Factory
    createEngine: (options = {}) => new SelfDocEngine(options),
    createAnalyzer: (options = {}) => new CodeAnalyzer(options),
    createGenerator: (options = {}) => new DocGenerator(options)
};

console.log('✅ Step 40/50: Self Documentation loaded');
