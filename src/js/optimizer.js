/**
 * optimizer.js - Token Minimization Pipeline
 * 
 * Features:
 * 1. Whitespace Normalization & Aggressive Line Collapsing
 * 2. Lexer-Safe Universal Comment Stripping (Regex-literal & template-literal ${} aware)
 * 3. Lexer-Safe Structural Skeletonization (Multi-line signatures & string-ignoring brace counter)
 * 4. Inline SVG Path Stripping & JSON Compaction
 */

import { getExtension } from './scanner.js';

/**
 * Whitespace Normalization
 * @param {string} content
 * @param {boolean} aggressive - If true (compressed/skeleton), collapses all \n{2,} to single \n
 */
export function normalizeWhitespace(content, aggressive = false) {
  if (!content) return '';
  let result = content
    // Replace tabs with 2 spaces
    .replace(/\t/g, '  ')
    // Strip trailing whitespace on each line
    .replace(/[ \t]+$/gm, '');

  if (aggressive) {
    // Collapse all multiple empty lines to a single newline
    result = result.replace(/\n{2,}/g, '\n');
  } else {
    // Collapse 3+ consecutive newlines to at most 2 newlines (1 blank line)
    result = result.replace(/\n{3,}/g, '\n\n');
  }

  // Strip leading and trailing empty lines (preserving code indentation on first line)
  return result
    .replace(/^[\r\n]+/, '')
    .replace(/[\r\n]+$/, '');
}

/**
 * Checks if a word is an expression keyword in JS/TS after which a '/' can be a regex
 */
const REGEX_PRECEDING_KEYWORDS = new Set([
  'return', 'case', 'typeof', 'void', 'delete', 'throw',
  'instanceof', 'in', 'of', 'yield', 'await', 'else'
]);

/**
 * C-Style comment stripper (JS/TS/C/C++/Java/Go/Rust/CSS/PHP/Swift/Kotlin)
 * 
 * Lexer-safe:
 * - Recognizes JavaScript Regular Expression literals /.../[flags]
 * - Recognizes template literals `...` with nested ${ ... } expressions
 * - Ignores comments inside strings and regexes
 */
export function stripCStyleComments(code, preserveDocstrings = false) {
  if (!code) return '';
  let result = '';
  let i = 0;
  const n = code.length;

  // Stack of token types for template literal interpolation tracking: 'template' | 'brace'
  const interpStack = [];

  // Track the last non-whitespace character / token to distinguish division from regex
  let lastToken = '';
  let lastChar = '';

  function isRegexAllowedBefore() {
    if (!lastToken && !lastChar) return true;
    if (REGEX_PRECEDING_KEYWORDS.has(lastToken)) return true;
    // Punctuation after which an expression starts
    return /[=([,{:;!&|?~^+\-*%<>\n]/.test(lastChar);
  }

  while (i < n) {
    const ch = code[i];
    const next = code[i + 1];

    // 1. String literals: Single or Double Quotes
    if (ch === '"' || ch === "'") {
      const quote = ch;
      result += quote;
      i++;
      while (i < n) {
        const c = code[i];
        result += c;
        if (c === '\\') {
          i++;
          if (i < n) result += code[i];
        } else if (c === quote || c === '\n') {
          break;
        }
        i++;
      }
      i++;
      lastToken = 'string';
      lastChar = quote;
      continue;
    }

    // 2. Template Literals (`...`)
    if (ch === '`') {
      result += '`';
      i++;
      while (i < n) {
        const c = code[i];

        // Check for interpolation start: ${
        if (c === '$' && code[i + 1] === '{') {
          result += '${';
          i += 2;
          interpStack.push('template');
          break; // Exit string mode, back to main code loop for the expression!
        }

        result += c;
        if (c === '\\') {
          i++;
          if (i < n) result += code[i];
        } else if (c === '`') {
          i++;
          break;
        }
        i++;
      }
      lastToken = 'template';
      lastChar = '`';
      continue;
    }

    // 3. Closing brace } inside template literal interpolation
    if (ch === '}' && interpStack.length > 0) {
      const top = interpStack.pop();
      if (top === 'template') {
        // Resuming template string
        result += '}';
        i++;
        while (i < n) {
          const c = code[i];
          if (c === '$' && code[i + 1] === '{') {
            result += '${';
            i += 2;
            interpStack.push('template');
            break;
          }
          result += c;
          if (c === '\\') {
            i++;
            if (i < n) result += code[i];
          } else if (c === '`') {
            i++;
            break;
          }
          i++;
        }
        lastToken = 'template';
        lastChar = '`';
        continue;
      }
    }

    // 4. Single-line comment: //
    if (ch === '/' && next === '/') {
      i += 2;
      while (i < n && code[i] !== '\n') {
        i++;
      }
      continue;
    }

    // 5. Multi-line comment: /* ... */
    if (ch === '/' && next === '*') {
      const isDoc = code.startsWith('/**', i);
      if (preserveDocstrings && isDoc) {
        result += '/**';
        i += 3;
        while (i < n && !(code[i] === '*' && code[i + 1] === '/')) {
          result += code[i++];
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

    // 6. Regular Expression Literal: /.../[flags]
    if (ch === '/' && next !== '/' && next !== '*' && next !== '=' && isRegexAllowedBefore()) {
      let isRegex = true;
      let regexStr = '/';
      let j = i + 1;
      let inClass = false; // [...] character class

      while (j < n) {
        const rc = code[j];
        if (rc === '\n') {
          isRegex = false;
          break; // Regex cannot span unescaped newlines
        }
        regexStr += rc;
        if (rc === '\\') {
          j++;
          if (j < n) regexStr += code[j];
        } else if (rc === '[') {
          inClass = true;
        } else if (rc === ']' && inClass) {
          inClass = false;
        } else if (rc === '/' && !inClass) {
          j++;
          // Consume flags: g, i, m, s, u, y, d
          while (j < n && /[a-z]/i.test(code[j])) {
            regexStr += code[j++];
          }
          break;
        }
        j++;
      }

      if (isRegex) {
        result += regexStr;
        i = j;
        lastToken = 'regex';
        lastChar = '/';
        continue;
      }
    }

    // Track braces inside interpolation expressions
    if (ch === '{' && interpStack.length > 0) {
      interpStack.push('brace');
    }

    result += ch;

    if (!/\s/.test(ch)) {
      lastChar = ch;
      if (/[a-zA-Z0-9_$]/.test(ch)) {
        lastToken += ch;
      } else {
        lastToken = '';
      }
    } else if (ch === '\n') {
      lastChar = '\n';
      lastToken = '';
    }

    i++;
  }

  return result;
}

/**
 * Python / Ruby / Shell comment stripper
 */
export function stripPythonRubyShellComments(code, preserveDocstrings = false) {
  if (!code) return '';
  let result = '';
  let i = 0;
  const n = code.length;

  while (i < n) {
    // Triple quotes
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
        i += 3;
        while (i < n && !code.startsWith(quote, i)) {
          if (code[i] === '\\') i++;
          i++;
        }
        i += 3;
      }
      continue;
    }

    // Single/double quotes
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
        } else if (c === q || c === '\n') {
          break;
        }
        i++;
      }
      i++;
      continue;
    }

    // # comment
    if (code[i] === '#') {
      i++;
      while (i < n && code[i] !== '\n') {
        i++;
      }
      continue;
    }

    result += code[i++];
  }

  return result;
}

/**
 * SQL / Lua comment stripper (-- and block comments)
 */
export function stripSqlLuaComments(code) {
  if (!code) return '';
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

    // SQL multi-line /* ... */
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
  if (!code) return '';
  return code.replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * Universal Comment Stripper dispatcher
 */
export function stripComments(code, ext = 'js', options = {}) {
  if (!code) return '';
  const { preserveDocstrings = false } = options;
  const extension = (ext || '').toLowerCase();

  if (['py', 'python', 'pyw', 'pyi', 'rb', 'ruby', 'sh', 'bash', 'zsh', 'yaml', 'yml', 'r'].includes(extension)) {
    return stripPythonRubyShellComments(code, preserveDocstrings);
  }

  if (['html', 'htm', 'xml', 'svg'].includes(extension)) {
    return stripHtmlComments(code);
  }

  if (['sql', 'lua', 'hs', 'haskell'].includes(extension)) {
    return stripSqlLuaComments(code);
  }

  // Default to C-style
  return stripCStyleComments(code, preserveDocstrings);
}

/**
 * Strips long inline SVG path data (d="..." > 80 chars) to save thousands of tokens
 */
export function stripSvgPaths(content) {
  if (!content) return '';
  return content.replace(
    /(<svg\b[^>]*>)([\s\S]*?)(<\/svg>)/gi,
    (match, openTag, inner, closeTag) => {
      // If inner contains massive path data (e.g., d="M12 2C..." > 80 chars)
      if (/d=["'][^"']{80,}["']/i.test(inner)) {
        return `${openTag}<!-- icon omitted -->${closeTag}`;
      }
      return match;
    }
  );
}

/**
 * Compacts JSON files
 * In compressed mode: parses and stringifies to single line.
 * In skeleton mode: summarizes large arrays.
 */
export function compactJson(content, mode = 'compressed') {
  if (!content) return '';
  try {
    const parsed = JSON.parse(content);
    if (mode === 'skeleton') {
      // Truncate large arrays
      const truncateArrays = (obj) => {
        if (Array.isArray(obj)) {
          if (obj.length > 3) {
            return [obj[0], `/* ... ${obj.length - 1} more items omitted */`];
          }
          return obj.map(truncateArrays);
        }
        if (obj && typeof obj === 'object') {
          const res = {};
          for (const k of Object.keys(obj)) {
            res[k] = truncateArrays(obj[k]);
          }
          return res;
        }
        return obj;
      };
      return JSON.stringify(truncateArrays(parsed), null, 2);
    }
    // Compressed mode: single line
    return JSON.stringify(parsed);
  } catch (_) {
    // If invalid JSON, fallback to whitespace normalization
    return normalizeWhitespace(content, mode === 'compressed');
  }
}

/**
 * Counts structural { and } braces in a line of code,
 * strictly ignoring braces inside string literals ('...', "...", `...`) and regexes.
 */
export function countStructuralBraces(line) {
  let open = 0;
  let close = 0;
  let i = 0;
  const n = line.length;

  while (i < n) {
    const ch = line[i];

    // Single / double quote string
    if (ch === '"' || ch === "'") {
      const q = ch;
      i++;
      while (i < n && line[i] !== q) {
        if (line[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }

    // Template literal
    if (ch === '`') {
      i++;
      while (i < n && line[i] !== '`') {
        if (line[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }

    // Braces
    if (ch === '{') open++;
    else if (ch === '}') close++;

    i++;
  }

  return { open, close, delta: open - close };
}

/**
 * Structural Skeletonizer for JavaScript / TypeScript
 * Preserves imports, exports, interfaces, types, class declarations, and function signatures.
 * Robust against braces in strings, multi-line signatures, and template literals.
 */
export function skeletonizeJsTs(code) {
  // Strip comments first to prevent commented braces from desynchronizing inBlock
  const cleanCode = stripCStyleComments(code, false);
  const lines = cleanCode.split('\n');
  const skeletonLines = [];

  let inBlock = 0;
  let accumulatingSignature = false;
  let signatureBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (inBlock > 0) {
      const { delta } = countStructuralBraces(line);
      inBlock += delta;
      if (inBlock <= 0) {
        inBlock = 0;
      }
      continue;
    }

    // If accumulating a multi-line function signature
    if (accumulatingSignature) {
      signatureBuffer.push(line);
      const combined = signatureBuffer.join('\n');
      const lastParen = combined.lastIndexOf(')');
      const openBraceIdx = lastParen !== -1 ? combined.indexOf('{', lastParen) : -1;

      if (openBraceIdx !== -1) {
        const header = combined.substring(0, openBraceIdx).trimEnd();
        skeletonLines.push(`${header} { /* implementation omitted */ }`);

        const { delta } = countStructuralBraces(combined);
        inBlock = Math.max(0, delta);
        accumulatingSignature = false;
        signatureBuffer = [];
      } else if (trimmed.endsWith(';')) {
        // TypeScript declare or interface method
        skeletonLines.push(signatureBuffer.join('\n'));
        accumulatingSignature = false;
        signatureBuffer = [];
      }
      continue;
    }

    if (!trimmed) {
      skeletonLines.push('');
      continue;
    }

    // Preserve module declarations, imports, types, interfaces
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

    // Class header
    if (/^(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+[a-zA-Z0-9_$]+/i.test(trimmed)) {
      skeletonLines.push(line);
      continue;
    }

    // Detect function / method / constructor declaration
    const isFuncStart =
      /^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*[a-zA-Z0-9_$]*\s*\(/i.test(trimmed) ||
      /^(?:export\s+)?(?:const|let|var)\s+[a-zA-Z0-9_$]+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/i.test(trimmed) ||
      /^(?:public|private|protected|static|async|\s)*[a-zA-Z0-9_$]+\s*\(/i.test(trimmed);

    if (isFuncStart) {
      const lastParen = line.lastIndexOf(')');
      const openBraceIndex = lastParen !== -1 ? line.indexOf('{', lastParen) : -1;

      if (openBraceIndex !== -1) {
        const header = line.substring(0, openBraceIndex).trimEnd();
        skeletonLines.push(`${header} { /* implementation omitted */ }`);

        const { delta } = countStructuralBraces(line);
        inBlock = Math.max(0, delta);
        continue;
      } else {
        // Multi-line signature started
        accumulatingSignature = true;
        signatureBuffer = [line];
        continue;
      }
    }

    // Arrow function variable exports
    if (/^(?:export\s+)?(?:const|let|var)\s+[a-zA-Z0-9_$]+/.test(trimmed)) {
      if (trimmed.includes('=>') && trimmed.includes('{')) {
        const braceIdx = line.indexOf('{');
        const header = line.substring(0, braceIdx).trimEnd();
        skeletonLines.push(`${header} { /* implementation omitted */ }`);
        const { delta } = countStructuralBraces(line);
        inBlock = Math.max(0, delta);
      } else {
        skeletonLines.push(line);
      }
      continue;
    }

    // Class closing brace
    if (trimmed === '}' || trimmed === '};') {
      skeletonLines.push(line);
    }
  }

  return skeletonLines.join('\n');
}

/**
 * Structural Skeletonizer for Python
 */
export function skeletonizePython(code) {
  const cleanCode = stripPythonRubyShellComments(code, true);
  const lines = cleanCode.split('\n');
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
        continue;
      } else {
        skippingIndentedBlock = false;
      }
    }

    // Preserve imports and module constants
    if (
      trimmed.startsWith('import ') ||
      trimmed.startsWith('from ') ||
      trimmed.startsWith('@') ||
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
  const cleanCode = stripCStyleComments(code, false);
  const lines = cleanCode.split('\n');
  const result = [];
  let inFunction = false;
  let braceCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();

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

    const isFunc =
      /(?:func|fn|function|public|private|protected|static|void|int|string)\s+[a-zA-Z0-9_]+\s*\([^)]*\).*\{/i.test(trimmed);

    if (isFunc && !inFunction) {
      const braceIdx = line.indexOf('{');
      const signature = line.substring(0, braceIdx).trimEnd();
      result.push(`${signature} { /* implementation omitted */ }`);
      const { delta } = countStructuralBraces(line);
      if (delta > 0) {
        inFunction = true;
        braceCount = delta;
      }
      continue;
    }

    if (inFunction) {
      const { delta } = countStructuralBraces(line);
      braceCount += delta;
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

  if (extension === 'json') {
    return compactJson(code, 'skeleton');
  }

  if (['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'vue', 'svelte'].includes(extension)) {
    return normalizeWhitespace(skeletonizeJsTs(code), true);
  }

  if (['py', 'python', 'pyw', 'pyi'].includes(extension)) {
    return normalizeWhitespace(skeletonizePython(code), true);
  }

  if (['go', 'rs', 'rust', 'java', 'cs', 'cpp', 'c', 'h', 'hpp', 'kt', 'swift', 'php'].includes(extension)) {
    return normalizeWhitespace(skeletonizeCurlyBraceLangs(code), true);
  }

  // Fallback: strip comments and collapse empty lines aggressively
  return normalizeWhitespace(stripComments(code, extension), true);
}

/**
 * Main Pipeline Optimizer function
 * @param {string} content - Raw file code
 * @param {string} filePath - Path of the file (to determine extension)
 * @param {'full'|'compressed'|'skeleton'|'duplicate'} mode - Optimization mode
 * @param {Object} options - Configuration options
 * @returns {string} Optimized code
 */
export function optimizeContent(content, filePath, mode = 'full', options = {}) {
  if (!content) return '';
  const ext = getExtension(filePath);

  // If marked as duplicate, content is omitted
  if (mode === 'duplicate') {
    return '';
  }

  // Handle JSON
  if (ext === 'json') {
    if (mode === 'compressed') return compactJson(content, 'compressed');
    if (mode === 'skeleton') return compactJson(content, 'skeleton');
    return normalizeWhitespace(content, false);
  }

  // Handle SVG stripping in HTML/JSX/Vue/Svelte
  let processed = content;
  if ((mode === 'compressed' || mode === 'skeleton') && ['html', 'htm', 'jsx', 'tsx', 'vue', 'svelte'].includes(ext)) {
    processed = stripSvgPaths(processed);
  }

  switch (mode) {
    case 'skeleton':
      return skeletonizeCode(processed, ext);

    case 'compressed': {
      const stripped = stripComments(processed, ext, options);
      return normalizeWhitespace(stripped, true); // Aggressive newline collapsing
    }

    case 'full':
    default:
      return normalizeWhitespace(processed, false);
  }
}
