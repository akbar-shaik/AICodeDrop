/**
 * analyzer.js - Static Dependency, Symbol Extractor & Architecture Mapper
 * 
 * Extracts static intelligence from the codebase so even small/local LLMs
 * (e.g., Llama-3-8B, Qwen-7B, Claude Haiku, Gemini Flash-Lite) immediately
 * understand the project structure, entry points, and symbol relationships.
 */

import { getExtension } from './scanner.js';

/**
 * Classifies a file into a functional role:
 * 'entrypoint' | 'config' | 'serverless' | 'test' | 'core' | 'asset' | 'doc'
 */
export function classifyFileRole(filePath) {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  const baseName = normalized.split('/').pop();
  const ext = getExtension(baseName);

  // Documentation / markdown
  if (ext === 'md' || ext === 'markdown' || ext === 'txt') {
    return 'doc';
  }

  // Config files
  if (
    baseName === 'package.json' ||
    baseName === 'package-lock.json' ||
    baseName.endsWith('.toml') ||
    baseName.startsWith('tsconfig') ||
    baseName.includes('.config.') ||
    baseName === '.env' ||
    baseName.startsWith('.env.') ||
    baseName === 'dockerfile' ||
    baseName === 'makefile'
  ) {
    return 'config';
  }

  // Serverless / API routes
  if (
    normalized.startsWith('netlify/functions/') ||
    normalized.startsWith('.netlify/functions/') ||
    normalized.startsWith('api/') ||
    normalized.includes('/functions/')
  ) {
    return 'serverless';
  }

  // Tests & test fixtures
  if (
    normalized.startsWith('test/') ||
    normalized.startsWith('tests/') ||
    normalized.includes('/__tests__/') ||
    baseName.includes('.test.') ||
    baseName.includes('.spec.') ||
    baseName.startsWith('test-') ||
    baseName.endsWith('-test.js')
  ) {
    return 'test';
  }

  // Entry points
  if (
    baseName === 'index.html' ||
    baseName === 'app.js' ||
    baseName === 'app.ts' ||
    baseName === 'main.js' ||
    baseName === 'main.ts' ||
    baseName === 'main.py' ||
    baseName === 'server.js' ||
    baseName === 'server.ts' ||
    baseName === 'index.js' ||
    baseName === 'index.ts'
  ) {
    return 'entrypoint';
  }

  // Assets (CSS, styling)
  if (['css', 'scss', 'sass', 'less'].includes(ext)) {
    return 'asset';
  }

  // Default to core source code
  return 'core';
}

/**
 * Extracts imports from code across JS/TS, Python, and HTML/CSS
 */
export function extractImports(code, ext = 'js') {
  if (!code) return [];
  const imports = new Set();
  const extension = (ext || '').toLowerCase();

  // JavaScript / TypeScript
  if (['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'vue', 'svelte'].includes(extension)) {
    // import ... from '...'
    const importFromRe = /(?:import\s+(?:[\w*\s{},$]+from\s+)?|require\s*\(\s*)['"]([^'"]+)['"]/g;
    let match;
    while ((match = importFromRe.exec(code)) !== null) {
      if (match[1]) imports.add(match[1]);
    }

    // Dynamic import('...')
    const dynamicImportRe = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicImportRe.exec(code)) !== null) {
      if (match[1]) imports.add(match[1]);
    }
  }

  // Python
  if (['py', 'python', 'pyw', 'pyi'].includes(extension)) {
    // from foo import bar
    const fromRe = /^from\s+([a-zA-Z0-9_.]+)\s+import/gm;
    let match;
    while ((match = fromRe.exec(code)) !== null) {
      if (match[1]) imports.add(match[1]);
    }

    // import foo, bar
    const importRe = /^import\s+([a-zA-Z0-9_.,\s]+)/gm;
    while ((match = importRe.exec(code)) !== null) {
      const pkgs = match[1].split(',').map(p => p.trim().split(/\s+as\s+/)[0].trim());
      pkgs.forEach(p => { if (p) imports.add(p); });
    }
  }

  // HTML
  if (['html', 'htm'].includes(extension)) {
    const scriptRe = /<script[^>]+src=["']([^"']+)["']/gi;
    let match;
    while ((match = scriptRe.exec(code)) !== null) {
      if (match[1]) imports.add(match[1]);
    }
    const linkRe = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi;
    while ((match = linkRe.exec(code)) !== null) {
      if (match[1]) imports.add(match[1]);
    }
  }

  // CSS
  if (['css', 'scss', 'less'].includes(extension)) {
    const cssImportRe = /@import\s+(?:url\()?['"]([^'"]+)['"]\)?/gi;
    let match;
    while ((match = cssImportRe.exec(code)) !== null) {
      if (match[1]) imports.add(match[1]);
    }
  }

  return Array.from(imports);
}

/**
 * Extracts exported functions, classes, interfaces, types, constants
 */
export function extractExports(code, ext = 'js') {
  if (!code) return [];
  const exports = new Set();
  const extension = (ext || '').toLowerCase();

  // JavaScript / TypeScript
  if (['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'].includes(extension)) {
    // export [async] function name
    const funcRe = /export\s+(?:async\s+)?function\s*\*?\s*([a-zA-Z0-9_$]+)/g;
    let match;
    while ((match = funcRe.exec(code)) !== null) {
      if (match[1]) exports.add(match[1]);
    }

    // export class name
    const classRe = /export\s+(?:default\s+)?(?:abstract\s+)?class\s+([a-zA-Z0-9_$]+)/g;
    while ((match = classRe.exec(code)) !== null) {
      if (match[1]) exports.add(match[1]);
    }

    // export interface / type / enum
    const typeRe = /export\s+(?:interface|type|enum)\s+([a-zA-Z0-9_$]+)/g;
    while ((match = typeRe.exec(code)) !== null) {
      if (match[1]) exports.add(match[1]);
    }

    // export const / let / var name
    const varRe = /export\s+(?:const|let|var)\s+([a-zA-Z0-9_$]+)/g;
    while ((match = varRe.exec(code)) !== null) {
      if (match[1]) exports.add(match[1]);
    }

    // export { a, b, c }
    const namedExportRe = /export\s*\{([^}]+)\}/g;
    while ((match = namedExportRe.exec(code)) !== null) {
      const items = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim());
      items.forEach(it => { if (it && !it.startsWith('type ')) exports.add(it); });
    }

    // CommonJS: exports.foo = or module.exports = { ... }
    const cjsExportRe = /(?:module\.)?exports\.([a-zA-Z0-9_$]+)\s*=/g;
    while ((match = cjsExportRe.exec(code)) !== null) {
      if (match[1] && match[1] !== 'default') exports.add(match[1]);
    }

    // export default
    if (/export\s+default\b/.test(code) && !exports.has('default')) {
      exports.add('default');
    }
  }

  // Python
  if (['py', 'python', 'pyw', 'pyi'].includes(extension)) {
    // def func_name
    const pyDefRe = /^(?:async\s+)?def\s+([a-zA-Z0-9_]+)\s*\(/gm;
    let match;
    while ((match = pyDefRe.exec(code)) !== null) {
      if (match[1] && !match[1].startsWith('_')) exports.add(match[1]);
    }

    // class ClassName
    const pyClassRe = /^class\s+([a-zA-Z0-9_]+)/gm;
    while ((match = pyClassRe.exec(code)) !== null) {
      if (match[1] && !match[1].startsWith('_')) exports.add(match[1]);
    }
  }

  return Array.from(exports);
}

/**
 * Analyzes a single file's content and returns metadata
 */
export function analyzeFile(filePath, content) {
  const ext = getExtension(filePath);
  const role = classifyFileRole(filePath);
  const imports = extractImports(content, ext);
  const exports = extractExports(content, ext);

  return {
    path: filePath,
    role,
    imports,
    exports
  };
}

/**
 * Computes topological / priority order score for sorting files.
 * Lower score = appears earlier in <codebase>.
 * 
 * Order:
 * 1. Configs & Entrypoints (package.json, index.html, app.js) -> score 10-20
 * 2. Core Modules (ordered by dependency centrality: most imported first) -> score 30-50
 * 3. Assets & Styles -> score 60
 * 4. Serverless & API -> score 70
 * 5. Tests & Mocks -> score 80
 * 6. Documentation -> score 90
 */
export function computeFilePriorityScore(filePath, role, importCounts = new Map()) {
  const norm = filePath.replace(/\\/g, '/').toLowerCase();
  const baseName = norm.split('/').pop();

  if (baseName === 'package.json') return 5;
  if (baseName === 'index.html') return 10;
  if (baseName === 'app.js' || baseName === 'main.js' || baseName === 'server.js') return 15;

  if (role === 'config') return 20;
  if (role === 'entrypoint') return 25;

  if (role === 'core') {
    // Higher import count = higher priority (lower score)
    const timesImported = importCounts.get(norm) || importCounts.get(baseName) || 0;
    return Math.max(30, 50 - timesImported);
  }

  if (role === 'asset') return 60;
  if (role === 'serverless') return 70;
  if (role === 'test') return 80;
  if (role === 'doc') return 90;

  return 55;
}

/**
 * Builds the textual <architecture_map> from analyzed files
 */
export function buildArchitectureMap(fileAnalyses) {
  const lines = [];

  // Group by role
  const roles = ['entrypoint', 'config', 'core', 'serverless', 'asset', 'test', 'doc'];
  const roleLabels = {
    entrypoint: 'ENTRYPOINT',
    config: 'CONFIG',
    core: 'CORE',
    serverless: 'SERVERLESS',
    asset: 'ASSET',
    test: 'TEST',
    doc: 'DOC'
  };

  const sortedAnalyses = [...fileAnalyses].sort((a, b) => {
    const roleDiff = roles.indexOf(a.role) - roles.indexOf(b.role);
    if (roleDiff !== 0) return roleDiff;
    return a.path.localeCompare(b.path);
  });

  for (const item of sortedAnalyses) {
    const label = roleLabels[item.role] || item.role.toUpperCase();
    let line = `[${label}] ${item.path}`;

    const parts = [];
    if (item.imports && item.imports.length > 0) {
      const impList = item.imports.slice(0, 8).join(', ') + (item.imports.length > 8 ? '...' : '');
      parts.push(`imports: ${impList}`);
    }
    if (item.exports && item.exports.length > 0) {
      const expList = item.exports.slice(0, 10).join(', ') + (item.exports.length > 10 ? '...' : '');
      parts.push(`exports: ${expList}`);
    }

    if (parts.length > 0) {
      line += ` -> ${parts.join(' | ')}`;
    }
    lines.push(line);
  }

  return lines.join('\n');
}
