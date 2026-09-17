/**
 * xmlFormatter.js - Structured LLM XML & Context Assembler
 * 
 * Generates XML schemas optimized for Claude 3.7, GPT-4o, and Gemini 2.5/1.5,
 * with CDATA protection, manifest extraction, and ASCII directory tree formatting.
 */

import { MANIFEST_FILENAMES } from './scanner.js';

/**
 * Escapes CDATA termination sequence ']]>' safely
 */
export function escapeCData(content) {
  if (!content) return '';
  return content.replace(/\]\]>/g, ']]]]><![CDATA[>');
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
 * Summarizes manifest files (package.json dependencies, etc.)
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
          summary: `Dependencies (${deps.length}): ${deps.slice(0, 20).join(', ')}${deps.length > 20 ? '...' : ''}\nDevDependencies (${devDeps.length}): ${devDeps.slice(0, 15).join(', ')}${devDeps.length > 15 ? '...' : ''}`
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
 * Assembles the full project context into XML format
 * 
 * @param {Object} params
 * @param {string} params.repositoryName
 * @param {number} params.totalTokens
 * @param {string} params.userInstructions
 * @param {string} params.userPrompt
 * @param {Array<{ path: string, content: string, mode: string, tokens: number }>} params.files
 * @param {Map<string, string>} [params.manifestMap]
 * @returns {string} XML context string
 */
export function buildXmlContext({
  repositoryName = 'project',
  totalTokens = 0,
  userInstructions = '',
  userPrompt = '',
  files = [],
  manifestMap = new Map()
}) {
  const filePaths = files.map(f => f.path);
  const asciiTree = generateAsciiTree(repositoryName, filePaths);
  const manifestSummaries = extractManifestSummary(manifestMap);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<project_context repository="${escapeXml(repositoryName)}" total_tokens="${totalTokens}">\n`;

  // 1. Manifests block
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

  // 2. Directory structure
  xml += `  <directory_structure>\n`;
  xml += `<![CDATA[\n${escapeCData(asciiTree)}\n]]>\n`;
  xml += `  </directory_structure>\n\n`;

  // 3. User instructions (prefix)
  if (userInstructions && userInstructions.trim()) {
    xml += `  <user_instructions>\n`;
    xml += `<![CDATA[\n${escapeCData(userInstructions.trim())}\n]]>\n`;
    xml += `  </user_instructions>\n\n`;
  }

  // 4. Codebase files
  xml += `  <codebase>\n`;
  files.forEach(f => {
    xml += `    <file path="${escapeXml(f.path)}" mode="${escapeXml(f.mode)}" tokens="${f.tokens || 0}">\n`;
    xml += `<![CDATA[\n${escapeCData(f.content)}\n]]>\n`;
    xml += `    </file>\n`;
  });
  xml += `  </codebase>\n`;

  // 5. User prompt (suffix)
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
  userInstructions = '',
  userPrompt = '',
  files = []
}) {
  const filePaths = files.map(f => f.path);
  const asciiTree = generateAsciiTree(repositoryName, filePaths);

  let output = '';

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

  files.forEach(f => {
    output += `\n\n================================================================================\n`;
    output += `File: ${f.path} [Mode: ${f.mode}] [Tokens: ~${f.tokens || 0}]\n`;
    output += `================================================================================\n\n`;
    output += f.content;
  });

  if (userPrompt && userPrompt.trim()) {
    output += `\n\n================================================================================\n`;
    output += `USER PROMPT / TASK:\n`;
    output += `================================================================================\n`;
    output += `${userPrompt.trim()}\n`;
  }

  return output;
}
