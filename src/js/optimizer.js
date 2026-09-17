/**
 * optimizer.js - Token Minimization Pipeline
 * 
 * Features:
 * 1. Whitespace Normalization (tabs to spaces, trailing whitespace, collapsed newlines)
 * 2. Universal Comment Stripping (string-literal aware, multi-language support)
 * 3. Structural Skeletonization (preserves signatures, classes, interfaces, types, exports)
 */

import { getExtension } from './scanner.js';

/**
 * Whitespace Normalization
 * Replaces tabs with 2 spaces, strips line-end trailing whitespace, and collapses 3+ empty lines to 1.
 */
export function normalizeWhitespace(content) {
  if (!content) return '';
  return content
    // Replace tabs with 2 spaces
    .replace(/\t/g, '  ')
    // Strip trailing whitespace on each line
    .replace(/[ \t]+$/gm, '')
    // Collapse 3 or more consecutive newlines to at most 2 newlines (1 blank line)
    .replace(/\n{3,}/g, '\n\n')
    // Strip leading and trailing empty lines (preserving code indentation)
    .replace(/^[\r\n]+/, '')
    .replace(/[\r\n]+$/, '');
}

/**
 * Universal Comment Stripper
 * Uses a string-literal-aware scanner to avoid stripping inside quotes.
 */
export function stripComments(code, ext = 'js', options = {}) {
  if (!code) return '';
  const { preserveDocstrings = false } = options;
  const extension = (ext || '').toLowerCase();

  // Route by language family
  if (['py', 'python', 'pyw', 'pyi', 'rb', 'ruby', 'sh', 'bash', 'zsh', 'yaml', 'yml', 'r'].includes(extension)) {
    return stripPythonRubyShellComments(code, preserveDocstrings);
  }

  if (['html', 'htm', 'xml', 'svg'].includes(extension)) {
    return stripHtmlComments(code);
  }

  if (['sql', 'lua', 'hs', 'haskell'].includes(extension)) {
    return stripSqlLuaComments(code);
  }

  // Default to C-style (JS, TS, JSX, TSX, Java, C, C++, C#, Go, Rust, Kotlin, Swift, PHP, CSS, etc.)
  return stripCStyleComments(code, preserveDocstrings);
}

/**
 * C-Style comment stripper (JS/TS/C/C++/Java/Go/Rust/CSS)
 * Aware of single quotes, double quotes, and template literals (`...`)
 */
export function stripCStyleComments(code, preserveDocstrings = false) {
  let result = '';
  let i = 0;
  const n = code.length;

  while (i < n) {
    const ch = code[i];
    const next = code[i + 1];

    // Check string literals
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      result += quote;
      i++;
      while (i < n) {
        const c = code[i];
        result += c;
        if (c === '\\') {
          // Escape sequence, consume next char
          i++;
          if (i < n) result += code[i];
        } else if (c === quote) {
          break;
        }
        i++;
      }
      i++;
      continue;
    }

    // Check single-line comment //
    if (ch === '/' && next === '/') {
      i += 2;
      while (i < n && code[i] !== '\n') {
        i++;
      }
      continue;
    }

    // Check multi-line comment /* ... */
    if (ch === '/' && next === '*') {
      const isDoc = code.startsWith('/**', i);
      if (preserveDocstrings && isDoc) {
        result += '/**';
        i += 3;
        while (i < n && !(code[i] === '*' && code[i + 1] === '/')) {
          result += code[i];
          i++;
        }
        if (i < n) {
          result += '*/';
          i += 2;
        }
        continue;
      }

      i += 2;
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) {
        i++;
      }
      i += 2; // skip */
      continue;
    }

    result += ch;
    i++;
  }

  return result;
}

/**
 * Python / Ruby / Shell comment stripper
 * Aware of triple quotes (""" and '''), single/double quotes, and #
 */
export function stripPythonRubyShellComments(code, preserveDocstrings = false) {
  let result = '';
  let i = 0;
  const n = code.length;

  while (i < n) {
    // Check triple quotes
    if (code.startsWith('"""', i) || code.startsWith("'''", i)) {
      const quote = code.substring(i, i + 3);
      if (preserveDocstrings) {
        result += quote;
        i += 3;
        while (i < n && !code.startsWith(quote, i)) {
          if (code[i] === '\\') {
            result += code[i++];
            if (i < n) result += code[i];
          } else {
            result += code[i];
          }
          i++;
        }
        if (i < n) {
          result += quote;
          i += 3;
        }
      } else {
        // Strip docstring
        i += 3;
        while (i < n && !code.startsWith(quote, i)) {
          if (code[i] === '\\') i++;
          i++;
        }
        i += 3; // skip closing quote
      }
      continue;
    }

    // Check single/double quotes
    if (code[i] === '"' || code[i] === "'") {
      const q = code[i];
      result += q;
      i++;
      while (i < n) {
        const c = code[i];
        result += c;
        if (c === '\\') {
          i++;
          if (i < n) result += code[i];
        } else if (c === q) {
          break;
        }
        i++;
      }
      i++;
      continue;
    }

    // Check # comment
    if (code[i] === '#') {
      i++;
      while (i < n && code[i] !== '\n') {
        i++;
      }
      continue;
    }

    result += code[i];
    i++;
  }

  return result;
}

/**
 * SQL / Lua comment stripper (-- and block comments)
 */
export function stripSqlLuaComments(code) {
  let result = '';
  let i = 0;
  const n = code.length;

  while (i < n) {
    if (code[i] === "'" || code[i] === '"') {
      const q = code[i];
      result += q;
      i++;
      while (i < n && code[i] !== q) {
        result += code[i];
        if (code[i] === '\\') {
          i++;
          if (i < n) result += code[i];
        }
        i++;
      }
      if (i < n) result += code[i++];
      continue;
    }

    // SQL single-line --
    if (code[i] === '-' && code[i + 1] === '-') {
      i += 2;
      while (i < n && code[i] !== '\n') i++;
      continue;
    }

    // SQL multi-line /* */
    if (code[i] === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    result += code[i++];
  }

  return result;
}

/**
 * HTML/XML comment stripper (<!-- ... -->)
 */
export function stripHtmlComments(code) {
  return code.replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * Structural Skeletonizer for JavaScript / TypeScript
 * Preserves imports, exports, interfaces, types, class declarations, and function signatures.
 * Replaces function implementations with /* implementation omitted * /
 */
export function skeletonizeJsTs(code) {
  const lines = code.split('\n');
  const skeletonLines = [];
  let inBlock = 0;
  let blockHeader = '';
  let captureDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Preserve imports, exports, types, interfaces, package definitions
    if (
      trimmed.startsWith('import ') ||
      trimmed.startsWith('export type ') ||
      trimmed.startsWith('export interface ') ||
      trimmed.startsWith('interface ') ||
      trimmed.startsWith('type ') ||
      trimmed.startsWith('declare ')
    ) {
      skeletonLines.push(line);
      continue;
    }

    // Detect function / method / class declaration
    const isFunctionHeader =
      /^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*[\*]?\s*[a-zA-Z0-9_$]*\s*\(/i.test(trimmed) ||
      /^(?:export\s+)?(?:const|let|var)\s+[a-zA-Z0-9_$]+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/i.test(trimmed) ||
      /^(?:public|private|protected|static|async|\s)*[a-zA-Z0-9_$]+\s*\([^)]*\)\s*(?::\s*[^\{]+)?\s*\{/i.test(trimmed);

    const isClassHeader =
      /^(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+[a-zA-Z0-9_$]+/i.test(trimmed);

    if (isClassHeader) {
      skeletonLines.push(line);
      continue;
    }

    if (isFunctionHeader) {
      const openBraceIndex = line.indexOf('{');
      if (openBraceIndex !== -1) {
        const header = line.substring(0, openBraceIndex).trimEnd();
        skeletonLines.push(`${header} { /* implementation omitted */ }`);
        // Track braces if multiline
        const openCount = (line.match(/\{/g) || []).length;
        const closeCount = (line.match(/\}/g) || []).length;
        if (openCount > closeCount) {
          inBlock += (openCount - closeCount);
        }
        continue;
      } else {
        // Function declaration spanning multiple lines or ending with semicolon (TypeScript)
        skeletonLines.push(line);
        continue;
      }
    }

    if (inBlock > 0) {
      const openCount = (line.match(/\{/g) || []).length;
      const closeCount = (line.match(/\}/g) || []).length;
      inBlock += openCount - closeCount;
      if (inBlock <= 0) {
        inBlock = 0;
      }
      continue;
    }

    // Top-level variable exports or constants
    if (/^(?:export\s+)?(?:const|let|var)\s+[a-zA-Z0-9_$]+(?:\s*:\s*[^=;]+)?(?:\s*=.*)?;?$/.test(trimmed)) {
      if (trimmed.includes('(') && trimmed.includes('=>')) {
        // Arrow function
        const arrowIdx = line.indexOf('=>');
        const signature = line.substring(0, arrowIdx + 2);
        skeletonLines.push(`${signature} { /* implementation omitted */ }`);
      } else {
        skeletonLines.push(line);
      }
      continue;
    }

    // Keep closing braces of classes / namespaces
    if (trimmed === '}' || trimmed === '};') {
      skeletonLines.push(line);
    }
  }

  return skeletonLines.join('\n');
}

/**
 * Structural Skeletonizer for Python
 * Preserves imports, classes, methods, and functions.
 * Replaces bodies with `pass  # implementation omitted`
 */
export function skeletonizePython(code) {
  const lines = code.split('\n');
  const result = [];
  let skippingIndentedBlock = false;
  let blockIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      if (!skippingIndentedBlock) result.push('');
      continue;
    }

    const currentIndent = line.search(/\S/);

    if (skippingIndentedBlock) {
      if (currentIndent > blockIndent) {
        // Inside omitted block
        continue;
      } else {
        skippingIndentedBlock = false;
      }
    }

    // Preserve imports and module constants
    if (
      trimmed.startsWith('import ') ||
      trimmed.startsWith('from ') ||
      trimmed.startsWith('@') || // Decorators
      /^[A-Z_0-9]+\s*[:=]/.test(trimmed)
    ) {
      result.push(line);
      continue;
    }

    // Class header
    if (/^class\s+[a-zA-Z0-9_]+(?:\([^)]*\))?:/.test(trimmed)) {
      result.push(line);
      continue;
    }

    // Function/method definition
    if (/^(?:async\s+)?def\s+[a-zA-Z0-9_]+\s*\([^)]*\)(?:\s*->\s*[^:]+)?:/.test(trimmed)) {
      result.push(line);
      const indentStr = ' '.repeat(currentIndent + 4);
      result.push(`${indentStr}pass  # implementation omitted`);
      skippingIndentedBlock = true;
      blockIndent = currentIndent;
      continue;
    }

    // If top-level statement outside class/def
    if (currentIndent === 0) {
      result.push(line);
    }
  }

  return result.join('\n');
}

/**
 * Structural Skeletonizer for Go / Rust / Java / C#
 */
export function skeletonizeCurlyBraceLangs(code) {
  const lines = code.split('\n');
  const result = [];
  let inFunction = false;
  let braceCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Preserve package, imports, structs, interfaces, traits, enums
    if (
      trimmed.startsWith('package ') ||
      trimmed.startsWith('import ') ||
      trimmed.startsWith('using ') ||
      trimmed.startsWith('use ') ||
      /^(?:pub\s+)?struct\s+/i.test(trimmed) ||
      /^(?:pub\s+)?interface\s+/i.test(trimmed) ||
      /^(?:pub\s+)?trait\s+/i.test(trimmed) ||
      /^(?:pub\s+)?enum\s+/i.test(trimmed) ||
      /^(?:pub\s+)?impl\s+/i.test(trimmed) ||
      /^(?:public|private|protected)?\s*class\s+/i.test(trimmed)
    ) {
      result.push(line);
      continue;
    }

    // Check function definition with opening brace
    const isFunc =
      /(?:func|fn|function|public|private|protected|static|void|int|string)\s+[a-zA-Z0-9_]+\s*\([^)]*\).*\{/i.test(trimmed);

    if (isFunc && !inFunction) {
      const braceIdx = line.indexOf('{');
      const signature = line.substring(0, braceIdx).trimEnd();
      result.push(`${signature} { /* implementation omitted */ }`);
      const open = (line.match(/\{/g) || []).length;
      const close = (line.match(/\}/g) || []).length;
      if (open > close) {
        inFunction = true;
        braceCount = open - close;
      }
      continue;
    }

    if (inFunction) {
      const open = (line.match(/\{/g) || []).length;
      const close = (line.match(/\}/g) || []).length;
      braceCount += open - close;
      if (braceCount <= 0) {
        inFunction = false;
        braceCount = 0;
      }
      continue;
    }

    if (trimmed === '}' || trimmed === '};') {
      result.push(line);
    }
  }

  return result.join('\n');
}

/**
 * Universal Skeletonizer dispatcher
 */
export function skeletonizeCode(code, ext = 'js') {
  if (!code) return '';
  const extension = (ext || '').toLowerCase();

  if (['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'vue', 'svelte'].includes(extension)) {
    return normalizeWhitespace(skeletonizeJsTs(code));
  }

  if (['py', 'python', 'pyw', 'pyi'].includes(extension)) {
    return normalizeWhitespace(skeletonizePython(code));
  }

  if (['go', 'rs', 'rust', 'java', 'cs', 'cpp', 'c', 'h', 'hpp', 'kt', 'swift', 'php'].includes(extension)) {
    return normalizeWhitespace(skeletonizeCurlyBraceLangs(code));
  }

  // Fallback: strip comments and collapse empty lines
  return normalizeWhitespace(stripComments(code, extension));
}

/**
 * Main Pipeline Optimizer function
 * @param {string} content - Raw file code
 * @param {string} filePath - Path of the file (to determine extension)
 * @param {'full'|'compressed'|'skeleton'} mode - Optimization mode
 * @param {Object} options - Configuration options
 * @returns {string} Optimized code
 */
export function optimizeContent(content, filePath, mode = 'full', options = {}) {
  if (!content) return '';
  const ext = getExtension(filePath);

  switch (mode) {
    case 'skeleton':
      return skeletonizeCode(content, ext);

    case 'compressed':
      return normalizeWhitespace(stripComments(content, ext, options));

    case 'full':
    default:
      return normalizeWhitespace(content);
  }
}
