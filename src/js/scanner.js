/**
 * scanner.js - Directory Ingestion, .gitignore Parser, Token Sink Purge & Secret Sanitizer
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

// Default ignored directories
export const DEFAULT_IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', '.nuxt', 'dist', 'build', 'out',
  '__pycache__', 'venv', '.venv', 'env', '.env', '.idea', '.vscode',
  '.turbo', '.cache', 'coverage', '.svn', '.hg'
]);

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
 * Compiles a single .gitignore line into a RegExp
 */
export function parseGitignoreRule(rawLine) {
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

  // Escape special regex chars except * and ?
  let regexStr = line
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '§§GLOBSTAR§§')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/§§GLOBSTAR§§/g, '.*');

  if (isRootAnchored) {
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
 * Parses full .gitignore file content into matcher rules
 */
export function compileGitignore(gitignoreContent) {
  if (!gitignoreContent) return () => false;

  const lines = gitignoreContent.split(/\r?\n/);
  const rules = [];

  for (const line of lines) {
    const rule = parseGitignoreRule(line);
    if (rule) rules.push(rule);
  }

  return function isIgnored(relativePath, isDirectory = false) {
    // Normalize path with forward slashes, strip leading slash
    const normalized = relativePath.replace(/\\/g, '/').replace(/^\//, '');
    let ignored = false;

    for (const rule of rules) {
      if (rule.isDirectoryOnly && !isDirectory && !normalized.endsWith('/')) {
        // If rule requires directory, only match if directory
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

  // 2. Telegram Bot Tokens (e.g. 123456789:ABCdefGHIjklMNOpqrsTUVwxyz123456789)
  sanitized = sanitized.replace(/\b\d{8,10}:[A-Za-z0-9_-]{35}\b/g, '<REDACTED_TELEGRAM_TOKEN>');

  // 3. AWS Access Keys (AKIA, ASIA, ABIA, ACCA followed by 16 alphanumerics)
  sanitized = sanitized.replace(/\b(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g, '<REDACTED_AWS_ACCESS_KEY>');

  // 4. GitHub Personal Access Tokens (ghp_, gho_, ghu_, ghs_, ghr_, github_pat_)
  sanitized = sanitized.replace(/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}\b/g, '<REDACTED_GITHUB_TOKEN>');
  sanitized = sanitized.replace(/\bgithub_pat_[A-Za-z0-9_]{82}\b/g, '<REDACTED_GITHUB_TOKEN>');

  // 5. OpenAI / Anthropic / AI API Keys (sk-..., sk-ant-...)
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
    // If it starts with dot (.env, .gitignore)
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
 */
export async function scanFileSystemEntries(items, onProgress) {
  const filesMap = new Map(); // relativePath -> File
  let gitignoreContent = null;
  let rootFolderName = 'project';

  // Read directory entries in batches
  async function readAllDirEntries(dirReader) {
    const entries = [];
    let batch = await new Promise((res, rej) => dirReader.readEntries(res, rej));
    while (batch && batch.length > 0) {
      entries.push(...batch);
      batch = await new Promise((res, rej) => dirReader.readEntries(res, rej));
    }
    return entries;
  }

  // Phase 1: Locate and read root .gitignore if present
  for (const item of items) {
    const entry = typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : item;
    if (!entry) continue;

    if (entry.isDirectory) {
      rootFolderName = entry.name;
      const dirReader = entry.createReader();
      const firstLevelEntries = await readAllDirEntries(dirReader);
      const giEntry = firstLevelEntries.find(e => e.isFile && e.name === '.gitignore');
      if (giEntry) {
        try {
          const giFile = await new Promise((res, rej) => giEntry.file(res, rej));
          gitignoreContent = await giFile.text();
          if (onProgress) onProgress({ type: 'gitignore_found', name: '.gitignore' });
        } catch (_) {}
      }
      break;
    }
  }

  const gitignoreMatcher = compileGitignore(gitignoreContent);

  // Phase 2: Traverse files recursively
  async function traverse(entry, currentPath = '') {
    if (!entry) return;

    if (entry.isDirectory) {
      if (DEFAULT_IGNORE_DIRS.has(entry.name)) {
        if (onProgress) onProgress({ type: 'ignored_dir', path: currentPath + entry.name });
        return;
      }
      if (gitignoreMatcher(currentPath + entry.name, true)) {
        if (onProgress) onProgress({ type: 'gitignore_ignored', path: currentPath + entry.name });
        return;
      }

      const reader = entry.createReader();
      const entries = await readAllDirEntries(reader);
      for (const child of entries) {
        await traverse(child, currentPath + entry.name + '/');
      }
    } else if (entry.isFile) {
      const relPath = currentPath + entry.name;

      if (isZeroValueSink(entry.name)) {
        if (onProgress) onProgress({ type: 'sink_purged', path: relPath });
        return;
      }

      if (gitignoreMatcher(relPath, false)) {
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

  return { rootFolderName, filesMap, gitignoreContent };
}

/**
 * Processes files from standard input (<input type="file" webkitdirectory>)
 */
export async function scanFileList(fileList, onProgress) {
  const filesMap = new Map();
  let rootFolderName = 'project';
  let gitignoreContent = null;

  if (!fileList || fileList.length === 0) {
    return { rootFolderName, filesMap, gitignoreContent };
  }

  // Extract root folder name
  const firstPath = fileList[0].webkitRelativePath || fileList[0].name;
  if (firstPath.includes('/')) {
    rootFolderName = firstPath.split('/')[0];
  }

  // Find root .gitignore first
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const rel = file.webkitRelativePath
      ? file.webkitRelativePath.substring(file.webkitRelativePath.indexOf('/') + 1)
      : file.name;

    if (rel === '.gitignore') {
      try {
        gitignoreContent = await file.text();
        if (onProgress) onProgress({ type: 'gitignore_found', name: '.gitignore' });
      } catch (_) {}
      break;
    }
  }

  const gitignoreMatcher = compileGitignore(gitignoreContent);

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const rawPath = file.webkitRelativePath || file.name;
    const relPath = rawPath.includes('/')
      ? rawPath.substring(rawPath.indexOf('/') + 1)
      : rawPath;

    // Check directory components against ignore list
    const parts = relPath.split('/');
    const dirParts = parts.slice(0, -1);
    if (dirParts.some(d => DEFAULT_IGNORE_DIRS.has(d))) {
      continue;
    }

    const fileName = parts[parts.length - 1];
    if (isZeroValueSink(fileName)) {
      if (onProgress) onProgress({ type: 'sink_purged', path: relPath });
      continue;
    }

    if (gitignoreMatcher(relPath, false)) {
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

  return { rootFolderName, filesMap, gitignoreContent };
}
