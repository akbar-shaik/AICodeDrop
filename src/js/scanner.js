/**
 * scanner.js - Directory Ingestion, .gitignore Parser, Token Sink Purge, Secret Sanitizer & Content Deduplication
 */

// Zero-Value Token Sinks: Lockfiles and Minified code
export const BLOCKLISTED_FILES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'cargo.lock',
  'composer.lock',
  'gemfile.lock',
  'poetry.lock',
  'bun.lockb',
  'flake.lock'
]);

export const BLOCKLISTED_PATTERNS = [
  /\.min\.(js|css)$/i,
  /\.bundle\.(js|css)$/i,
  /\.chunk\.(js|css)$/i,
  /\.map$/i
];

// Binary and non-source file extensions
export const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp', 'tiff', 'svg',
  'mp3', 'wav', 'ogg', 'mp4', 'webm', 'avi', 'mov', 'mkv',
  'pdf', 'zip', 'tar', 'gz', '7z', 'rar', 'bz2', 'xz',
  'exe', 'dll', 'so', 'dylib', 'bin', 'iso', 'dmg',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'pyc', 'pyo', 'pyd', 'class', 'o', 'obj', 'jar', 'war',
  'sqlite', 'db', 'duckdb'
]);

// Default ignored directories (case-insensitive check)
export const DEFAULT_IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', '.nuxt', 'dist', 'build', 'out',
  '__pycache__', 'venv', '.venv', 'env', '.env', '.idea', '.vscode',
  '.turbo', '.cache', 'coverage', '.svn', '.hg', 'deploy', '.netlify'
]);

export function isDefaultIgnoredDir(dirName) {
  if (!dirName) return false;
  return DEFAULT_IGNORE_DIRS.has(dirName.toLowerCase());
}

// Supported source extensions for code processing
export const ALLOWED_EXTENSIONS = new Set([
  'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'vue', 'svelte', 'astro',
  'html', 'htm', 'css', 'scss', 'sass', 'less',
  'py', 'pyw', 'pyi', 'go', 'rs', 'java', 'kt', 'kts', 'swift',
  'c', 'h', 'cpp', 'cc', 'cxx', 'hpp', 'hh', 'hxx', 'cs', 'php',
  'rb', 'rake', 'lua', 'sh', 'bash', 'zsh', 'ps1', 'sql',
  'json', 'yaml', 'yml', 'toml', 'xml', 'md', 'markdown',
  'graphql', 'gql', 'proto', 'dockerfile', 'makefile', 'env'
]);

// Manifest files to auto-extract for project architecture summary
export const MANIFEST_FILENAMES = new Set([
  'package.json',
  'pyproject.toml',
  'requirements.txt',
  'cargo.toml',
  'go.mod',
  'pom.xml',
  'build.gradle',
  'gemfile',
  'composer.json'
]);

export const MAX_INDIVIDUAL_FILE_SIZE = 2 * 1024 * 1024; // 2MB safety ceiling

/**
 * Fast 64-bit FNV-1a Hash for deterministic content deduplication
 */
export function computeContentHash(content) {
  if (!content) return '0000000000000000';
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < content.length; i++) {
    const ch = content.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x1000193);
    h2 = Math.imul(h2 ^ (ch >>> 8), 0x811c9dc5);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

/**
 * Compiles a single .gitignore line into a RegExp scoped to an optional folder prefix
 */
export function parseGitignoreRule(rawLine, scopePrefix = '') {
  let line = rawLine.trim();
  if (!line || line.startsWith('#')) return null;

  let isNegated = false;
  if (line.startsWith('!')) {
    isNegated = true;
    line = line.substring(1).trim();
  }

  const isDirectoryOnly = line.endsWith('/');
  if (isDirectoryOnly) {
    line = line.slice(0, -1);
  }

  const isRootAnchored = line.startsWith('/');
  if (isRootAnchored) {
    line = line.substring(1);
  }

  // Prepend scope prefix if nested .gitignore
  if (scopePrefix) {
    line = scopePrefix.replace(/^\/+|\/+$/g, '') + '/' + line;
  }

  // Escape special regex chars except * and ?
  let regexStr = line
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '§§GLOBSTAR§§')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/§§GLOBSTAR§§/g, '.*');

  if (isRootAnchored || scopePrefix) {
    regexStr = '^' + regexStr;
  } else {
    regexStr = '(?:^|/)' + regexStr;
  }

  if (isDirectoryOnly) {
    regexStr += '(?:/|$)';
  } else {
    regexStr += '(?:$|/)';
  }

  try {
    return {
      regex: new RegExp(regexStr),
      isNegated,
      isDirectoryOnly,
      raw: rawLine
    };
  } catch (e) {
    return null;
  }
}

/**
 * Parses .gitignore file content into matcher rules
 */
export function compileGitignore(gitignoreContent, scopePrefix = '') {
  if (!gitignoreContent) return () => false;

  const lines = gitignoreContent.split(/\r?\n/);
  const rules = [];

  for (const line of lines) {
    const rule = parseGitignoreRule(line, scopePrefix);
    if (rule) rules.push(rule);
  }

  return function isIgnored(relativePath, isDirectory = false) {
    const normalized = relativePath.replace(/\\/g, '/').replace(/^\//, '');
    let ignored = false;

    for (const rule of rules) {
      if (rule.isDirectoryOnly && !isDirectory && !normalized.endsWith('/')) {
        continue;
      }
      if (rule.regex.test(normalized)) {
        ignored = !rule.isNegated;
      }
    }
    return ignored;
  };
}

/**
 * Scoped Gitignore Manager for multiple / nested .gitignore files
 */
export class GitignoreManager {
  constructor() {
    this.matchers = [];
  }

  addRules(content, scopePrefix = '') {
    if (!content) return;
    this.matchers.push(compileGitignore(content, scopePrefix));
  }

  isIgnored(path, isDirectory = false) {
    for (const matcher of this.matchers) {
      if (matcher(path, isDirectory)) return true;
    }
    return false;
  }
}

/**
 * Automated Secret Sanitizer
 * Redacts tokens, access keys, private keys, and passwords.
 */
export function sanitizeSecrets(content) {
  if (!content || typeof content !== 'string') return '';

  let sanitized = content;

  // 1. Private keys
  sanitized = sanitized.replace(
    /-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z0-9_-]+ )?PRIVATE KEY-----/g,
    '/* <REDACTED_PRIVATE_KEY> */'
  );

  // 2. Telegram Bot Tokens
  sanitized = sanitized.replace(/\b\d{8,10}:[A-Za-z0-9_-]{35}\b/g, '<REDACTED_TELEGRAM_TOKEN>');

  // 3. AWS Access Keys
  sanitized = sanitized.replace(/\b(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g, '<REDACTED_AWS_ACCESS_KEY>');

  // 4. GitHub Personal Access Tokens
  sanitized = sanitized.replace(/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}\b/g, '<REDACTED_GITHUB_TOKEN>');
  sanitized = sanitized.replace(/\bgithub_pat_[A-Za-z0-9_]{82}\b/g, '<REDACTED_GITHUB_TOKEN>');

  // 5. OpenAI / Anthropic / AI API Keys
  sanitized = sanitized.replace(/\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{32,}\b/g, '<REDACTED_AI_KEY>');

  // 6. Generic password / secret assignments in code/configs (.env, json, js, py)
  sanitized = sanitized.replace(
    /((?:api[_-]?key|secret(?:[_-]?key)?|client[_-]?secret|password|passwd|auth[_-]?token|db[_-]?password|access[_-]?token)\s*[:=]\s*['"])(?!<REDACTED_)([^'"]+)(['"])/gi,
    '$1<REDACTED_SECRET>$3'
  );

  return sanitized;
}

/**
 * Checks if a file is a zero-value token sink or binary
 */
export function isZeroValueSink(fileName) {
  const lower = fileName.toLowerCase();
  if (BLOCKLISTED_FILES.has(lower)) return true;
  for (const pat of BLOCKLISTED_PATTERNS) {
    if (pat.test(lower)) return true;
  }
  const ext = getExtension(lower);
  if (BINARY_EXTENSIONS.has(ext)) return true;
  return false;
}

/**
 * Extracts file extension without dot
 */
export function getExtension(fileName) {
  const base = fileName.split('/').pop().split('\\').pop();
  const lastDot = base.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) {
    return base.startsWith('.') ? base.substring(1).toLowerCase() : '';
  }
  return base.substring(lastDot + 1).toLowerCase();
}

/**
 * Checks if file is eligible for inclusion
 */
export function isEligibleFile(fileName) {
  const base = fileName.split('/').pop().split('\\').pop();
  if (isZeroValueSink(base)) return false;

  const ext = getExtension(base);
  if (ALLOWED_EXTENSIONS.has(ext)) return true;
  if (base.toLowerCase() === '.env' || base.toLowerCase().startsWith('.env.')) return true;
  if (base.toLowerCase() === 'dockerfile' || base.toLowerCase() === 'makefile') return true;

  return false;
}

/**
 * Traverses a FileSystemEntry hierarchy (drag and drop)
 * Supports multiple dropped folders/files and nested .gitignore files.
 */
export async function scanFileSystemEntries(items, onProgress) {
  const filesMap = new Map(); // relativePath -> File
  const gitignoreManager = new GitignoreManager();
  let rootFolderName = 'project';
  let primaryGitignoreContent = null;

  async function readAllDirEntries(dirReader) {
    const entries = [];
    let batch = await new Promise((res, rej) => dirReader.readEntries(res, rej));
    while (batch && batch.length > 0) {
      entries.push(...batch);
      batch = await new Promise((res, rej) => dirReader.readEntries(res, rej));
    }
    return entries;
  }

  // Phase 1: Scan for root .gitignore across all dropped items
  for (const item of items) {
    const entry = typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : item;
    if (!entry) continue;

    if (entry.isDirectory) {
      if (rootFolderName === 'project') {
        rootFolderName = entry.name;
      }
      try {
        const dirReader = entry.createReader();
        const firstLevelEntries = await readAllDirEntries(dirReader);
        const giEntry = firstLevelEntries.find(e => e.isFile && e.name === '.gitignore');
        if (giEntry) {
          const giFile = await new Promise((res, rej) => giEntry.file(res, rej));
          const text = await giFile.text();
          gitignoreManager.addRules(text, '');
          if (!primaryGitignoreContent) primaryGitignoreContent = text;
          if (onProgress) onProgress({ type: 'gitignore_found', name: '.gitignore' });
        }
      } catch (_) {}
    }
  }

  // Phase 2: Traverse all files & folders recursively
  async function traverse(entry, currentPath = '') {
    if (!entry) return;

    if (entry.isDirectory) {
      if (isDefaultIgnoredDir(entry.name)) {
        if (onProgress) onProgress({ type: 'ignored_dir', path: currentPath + entry.name });
        return;
      }

      if (gitignoreManager.isIgnored(currentPath + entry.name, true)) {
        if (onProgress) onProgress({ type: 'gitignore_ignored', path: currentPath + entry.name });
        return;
      }

      const reader = entry.createReader();
      const entries = await readAllDirEntries(reader);

      // Check for nested .gitignore in this folder
      const nestedGi = entries.find(e => e.isFile && e.name === '.gitignore');
      if (nestedGi) {
        try {
          const giFile = await new Promise((res, rej) => nestedGi.file(res, rej));
          const text = await giFile.text();
          gitignoreManager.addRules(text, currentPath + entry.name);
          if (onProgress) onProgress({ type: 'gitignore_found', name: `${currentPath}${entry.name}/.gitignore` });
        } catch (_) {}
      }

      for (const child of entries) {
        await traverse(child, currentPath + entry.name + '/');
      }
    } else if (entry.isFile) {
      const relPath = currentPath + entry.name;

      if (isZeroValueSink(entry.name)) {
        if (onProgress) onProgress({ type: 'sink_purged', path: relPath });
        return;
      }

      if (gitignoreManager.isIgnored(relPath, false)) {
        if (onProgress) onProgress({ type: 'gitignore_ignored', path: relPath });
        return;
      }

      if (!isEligibleFile(entry.name)) {
        return;
      }

      try {
        const file = await new Promise((res, rej) => entry.file(res, rej));
        if (file.size > MAX_INDIVIDUAL_FILE_SIZE) {
          if (onProgress) onProgress({ type: 'oversized', path: relPath, size: file.size });
          return;
        }

        filesMap.set(relPath, file);
        if (onProgress) onProgress({ type: 'file_added', path: relPath, size: file.size });
      } catch (err) {
        if (onProgress) onProgress({ type: 'read_error', path: relPath, error: err.message });
      }
    }
  }

  for (const item of items) {
    const entry = typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : item;
    if (entry) {
      await traverse(entry, '');
    }
  }

  return { rootFolderName, filesMap, gitignoreContent: primaryGitignoreContent };
}

/**
 * Processes files from standard input (<input type="file" webkitdirectory>)
 */
export async function scanFileList(fileList, onProgress) {
  const filesMap = new Map();
  const gitignoreManager = new GitignoreManager();
  let rootFolderName = 'project';
  let primaryGitignoreContent = null;

  if (!fileList || fileList.length === 0) {
    return { rootFolderName, filesMap, gitignoreContent: null };
  }

  const firstPath = fileList[0].webkitRelativePath || fileList[0].name;
  if (firstPath.includes('/')) {
    rootFolderName = firstPath.split('/')[0];
  }

  // Pre-pass: Find all .gitignore files (root and nested)
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const rawPath = file.webkitRelativePath || file.name;
    const relPath = rawPath.includes('/')
      ? rawPath.substring(rawPath.indexOf('/') + 1)
      : rawPath;

    if (relPath.endsWith('.gitignore')) {
      try {
        const text = await file.text();
        const scope = relPath === '.gitignore' ? '' : relPath.replace(/\.gitignore$/, '');
        gitignoreManager.addRules(text, scope);
        if (relPath === '.gitignore' && !primaryGitignoreContent) {
          primaryGitignoreContent = text;
        }
        if (onProgress) onProgress({ type: 'gitignore_found', name: relPath });
      } catch (_) {}
    }
  }

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const rawPath = file.webkitRelativePath || file.name;
    const relPath = rawPath.includes('/')
      ? rawPath.substring(rawPath.indexOf('/') + 1)
      : rawPath;

    const parts = relPath.split('/');
    const dirParts = parts.slice(0, -1);
    if (dirParts.some(d => isDefaultIgnoredDir(d))) {
      continue;
    }

    const fileName = parts[parts.length - 1];
    if (isZeroValueSink(fileName)) {
      if (onProgress) onProgress({ type: 'sink_purged', path: relPath });
      continue;
    }

    if (gitignoreManager.isIgnored(relPath, false)) {
      if (onProgress) onProgress({ type: 'gitignore_ignored', path: relPath });
      continue;
    }

    if (!isEligibleFile(fileName)) {
      continue;
    }

    if (file.size > MAX_INDIVIDUAL_FILE_SIZE) {
      if (onProgress) onProgress({ type: 'oversized', path: relPath, size: file.size });
      continue;
    }

    filesMap.set(relPath, file);
    if (onProgress) onProgress({ type: 'file_added', path: relPath, size: file.size });
  }

  return { rootFolderName, filesMap, gitignoreContent: primaryGitignoreContent };
}
