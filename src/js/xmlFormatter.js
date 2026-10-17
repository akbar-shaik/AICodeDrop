/**
 * xmlFormatter.js - Structured LLM XML & Context Assembler
 * 
 * Generates XML schemas optimized for Claude 3.7, GPT-4o, Gemini 2.5/1.5,
 * and smaller open-source models (Llama 3, Qwen, DeepSeek).
 * Includes <context_guide>, <architecture_map>, priority topological sorting,
 * dynamic CDATA escaping, and duplicate file referencing.
 */

import { escapeCData as safeEscapeCData } from './xmlFormatter.js';
import { analyzeFile, computeFilePriorityScore, buildArchitectureMap } from './analyzer.js';

/**
 * Escapes CDATA termination sequence ']]>' dynamically to prevent self-corruption
 */
export function escapeCData(content) {
  if (!content) return '';
  const closeTag = ']]' + '>';
  const splitCData = ']]]]' + '><' + '![CDATA[>';
  return content.split(closeTag).join(splitCData);
}

/**
 * Escapes standard XML characters for attributes or simple tags
 */
export function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates ASCII folder hierarchy from an array of relative paths
 */
export function generateAsciiTree(folderName, filePaths) {
  const root = {};

  filePaths.forEach(filePath => {
    const parts = filePath.replace(/\\/g, '/').split('/').filter(Boolean);
    let current = root;
    parts.forEach((part, i) => {
      if (!current[part]) {
        current[part] = (i === parts.length - 1) ? null : {};
      }
      current = current[part];
    });
  });

  function drawTree(node, prefix = '') {
    let result = '';
    const keys = Object.keys(node).sort((a, b) => {
      const aIsDir = node[a] !== null;
      const bIsDir = node[b] !== null;
      if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
      return a.localeCompare(b);
    });

    keys.forEach((key, index) => {
      const isLast = index === keys.length - 1;
      const pointer = isLast ? '└── ' : '├── ';
      const isFolder = node[key] !== null;

      result += `${prefix}${pointer}${key}${isFolder ? '/' : ''}\n`;

      if (isFolder) {
        const extension = isLast ? '    ' : '│   ';
        result += drawTree(node[key], prefix + extension);
      }
    });
    return result;
  }

  return `${folderName}/\n${drawTree(root)}`;
}

/**
 * Summarizes manifest files (package.json dependencies, pyproject.toml, etc.)
 */
export function extractManifestSummary(manifestFiles) {
  const summaries = [];

  for (const [path, content] of manifestFiles) {
    const fileName = path.split('/').pop().toLowerCase();

    if (fileName === 'package.json') {
      try {
        const json = JSON.parse(content);
        const deps = Object.keys(json.dependencies || {});
        const devDeps = Object.keys(json.devDependencies || {});
        summaries.push({
          path,
          type: 'npm',
          summary: `Name: ${json.name || 'unnamed'}@${json.version || '1.0.0'}\nDependencies (${deps.length}): ${deps.slice(0, 20).join(', ')}${deps.length > 20 ? '...' : ''}\nDevDependencies (${devDeps.length}): ${devDeps.slice(0, 15).join(', ')}${devDeps.length > 15 ? '...' : ''}`
        });
      } catch (_) {
        summaries.push({ path, type: 'npm', summary: content.slice(0, 500) });
      }
    } else if (fileName === 'requirements.txt') {
      const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).slice(0, 25);
      summaries.push({
        path,
        type: 'pip',
        summary: lines.join('\n')
      });
    } else if (fileName === 'cargo.toml') {
      summaries.push({
        path,
        type: 'cargo',
        summary: content.slice(0, 500)
      });
    } else {
      summaries.push({
        path,
        type: 'manifest',
        summary: content.slice(0, 400)
      });
    }
  }

  return summaries;
}

/**
 * Context Guide teaching LLMs how to comprehend the context and file modes
 */
export const CONTEXT_GUIDE_TEXT = `HOW TO READ THIS REPOSITORY CONTEXT:
1. <architecture_map> lists every file's functional role, exported symbols, and dependencies. Read this first to navigate the codebase.
2. Files with mode="full" or mode="compressed" contain complete working code.
3. Files with mode="skeleton" have function implementations replaced with "/* implementation omitted */" to conserve token budget—DO NOT treat them as unimplemented stubs or rewrite them unless requested.
4. Files with mode="duplicate" have identical content to the file indicated in duplicate_of.
5. All file paths are relative to the repository root.`;

/**
 * Assembles the full project context into XML format
 * 
 * @param {Object} params
 * @param {string} params.repositoryName
 * @param {number} params.totalTokens
 * @param {number} [params.codeTokens]
 * @param {number} [params.overheadTokens]
 * @param {string} params.userInstructions
 * @param {string} params.userPrompt
 * @param {Array<Object>} params.files - Array of file objects
 * @param {Map<string, string>} [params.manifestMap]
 * @returns {string} XML context string
 */
export function buildXmlContext({
  repositoryName = 'project',
  totalTokens = 0,
  codeTokens = 0,
  overheadTokens = 0,
  userInstructions = '',
  userPrompt = '',
  files = [],
  manifestMap = new Map()
}) {
  // Analyze files to extract roles, imports, exports
  const fileAnalyses = files.map(f => {
    const analysis = analyzeFile(f.path, f.content || '');
    return {
      ...f,
      role: analysis.role,
      imports: analysis.imports,
      exports: analysis.exports
    };
  });

  // Count incoming imports to calculate centrality
  const importCounts = new Map();
  fileAnalyses.forEach(f => {
    (f.imports || []).forEach(imp => {
      const clean = imp.replace(/\\/g, '/').toLowerCase();
      importCounts.set(clean, (importCounts.get(clean) || 0) + 1);
    });
  });

  // Sort files by priority/topological order
  const sortedFiles = [...fileAnalyses].sort((a, b) => {
    const scoreA = computeFilePriorityScore(a.path, a.role, importCounts);
    const scoreB = computeFilePriorityScore(b.path, b.role, importCounts);
    if (scoreA !== scoreB) return scoreA - scoreB;
    return a.path.localeCompare(b.path);
  });

  const filePaths = sortedFiles.map(f => f.path);
  const asciiTree = generateAsciiTree(repositoryName, filePaths);
  const manifestSummaries = extractManifestSummary(manifestMap);
  const archMapText = buildArchitectureMap(sortedFiles);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<project_context repository="${escapeXml(repositoryName)}" total_tokens="${totalTokens}" code_tokens="${codeTokens || totalTokens}" overhead_tokens="${overheadTokens || 0}">\n`;

  // 1. Context Guide
  xml += `  <context_guide>\n`;
  xml += `<![CDATA[\n${escapeCData(CONTEXT_GUIDE_TEXT)}\n]]>\n`;
  xml += `  </context_guide>\n\n`;

  // 2. Architecture Map (Symbol Index & Call Graph)
  xml += `  <architecture_map>\n`;
  xml += `<![CDATA[\n${escapeCData(archMapText)}\n]]>\n`;
  xml += `  </architecture_map>\n\n`;

  // 3. Manifests block
  xml += `  <manifests>\n`;
  if (manifestSummaries.length > 0) {
    manifestSummaries.forEach(m => {
      xml += `    <manifest path="${escapeXml(m.path)}" type="${escapeXml(m.type)}">\n`;
      xml += `<![CDATA[\n${escapeCData(m.summary)}\n]]>\n`;
      xml += `    </manifest>\n`;
    });
  } else {
    xml += `    <!-- No package manifests detected -->\n`;
  }
  xml += `  </manifests>\n\n`;

  // 4. Directory structure
  xml += `  <directory_structure>\n`;
  xml += `<![CDATA[\n${escapeCData(asciiTree)}\n]]>\n`;
  xml += `  </directory_structure>\n\n`;

  // 5. User instructions (prefix)
  if (userInstructions && userInstructions.trim()) {
    xml += `  <user_instructions>\n`;
    xml += `<![CDATA[\n${escapeCData(userInstructions.trim())}\n]]>\n`;
    xml += `  </user_instructions>\n\n`;
  }

  // 6. Codebase files (ordered by priority)
  xml += `  <codebase>\n`;
  sortedFiles.forEach(f => {
    const isDup = f.mode === 'duplicate' || f.isDuplicateOf;
    if (isDup) {
      const dupOf = f.duplicateOf || f.isDuplicateOf || 'unknown';
      xml += `    <file path="${escapeXml(f.path)}" mode="duplicate" duplicate_of="${escapeXml(dupOf)}" tokens="${f.tokens || 5}" />\n`;
    } else {
      const roleAttr = f.role ? ` role="${escapeXml(f.role)}"` : '';
      const expAttr = f.exports && f.exports.length > 0 ? ` exports="${escapeXml(f.exports.slice(0, 8).join(', '))}"` : '';
      const impAttr = f.imports && f.imports.length > 0 ? ` imports="${escapeXml(f.imports.slice(0, 6).join(', '))}"` : '';

      xml += `    <file path="${escapeXml(f.path)}" mode="${escapeXml(f.mode)}" tokens="${f.tokens || 0}"${roleAttr}${expAttr}${impAttr}>\n`;
      xml += `<![CDATA[\n${escapeCData(f.content || '')}\n]]>\n`;
      xml += `    </file>\n`;
    }
  });
  xml += `  </codebase>\n`;

  // 7. User prompt (suffix)
  if (userPrompt && userPrompt.trim()) {
    xml += `\n  <user_prompt>\n`;
    xml += `<![CDATA[\n${escapeCData(userPrompt.trim())}\n]]>\n`;
    xml += `  </user_prompt>\n`;
  }

  xml += `</project_context>\n`;

  return xml;
}

/**
 * Assembles context into classic plain-text format
 */
export function buildPlainTextContext({
  repositoryName = 'project',
  totalTokens = 0,
  userInstructions = '',
  userPrompt = '',
  files = []
}) {
  const fileAnalyses = files.map(f => {
    const analysis = analyzeFile(f.path, f.content || '');
    return {
      ...f,
      role: analysis.role,
      imports: analysis.imports,
      exports: analysis.exports
    };
  });

  const filePaths = fileAnalyses.map(f => f.path);
  const asciiTree = generateAsciiTree(repositoryName, filePaths);
  const archMapText = buildArchitectureMap(fileAnalyses);

  let output = '';

  output += `================================================================================\n`;
  output += `CONTEXT GUIDE:\n`;
  output += `================================================================================\n`;
  output += `${CONTEXT_GUIDE_TEXT}\n\n`;

  output += `================================================================================\n`;
  output += `ARCHITECTURE MAP & SYMBOL INDEX:\n`;
  output += `================================================================================\n`;
  output += `${archMapText}\n\n`;

  if (userInstructions && userInstructions.trim()) {
    output += `================================================================================\n`;
    output += `USER INSTRUCTIONS / CONTEXT:\n`;
    output += `================================================================================\n`;
    output += `${userInstructions.trim()}\n\n`;
  }

  output += `================================================================================\n`;
  output += `PROJECT FOLDER STRUCTURE:\n`;
  output += `================================================================================\n`;
  output += `${asciiTree}\n\n`;
  output += `--- Codebase Context Generated from folder: ${repositoryName} ---\n\n`;

  fileAnalyses.forEach(f => {
    const isDup = f.mode === 'duplicate' || f.isDuplicateOf;
    output += `\n\n================================================================================\n`;
    if (isDup) {
      output += `File: ${f.path} [DUPLICATE of ${f.duplicateOf || f.isDuplicateOf}]\n`;
      output += `================================================================================\n`;
      output += `/* Content omitted: identical copy of ${f.duplicateOf || f.isDuplicateOf} */\n`;
    } else {
      const meta = [
        `Mode: ${f.mode}`,
        `Role: ${f.role || 'core'}`,
        `Tokens: ~${f.tokens || 0}`
      ].join(' | ');
      output += `File: ${f.path} [${meta}]\n`;
      if (f.exports && f.exports.length > 0) {
        output += `Exports: ${f.exports.join(', ')}\n`;
      }
      output += `================================================================================\n\n`;
      output += (f.content || '');
    }
  });

  if (userPrompt && userPrompt.trim()) {
    output += `\n\n================================================================================\n`;
    output += `USER PROMPT / TASK:\n`;
    output += `================================================================================\n`;
    output += `${userPrompt.trim()}\n`;
  }

  return output;
}
