/**
 * app.js - Main Application Orchestrator (v2.5)
 * 
 * Coordinates:
 * - Scanning, nested .gitignore & zero-value sink purge
 * - Fast content-hash file deduplication (detects mirror/build duplicates like Deploy/)
 * - Optimization pipeline (Full, Compressed, Skeleton, Duplicate)
 * - Secret sanitization
 * - Non-blocking Web Worker token counting (o200k_base BPE)
 * - Full context overhead accounting (prompts, tree, manifests, XML tags)
 * - Structured XML (with <context_guide> & <architecture_map>) / Plain-text assembly
 * - Instant local Blob download & Netlify Serverless Telegram relay
 */

import {
  scanFileSystemEntries,
  scanFileList,
  sanitizeSecrets,
  computeContentHash,
  MANIFEST_FILENAMES,
  getExtension,
  getFileDirectory,
  groupFilesByDirectory,
  getFolderSelectionState
} from './scanner.js';

import {
  optimizeContent
} from './optimizer.js';

import {
  initTokenizer,
  estimateTokensSync,
  batchCountTokensAsync,
  calculateContextOverhead,
  getBudgetStatus,
  getTokenizerStatus,
  MODEL_THRESHOLDS
} from './tokenizer.js';

import {
  buildXmlContext,
  buildPlainTextContext,
  generateAsciiTree,
  extractManifestSummary
} from './xmlFormatter.js';

import {
  analyzeFile,
  buildArchitectureMap
} from './analyzer.js';

// Application State
const state = {
  folderName: 'project',
  files: new Map(), // relativePath -> FileEntry
  manifestMap: new Map(), // path -> text
  totalTokens: 0,
  codeTokens: 0,
  overheadTokens: 0,
  outputFormat: 'xml', // 'xml' | 'text'
  searchQuery: '',
  options: {
    sanitize: true,
    preserveDocstrings: false
  },
  activePreviewFile: null,
  isWorkerTokenizing: false,
  viewMode: 'grouped', // 'grouped' | 'flat'
  collapsedFolders: new Set()
};

// DOM Elements
const dropZone = document.getElementById('dropZone');
const folderInput = document.getElementById('folderInput');
const btnSelectFolder = document.getElementById('btnSelectFolder');
const consoleOutput = document.getElementById('consoleOutput');
const selectionArea = document.getElementById('selectionArea');
const fileList = document.getElementById('fileList');
const searchInput = document.getElementById('fileSearch');
const toggleAllBtn = document.getElementById('toggleAllBtn');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const telegramBtn = document.getElementById('telegramBtn');
const customStart = document.getElementById('customStart');
const customEnd = document.getElementById('customEnd');

// Folder Selection & Grouping Controls
const viewModeBtn = document.getElementById('viewModeBtn');
const folderFilterBar = document.getElementById('folderFilterBar');
const folderPillsContainer = document.getElementById('folderPillsContainer');
const selectAllFoldersBtn = document.getElementById('selectAllFoldersBtn');
const deselectAllFoldersBtn = document.getElementById('deselectAllFoldersBtn');
const expandAllFoldersBtn = document.getElementById('expandAllFoldersBtn');
const collapseAllFoldersBtn = document.getElementById('collapseAllFoldersBtn');
const folderCountBadge = document.getElementById('folderCountBadge');

// Token Budget Elements
const tokenCountDisplay = document.getElementById('tokenCountDisplay');
const overheadTokensDisplay = document.getElementById('overheadTokensDisplay');
const tokenTierBadge = document.getElementById('tokenTierBadge');
const tokenProgressBar = document.getElementById('tokenProgressBar');
const tokenStatusText = document.getElementById('tokenStatusText');
const selectedFilesCount = document.getElementById('selectedFilesCount');
const totalSizeDisplay = document.getElementById('totalSizeDisplay');
const tokenizerStatusBadge = document.getElementById('tokenizerStatusBadge');
const modelCalibrationDisplay = document.getElementById('modelCalibrationDisplay');

// Bulk Mode Buttons
const bulkFullBtn = document.getElementById('bulkFullBtn');
const bulkCompressedBtn = document.getElementById('bulkCompressedBtn');
const bulkSkeletonBtn = document.getElementById('bulkSkeletonBtn');
const formatSelect = document.getElementById('formatSelect');

// Options checkboxes
const optSanitize = document.getElementById('optSanitize');
const optDocstrings = document.getElementById('optDocstrings');

// Preview Modal Elements
const previewModal = document.getElementById('previewModal');
const previewTitle = document.getElementById('previewTitle');
const previewModeBadge = document.getElementById('previewModeBadge');
const previewCode = document.getElementById('previewCode');
const closePreviewBtn = document.getElementById('closePreviewBtn');

/**
 * Terminal Logger with color and timestamp
 */
function log(msg, type = 'info') {
  if (!consoleOutput) return;

  const line = document.createElement('div');
  line.className = 'py-0.5 leading-relaxed font-mono text-xs flex items-start gap-2';

  const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const timeSpan = document.createElement('span');
  timeSpan.className = 'text-gray-500 select-none';
  timeSpan.textContent = `[${time}]`;
  line.appendChild(timeSpan);

  const textSpan = document.createElement('span');

  switch (type) {
    case 'success':
      textSpan.className = 'text-emerald-400 font-semibold';
      textSpan.textContent = `[OK] ${msg}`;
      break;
    case 'warn':
      textSpan.className = 'text-amber-300';
      textSpan.textContent = `[WARN] ${msg}`;
      break;
    case 'error':
      textSpan.className = 'text-rose-400 font-semibold';
      textSpan.textContent = `[ERR] ${msg}`;
      break;
    case 'engine':
      textSpan.className = 'text-cyan-400';
      textSpan.textContent = `[ENGINE] ${msg}`;
      break;
    case 'filter':
      textSpan.className = 'text-indigo-300';
      textSpan.textContent = `[FILTER] ${msg}`;
      break;
    case 'dedup':
      textSpan.className = 'text-purple-400 font-semibold';
      textSpan.textContent = `[DEDUP] ${msg}`;
      break;
    default:
      textSpan.className = 'text-slate-300';
      textSpan.textContent = `> ${msg}`;
      break;
  }

  line.appendChild(textSpan);
  consoleOutput.appendChild(line);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

/**
 * Format bytes to readable size
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Reset application state and view
 */
function resetState() {
  state.files.clear();
  state.manifestMap.clear();
  state.collapsedFolders.clear();
  state.totalTokens = 0;
  state.codeTokens = 0;
  state.overheadTokens = 0;
  if (fileList) fileList.innerHTML = '';
  if (consoleOutput) consoleOutput.innerHTML = '';
  if (folderPillsContainer) folderPillsContainer.innerHTML = '';
  if (folderFilterBar) {
    folderFilterBar.classList.add('hidden');
    folderFilterBar.classList.remove('flex');
  }
  if (folderCountBadge) folderCountBadge.textContent = '';
  updateBudgetDashboard();
}

/**
 * Process raw file content into transformed content based on file mode
 */
function processFileEntry(entry) {
  if (entry.mode === 'duplicate') {
    entry.optimizedContent = '';
    entry.tokens = 5; // Pointer tag cost only
    return entry;
  }

  let content = entry.rawContent;

  // 1. Sanitization pass
  if (state.options.sanitize) {
    content = sanitizeSecrets(content);
  }

  // 2. Optimization pass (whitespace, comments, skeleton, SVG/JSON minification)
  content = optimizeContent(content, entry.path, entry.mode, {
    preserveDocstrings: state.options.preserveDocstrings
  });

  entry.optimizedContent = content;
  entry.tokens = estimateTokensSync(content);
  return entry;
}

/**
 * Re-computes token counts, overhead, and updates UI dashboard
 */
function updateBudgetDashboard() {
  let codeTokens = 0;
  let selectedCount = 0;
  let totalSizeBytes = 0;
  const selectedPaths = [];

  for (const entry of state.files.values()) {
    if (entry.selected) {
      codeTokens += (entry.tokens || 0);
      selectedCount++;
      totalSizeBytes += (entry.optimizedContent ? entry.optimizedContent.length : (entry.mode === 'duplicate' ? 50 : entry.size));
      selectedPaths.push(entry.path);
    }
  }

  state.codeTokens = codeTokens;

  // Calculate full wrapper overhead (ASCII tree + prompts + manifests + architecture map + XML tags)
  const format = formatSelect ? formatSelect.value : state.outputFormat;
  const userInstructions = customStart ? customStart.value : '';
  const userPrompt = customEnd ? customEnd.value : '';
  const asciiTree = generateAsciiTree(state.folderName, selectedPaths);

  const manifestSummaries = extractManifestSummary(state.manifestMap);
  const manifestText = manifestSummaries.map(m => m.summary).join('\n');

  const selectedAnalyses = selectedPaths.map(p => analyzeFile(p, state.files.get(p)?.rawContent || ''));
  const archMapText = buildArchitectureMap(selectedAnalyses);

  const overheadTokens = calculateContextOverhead({
    userInstructions,
    userPrompt,
    asciiTree,
    manifestSummary: manifestText,
    architectureMap: archMapText,
    fileCount: selectedCount,
    format
  });

  state.overheadTokens = overheadTokens;
  const totalTokens = codeTokens + overheadTokens;
  state.totalTokens = totalTokens;

  // Update DOM counts
  if (tokenCountDisplay) {
    tokenCountDisplay.textContent = totalTokens.toLocaleString();
  }
  if (overheadTokensDisplay) {
    overheadTokensDisplay.textContent = `(${codeTokens.toLocaleString()} code + ${overheadTokens.toLocaleString()} prompt/XML overhead)`;
  }
  if (selectedFilesCount) {
    selectedFilesCount.textContent = `${selectedCount} / ${state.files.size} selected`;
  }
  if (totalSizeDisplay) {
    totalSizeDisplay.textContent = formatBytes(totalSizeBytes);
  }

  // Compute status against model context thresholds
  const budget = getBudgetStatus(totalTokens);

  if (tokenStatusText) {
    tokenStatusText.textContent = budget.statusText;
  }

  if (tokenTierBadge) {
    tokenTierBadge.className = `px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${budget.badgeColor}`;
    if (totalTokens <= MODEL_THRESHOLDS.STANDARD_32K) {
      tokenTierBadge.textContent = '32K Budget';
    } else if (totalTokens <= MODEL_THRESHOLDS.GPT4O_128K) {
      tokenTierBadge.textContent = '128K Budget (GPT-4o)';
    } else if (totalTokens <= MODEL_THRESHOLDS.CLAUDE_200K) {
      tokenTierBadge.textContent = '200K Budget (Claude)';
    } else {
      tokenTierBadge.textContent = '1M+ Budget (Gemini)';
    }
  }

  if (tokenProgressBar) {
    const baseline = totalTokens > MODEL_THRESHOLDS.CLAUDE_200K ? MODEL_THRESHOLDS.GEMINI_1M : MODEL_THRESHOLDS.CLAUDE_200K;
    const pct = Math.min(100, Math.max(1, Math.round((totalTokens / baseline) * 100)));
    tokenProgressBar.style.width = `${pct}%`;
    tokenProgressBar.className = `h-full rounded-full token-bar-fill ${budget.badgeColor}`;
  }

  // Model calibration details
  if (modelCalibrationDisplay) {
    const cal = budget.calibrated;
    modelCalibrationDisplay.textContent = `OpenAI: ~${cal.openai.toLocaleString()} | Claude (+8%): ~${cal.claude.toLocaleString()} | Gemini (+4%): ~${cal.gemini.toLocaleString()}`;
  }

  // Telegram payload warning check
  if (telegramBtn) {
    const isOverLimit = totalSizeBytes > (4.5 * 1024 * 1024);
    if (isOverLimit) {
      telegramBtn.classList.add('opacity-50');
      telegramBtn.title = 'Payload exceeds 4.5MB Netlify serverless limit. Use local download.';
    } else {
      telegramBtn.classList.remove('opacity-50');
      telegramBtn.title = 'Send context file to configured Telegram Chat';
    }
  }
}

/**
 * Triggers background Web Worker batch tokenization
 */
function runWorkerBatchTokenization() {
  if (state.isWorkerTokenizing || state.files.size === 0) return;

  state.isWorkerTokenizing = true;
  if (tokenizerStatusBadge) {
    tokenizerStatusBadge.textContent = 'Calculating exact BPE (o200k)...';
    tokenizerStatusBadge.className = 'text-[10px] font-mono text-cyan-400 animate-pulse';
  }

  const batch = {};
  for (const [path, entry] of state.files.entries()) {
    if (entry.mode !== 'duplicate') {
      batch[path] = entry.optimizedContent || entry.rawContent;
    }
  }

  batchCountTokensAsync(batch).then((results) => {
    state.isWorkerTokenizing = false;
    let updatedCount = 0;

    for (const [path, exactTokens] of Object.entries(results)) {
      const entry = state.files.get(path);
      if (entry && entry.mode !== 'duplicate') {
        entry.tokens = exactTokens;
        updatedCount++;
      }
    }

    if (tokenizerStatusBadge) {
      const status = getTokenizerStatus();
      tokenizerStatusBadge.textContent = status.isExact ? `Exact BPE (${status.encoding})` : 'Heuristic Estimate';
      tokenizerStatusBadge.className = status.isExact
        ? 'text-[10px] font-mono text-emerald-400 font-semibold'
        : 'text-[10px] font-mono text-amber-400';
    }

    renderFileList();
    updateBudgetDashboard();
    log(`Web Worker completed exact BPE tokenization for ${updatedCount} files`, 'success');
  }).catch((err) => {
    state.isWorkerTokenizing = false;
    log(`Worker tokenization error: ${err.message}`, 'warn');
  });
}

/**
 * Toggle selection of all files inside a given directory
 */
function setFolderSelection(folderPath, isSelected) {
  let count = 0;
  for (const entry of state.files.values()) {
    if (getFileDirectory(entry.path) === folderPath) {
      entry.selected = isSelected;
      count++;
    }
  }
  log(`${isSelected ? 'Selected' : 'Deselected'} all ${count} files in "${folderPath}"`, 'engine');
  renderFileList();
  renderFolderPills();
  updateBudgetDashboard();
}

/**
 * Set mode (full | compressed | skeleton) for all files in a folder
 */
function setFolderMode(folderPath, mode) {
  let count = 0;
  for (const entry of state.files.values()) {
    if (getFileDirectory(entry.path) === folderPath) {
      if (entry.isDuplicateOf && mode !== 'full') {
        entry.mode = 'duplicate';
      } else {
        entry.mode = mode;
      }
      processFileEntry(entry);
      count++;
    }
  }
  log(`Set mode "${mode.toUpperCase()}" for ${count} files in "${folderPath}"`, 'engine');
  renderFileList();
  renderFolderPills();
  updateBudgetDashboard();
  runWorkerBatchTokenization();
}

/**
 * Toggle collapsed state of a folder in grouped view
 */
function toggleFolderCollapse(folderPath) {
  if (state.collapsedFolders.has(folderPath)) {
    state.collapsedFolders.delete(folderPath);
  } else {
    state.collapsedFolders.add(folderPath);
  }
  renderFileList();
}

/**
 * Renders the folder pills/chips above the file list
 */
function renderFolderPills() {
  if (!folderPillsContainer || !folderFilterBar) return;

  const entries = Array.from(state.files.values());
  if (entries.length === 0) {
    folderFilterBar.classList.add('hidden');
    folderFilterBar.classList.remove('flex');
    return;
  }

  folderFilterBar.classList.remove('hidden');
  folderFilterBar.classList.add('flex');

  const folderMap = groupFilesByDirectory(entries);
  if (folderCountBadge) {
    folderCountBadge.textContent = `${folderMap.size} folder${folderMap.size === 1 ? '' : 's'}`;
  }

  folderPillsContainer.innerHTML = '';
  const fragment = document.createDocumentFragment();

  for (const [folderPath, folderEntries] of folderMap.entries()) {
    const selState = getFolderSelectionState(folderEntries);
    const selectedCount = folderEntries.filter(e => e.selected).length;

    const chip = document.createElement('div');
    chip.className = `folder-chip inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border cursor-pointer select-none transition-colors ${
      selState === 'all'
        ? 'bg-blue-950/70 border-blue-600/70 text-blue-200 hover:bg-blue-900/80'
        : selState === 'partial'
        ? 'bg-amber-950/50 border-amber-600/60 text-amber-200 hover:bg-amber-900/70'
        : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:bg-slate-800/80 hover:text-slate-300'
    }`;
    chip.title = `Click to toggle selection for all files in "${folderPath}" (${selectedCount}/${folderEntries.length} selected)`;

    // Checkbox inside pill
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = selState === 'all';
    checkbox.indeterminate = selState === 'partial';
    checkbox.className = 'w-3.5 h-3.5 rounded text-blue-500 bg-slate-800 border-slate-600 focus:ring-0 cursor-pointer pointer-events-none';

    // Folder icon + Name
    const nameSpan = document.createElement('span');
    nameSpan.className = 'font-semibold truncate max-w-[150px]';
    nameSpan.textContent = folderPath;

    // Badge showing count
    const countBadge = document.createElement('span');
    countBadge.className = 'text-[10px] opacity-75';
    countBadge.textContent = `(${selectedCount}/${folderEntries.length})`;

    chip.appendChild(checkbox);
    chip.appendChild(nameSpan);
    chip.appendChild(countBadge);

    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const shouldSelect = selState !== 'all';
      setFolderSelection(folderPath, shouldSelect);
    });

    fragment.appendChild(chip);
  }

  folderPillsContainer.appendChild(fragment);
}

/**
 * Synchronize a specific folder header without re-rendering entire list
 */
function syncFolderHeaderState(folderPath) {
  if (!fileList) return;
  const safePath = folderPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const folderHeader = fileList.querySelector(`[data-folder="${safePath}"]`);
  if (!folderHeader) return;

  const entriesInFolder = Array.from(state.files.values()).filter(e => getFileDirectory(e.path) === folderPath);
  const selState = getFolderSelectionState(entriesInFolder);
  const checkbox = folderHeader.querySelector('.folder-select-checkbox');
  if (checkbox) {
    checkbox.checked = selState === 'all';
    checkbox.indeterminate = selState === 'partial';
  }

  const countBadge = folderHeader.querySelector('.folder-count-badge');
  if (countBadge) {
    const selCount = entriesInFolder.filter(e => e.selected).length;
    countBadge.textContent = `${selCount}/${entriesInFolder.length} files`;
  }
}

/**
 * Creates a file row element
 */
function createFileRowElement(entry) {
  const row = document.createElement('div');
  row.className = `flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg border border-slate-700/60 bg-slate-900/60 hover:bg-slate-800/80 transition-colors gap-2`;

  // Left section: checkbox + badges + path
  const left = document.createElement('div');
  left.className = 'flex items-center gap-2.5 min-w-0 flex-1';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = entry.selected;
  checkbox.className = 'w-4 h-4 rounded text-blue-500 bg-slate-800 border-slate-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer';
  checkbox.addEventListener('change', () => {
    entry.selected = checkbox.checked;
    updateBudgetDashboard();
    renderFolderPills();
    syncFolderHeaderState(getFileDirectory(entry.path));
  });

  const ext = getExtension(entry.path);
  const badge = document.createElement('span');
  badge.className = 'px-1.5 py-0.5 text-[10px] uppercase font-mono font-bold rounded bg-slate-800 text-slate-400 border border-slate-700';
  badge.textContent = ext || 'txt';

  left.appendChild(checkbox);
  left.appendChild(badge);

  // Duplicate badge [DUP]
  if (entry.isDuplicateOf) {
    const dupBadge = document.createElement('span');
    dupBadge.className = 'px-1.5 py-0.5 text-[10px] uppercase font-mono font-bold rounded bg-purple-950/80 text-purple-300 border border-purple-800/80';
    dupBadge.textContent = 'DUP';
    dupBadge.title = `Identical content to ${entry.isDuplicateOf}`;
    left.appendChild(dupBadge);
  }

  const pathLabel = document.createElement('span');
  pathLabel.className = 'font-mono text-xs text-slate-200 truncate cursor-pointer hover:text-blue-400 transition-colors';
  pathLabel.textContent = entry.path;
  pathLabel.title = entry.isDuplicateOf ? `Duplicate of ${entry.isDuplicateOf}` : `Click to preview: ${entry.path}`;
  pathLabel.addEventListener('click', () => openPreviewModal(entry));

  left.appendChild(pathLabel);

  // Right section: Size + Tokens + Mode Segmented Selector + Preview Button
  const right = document.createElement('div');
  right.className = 'flex items-center gap-3 shrink-0 self-end sm:self-auto';

  // Token count badge
  const tokenBadge = document.createElement('span');
  tokenBadge.className = entry.isDuplicateOf
    ? 'font-mono text-xs text-purple-300 bg-purple-950/60 border border-purple-800/50 px-2 py-0.5 rounded'
    : 'font-mono text-xs text-indigo-300 bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded';
  tokenBadge.textContent = entry.isDuplicateOf ? `~5 tok (ref)` : `~${(entry.tokens || 0).toLocaleString()} tok`;

  // Mode Selector (Full | Comp | Skel | Dup)
  const modeGroup = document.createElement('div');
  modeGroup.className = 'inline-flex rounded-md shadow-sm border border-slate-700 bg-slate-950 p-0.5 text-xs';

  const modes = [
    { key: 'full', label: 'Full', title: 'Complete code' },
    { key: 'compressed', label: 'Min', title: 'Comments stripped, SVG simplified & whitespace compressed' },
    { key: 'skeleton', label: 'Skel', title: 'Signatures & structure only' }
  ];

  if (entry.isDuplicateOf) {
    modes.push({ key: 'duplicate', label: 'Dup', title: `Referenced duplicate of ${entry.isDuplicateOf}` });
  }

  modes.forEach(m => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `px-2 py-0.5 rounded mode-btn font-mono text-[11px] ${
      entry.mode === m.key ? `active-${m.key}` : 'text-slate-400 hover:text-white'
    }`;
    btn.textContent = m.label;
    btn.title = m.title;

    btn.addEventListener('click', () => {
      if (entry.mode === m.key) return;
      entry.mode = m.key;
      processFileEntry(entry);
      tokenBadge.textContent = entry.mode === 'duplicate' ? `~5 tok (ref)` : `~${entry.tokens.toLocaleString()} tok`;

      Array.from(modeGroup.children).forEach((b, idx) => {
        b.className = `px-2 py-0.5 rounded mode-btn font-mono text-[11px] ${
          modes[idx].key === m.key ? `active-${modes[idx].key}` : 'text-slate-400 hover:text-white'
        }`;
      });

      updateBudgetDashboard();
      runWorkerBatchTokenization();
    });

    modeGroup.appendChild(btn);
  });

  // Preview Button
  const previewBtn = document.createElement('button');
  previewBtn.type = 'button';
  previewBtn.className = 'text-slate-400 hover:text-blue-400 p-1 transition-colors';
  previewBtn.title = 'Preview transformed code';
  previewBtn.innerHTML = `
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  `;
  previewBtn.addEventListener('click', () => openPreviewModal(entry));

  right.appendChild(tokenBadge);
  right.appendChild(modeGroup);
  right.appendChild(previewBtn);

  row.appendChild(left);
  row.appendChild(right);
  return row;
}

/**
 * Renders the interactive file explorer table (supporting Grouped by Folder & Flat List modes)
 */
function renderFileList() {
  if (!fileList) return;
  fileList.innerHTML = '';

  const query = state.searchQuery.toLowerCase().trim();
  const entries = Array.from(state.files.values()).filter(entry => {
    if (!query) return true;
    return entry.path.toLowerCase().includes(query);
  });

  if (entries.length === 0) {
    fileList.innerHTML = `
      <div class="py-12 text-center text-slate-500 font-mono text-sm">
        ${state.files.size === 0 ? 'No files loaded yet.' : `No files matching "${query}"`}
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  if (state.viewMode === 'flat') {
    entries.forEach(entry => {
      fragment.appendChild(createFileRowElement(entry));
    });
  } else {
    // Grouped by directory view
    const folderMap = groupFilesByDirectory(entries);

    for (const [folderPath, folderEntries] of folderMap.entries()) {
      const isCollapsed = state.collapsedFolders.has(folderPath);
      const selState = getFolderSelectionState(folderEntries);
      const selectedCount = folderEntries.filter(e => e.selected).length;
      const folderTokens = folderEntries.reduce((sum, e) => sum + (e.isDuplicateOf ? 5 : (e.tokens || 0)), 0);

      const groupDiv = document.createElement('div');
      groupDiv.className = 'folder-group mb-2 border border-slate-800/80 rounded-xl overflow-hidden bg-slate-900/40';

      // Folder Header
      const header = document.createElement('div');
      header.className = 'folder-header flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-slate-950/70 border-b border-slate-800/60 gap-2 select-none';
      header.setAttribute('data-folder', folderPath);

      // Left: Chevron + Checkbox + Icon + Folder Path + Count/Tokens Badges
      const left = document.createElement('div');
      left.className = 'flex items-center gap-2 min-w-0 flex-1';

      // Chevron
      const chevronBtn = document.createElement('button');
      chevronBtn.type = 'button';
      chevronBtn.className = `folder-chevron p-1 text-slate-400 hover:text-white transition-transform ${isCollapsed ? 'collapsed' : ''}`;
      chevronBtn.title = isCollapsed ? 'Expand folder' : 'Collapse folder';
      chevronBtn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      `;
      chevronBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFolderCollapse(folderPath);
      });

      // Folder Tri-State Checkbox
      const folderCheckbox = document.createElement('input');
      folderCheckbox.type = 'checkbox';
      folderCheckbox.checked = selState === 'all';
      folderCheckbox.indeterminate = selState === 'partial';
      folderCheckbox.className = 'folder-select-checkbox w-4 h-4 rounded text-blue-500 bg-slate-800 border-slate-600 focus:ring-blue-500 cursor-pointer';
      folderCheckbox.title = `Toggle selection for all files in ${folderPath}`;
      folderCheckbox.addEventListener('change', (e) => {
        e.stopPropagation();
        const shouldSelect = selState !== 'all';
        setFolderSelection(folderPath, shouldSelect);
      });

      // Folder Icon + Name
      const nameContainer = document.createElement('div');
      nameContainer.className = 'flex items-center gap-1.5 cursor-pointer truncate';
      nameContainer.addEventListener('click', () => toggleFolderCollapse(folderPath));

      const folderIcon = document.createElement('span');
      folderIcon.className = 'text-amber-400 text-sm';
      folderIcon.textContent = '📁';

      const folderName = document.createElement('span');
      folderName.className = 'font-mono text-xs font-bold text-slate-200 hover:text-blue-400 transition-colors truncate';
      folderName.textContent = folderPath;

      nameContainer.appendChild(folderIcon);
      nameContainer.appendChild(folderName);

      // Folder File Count Badge
      const countBadge = document.createElement('span');
      countBadge.className = 'folder-count-badge text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0';
      countBadge.textContent = `${selectedCount}/${folderEntries.length} files`;

      // Folder Tokens Badge
      const tokenBadge = document.createElement('span');
      tokenBadge.className = 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 shrink-0';
      tokenBadge.textContent = `~${folderTokens.toLocaleString()} tok`;

      left.appendChild(chevronBtn);
      left.appendChild(folderCheckbox);
      left.appendChild(nameContainer);
      left.appendChild(countBadge);
      left.appendChild(tokenBadge);

      // Right: Quick Mode Actions for the entire folder
      const right = document.createElement('div');
      right.className = 'flex items-center gap-1.5 shrink-0 self-end sm:self-auto';

      const folderModeSpan = document.createElement('span');
      folderModeSpan.className = 'text-[10px] font-mono text-slate-500 uppercase mr-1 hidden sm:inline';
      folderModeSpan.textContent = 'Folder Mode:';
      right.appendChild(folderModeSpan);

      const fModes = [
        { key: 'full', label: 'Full', title: `Set all files in ${folderPath} to Full` },
        { key: 'compressed', label: 'Min', title: `Set all files in ${folderPath} to Compressed` },
        { key: 'skeleton', label: 'Skel', title: `Set all files in ${folderPath} to Skeleton` }
      ];

      fModes.forEach(fm => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-500 transition-colors';
        btn.textContent = fm.label;
        btn.title = fm.title;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          setFolderMode(folderPath, fm.key);
        });
        right.appendChild(btn);
      });

      header.appendChild(left);
      header.appendChild(right);
      groupDiv.appendChild(header);

      // Children list
      const childrenDiv = document.createElement('div');
      childrenDiv.className = `folder-children p-2 space-y-1.5 ${isCollapsed ? 'hidden' : ''}`;

      folderEntries.forEach(entry => {
        childrenDiv.appendChild(createFileRowElement(entry));
      });

      groupDiv.appendChild(childrenDiv);
      fragment.appendChild(groupDiv);
    }
  }

  fileList.appendChild(fragment);
}

/**
 * Open code preview modal
 */
function openPreviewModal(entry) {
  state.activePreviewFile = entry;
  if (previewTitle) previewTitle.textContent = entry.path;
  if (previewModeBadge) {
    previewModeBadge.textContent = entry.mode.toUpperCase();
    previewModeBadge.className = `px-2 py-0.5 rounded text-xs font-mono font-bold uppercase ${
      entry.mode === 'full' ? 'bg-blue-600 text-white' :
      entry.mode === 'compressed' ? 'bg-emerald-600 text-white' :
      entry.mode === 'duplicate' ? 'bg-purple-900 text-purple-200' :
      'bg-purple-600 text-white'
    }`;
  }
  if (previewCode) {
    if (entry.mode === 'duplicate') {
      previewCode.textContent = `/* DUPLICATE FILE */\n/* Identical content to ${entry.isDuplicateOf}. In context file, this is emitted as a pointer reference. */`;
    } else {
      previewCode.textContent = entry.optimizedContent || entry.rawContent;
    }
  }
  if (previewModal) previewModal.classList.remove('hidden');
}

/**
 * Close code preview modal
 */
function closePreviewModal() {
  if (previewModal) previewModal.classList.add('hidden');
  state.activePreviewFile = null;
}

/**
 * Handles loaded files map from scanner
 */
async function processScannedFiles(filesMap, folderName, gitignoreContent) {
  resetState();
  state.folderName = folderName || 'project';

  log(`Discovered ${filesMap.size} valid source files in "${state.folderName}"`, 'success');
  if (gitignoreContent) {
    log(`Applied .gitignore patterns successfully`, 'filter');
  }

  log(`Running content-hash deduplication pass...`, 'engine');

  const seenHashes = new Map(); // hash -> firstPath
  let duplicateCount = 0;

  for (const [path, file] of filesMap.entries()) {
    try {
      const rawContent = await file.text();
      const baseName = path.split('/').pop().toLowerCase();

      // Check manifest
      if (MANIFEST_FILENAMES.has(baseName)) {
        state.manifestMap.set(path, rawContent);
      }

      // Compute FNV-1a content hash
      const hash = computeContentHash(rawContent);
      let isDuplicateOf = null;
      let initialMode = 'full';

      if (seenHashes.has(hash)) {
        isDuplicateOf = seenHashes.get(hash);
        initialMode = 'duplicate';
        duplicateCount++;
        log(`Duplicate detected: "${path}" is identical to "${isDuplicateOf}" (saving tokens)`, 'dedup');
      } else {
        seenHashes.set(hash, path);
      }

      const entry = {
        path,
        size: file.size,
        rawContent,
        optimizedContent: '',
        mode: initialMode,
        isDuplicateOf,
        tokens: initialMode === 'duplicate' ? 5 : 0,
        selected: true
      };

      processFileEntry(entry);
      state.files.set(path, entry);
    } catch (err) {
      log(`Could not read ${path}: ${err.message}`, 'warn');
    }
  }

  if (duplicateCount > 0) {
    log(`Content-hash deduplication identified ${duplicateCount} duplicate files. Referenced as zero-cost pointers!`, 'dedup');
  }

  renderFileList();
  renderFolderPills();
  updateBudgetDashboard();

  if (selectionArea) {
    selectionArea.classList.remove('hidden');
    selectionArea.scrollIntoView({ behavior: 'smooth' });
  }

  log(`Instant heuristic count ready. Triggering Web Worker for exact o200k BPE calculation...`, 'engine');
  runWorkerBatchTokenization();
}

/**
 * Bulk Mode Setter
 */
function setAllFilesMode(mode) {
  log(`Switching all files to ${mode.toUpperCase()} mode...`, 'engine');
  for (const entry of state.files.values()) {
    // Preserve duplicate mode unless user explicitly changes it
    if (entry.isDuplicateOf && mode !== 'full') {
      entry.mode = 'duplicate';
    } else {
      entry.mode = mode;
    }
    processFileEntry(entry);
  }
  renderFileList();
  renderFolderPills();
  updateBudgetDashboard();
  runWorkerBatchTokenization();
}

/**
 * Builds the final context payload (XML or Plain Text)
 */
function generateContextPayload() {
  const selectedEntries = Array.from(state.files.values()).filter(e => e.selected);
  if (selectedEntries.length === 0) {
    alert('Please select at least one file to include.');
    return null;
  }

  const userInstructions = customStart ? customStart.value : '';
  const userPrompt = customEnd ? customEnd.value : '';
  const format = formatSelect ? formatSelect.value : state.outputFormat;

  const filesPayload = selectedEntries.map(e => ({
    path: e.path,
    content: e.optimizedContent || e.rawContent,
    mode: e.mode,
    tokens: e.tokens,
    isDuplicateOf: e.isDuplicateOf,
    duplicateOf: e.isDuplicateOf
  }));

  if (format === 'text') {
    return {
      content: buildPlainTextContext({
        repositoryName: state.folderName,
        totalTokens: state.totalTokens,
        userInstructions,
        userPrompt,
        files: filesPayload
      }),
      fileName: `${state.folderName}_context.txt`,
      mimeType: 'text/plain'
    };
  }

  return {
    content: buildXmlContext({
      repositoryName: state.folderName,
      totalTokens: state.totalTokens,
      codeTokens: state.codeTokens,
      overheadTokens: state.overheadTokens,
      userInstructions,
      userPrompt,
      files: filesPayload,
      manifestMap: state.manifestMap
    }),
    fileName: `${state.folderName}_context.xml`,
    mimeType: 'application/xml'
  };
}

/**
 * Triggers direct browser Blob download
 */
function downloadContextFile() {
  const payload = generateContextPayload();
  if (!payload) return;

  log(`Creating local ${payload.fileName} blob (${formatBytes(payload.content.length)})...`, 'engine');

  const blob = new Blob([payload.content], { type: `${payload.mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = payload.fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  log(`Context file saved to your device: ${payload.fileName}`, 'success');
}

/**
 * Copies context payload to clipboard
 */
async function copyContextToClipboard() {
  const payload = generateContextPayload();
  if (!payload) return;

  try {
    await navigator.clipboard.writeText(payload.content);
    log(`Copied ${formatBytes(payload.content.length)} (${state.totalTokens.toLocaleString()} tokens) to clipboard!`, 'success');
    if (copyBtn) {
      const orig = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg class="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg> Copied!
      `;
      setTimeout(() => { copyBtn.innerHTML = orig; }, 2000);
    }
  } catch (err) {
    log(`Clipboard write failed: ${err.message}`, 'error');
  }
}

/**
 * Relays context payload to Netlify Function -> Telegram Backup
 */
async function sendToTelegramBackup() {
  const payload = generateContextPayload();
  if (!payload) return;

  const payloadBytes = new Blob([payload.content]).size;
  const maxBytes = 4.5 * 1024 * 1024;

  if (payloadBytes > maxBytes) {
    const mb = (payloadBytes / (1024 * 1024)).toFixed(2);
    alert(`Payload size (${mb} MB) exceeds the 4.5MB Netlify serverless limit.\n\nPlease use the direct local download button instead.`);
    log(`Telegram upload aborted: Payload (${mb} MB) exceeds 4.5MB serverless boundary.`, 'warn');
    return;
  }

  log(`Relaying context payload to Netlify serverless function (/api/telegram-backup)...`, 'engine');

  if (telegramBtn) {
    telegramBtn.disabled = true;
    telegramBtn.classList.add('opacity-75');
  }

  const userInfo = `
*AICodeDrop v2.5 Context Backup*
Repository: \`${state.folderName}\`
Total Files: \`${state.files.size}\`
Tokens: \`~${state.totalTokens.toLocaleString()}\`
Timestamp: \`${new Date().toISOString()}\`
Browser: \`${navigator.userAgent.slice(0, 100)}\`
`.trim();

  try {
    const response = await fetch('/api/telegram-backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: payload.fileName,
        fileContent: payload.content,
        userInfo
      })
    });

    const responseText = await response.text();
    let result = {};
    try {
      result = JSON.parse(responseText);
    } catch (_) {
      result = { error: responseText };
    }

    if (!response.ok) {
      throw new Error(result.error || `Server responded with ${response.status}`);
    }

    log(`Telegram backup dispatched successfully!`, 'success');
    alert('Context file uploaded to your configured Telegram channel successfully!');
  } catch (err) {
    log(`Telegram Relay failed: ${err.message}`, 'error');
    alert(`Telegram Relay Error:\n${err.message}\n\nNote: Please ensure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set in Netlify Site Settings.`);
  } finally {
    if (telegramBtn) {
      telegramBtn.disabled = false;
      telegramBtn.classList.remove('opacity-75');
    }
  }
}

/**
 * Setup Event Listeners
 */
function initEvents() {
  // Initialize tokenizer in background with status callback
  initTokenizer((status) => {
    if (tokenizerStatusBadge) {
      tokenizerStatusBadge.textContent = status.usingBPE ? `Exact BPE (${status.encoding})` : 'Heuristic Estimate';
      tokenizerStatusBadge.className = status.usingBPE
        ? 'text-[10px] font-mono text-emerald-400 font-semibold'
        : 'text-[10px] font-mono text-amber-400';
    }
  });

  // Dropzone drag-and-drop
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('active');
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('active');
    });

    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('active');

      const items = e.dataTransfer.items;
      if (!items || items.length === 0) return;

      log(`Ingestion initiated via drag-and-drop...`, 'engine');
      try {
        const { rootFolderName, filesMap, gitignoreContent } = await scanFileSystemEntries(
          items,
          (evt) => {
            if (evt.type === 'sink_purged') log(`Purged zero-value sink: ${evt.path}`, 'filter');
            if (evt.type === 'gitignore_ignored') log(`Ignored via .gitignore: ${evt.path}`, 'filter');
            if (evt.type === 'oversized') log(`Skipped >2MB file: ${evt.path}`, 'warn');
          }
        );

        if (filesMap.size === 0) {
          log(`No eligible code files found.`, 'warn');
          alert('No valid code files found in the dropped folder.');
          return;
        }

        await processScannedFiles(filesMap, rootFolderName, gitignoreContent);
      } catch (err) {
        log(`Scan failed: ${err.message}`, 'error');
      }
    });

    dropZone.addEventListener('click', () => {
      if (folderInput) folderInput.click();
    });
  }

  // Folder input file picker
  if (folderInput) {
    folderInput.addEventListener('change', async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      log(`Folder selected via browser picker...`, 'engine');
      try {
        const { rootFolderName, filesMap, gitignoreContent } = await scanFileList(
          files,
          (evt) => {
            if (evt.type === 'sink_purged') log(`Purged zero-value sink: ${evt.path}`, 'filter');
            if (evt.type === 'gitignore_ignored') log(`Ignored via .gitignore: ${evt.path}`, 'filter');
            if (evt.type === 'oversized') log(`Skipped >2MB file: ${evt.path}`, 'warn');
          }
        );

        if (filesMap.size === 0) {
          log(`No eligible code files found.`, 'warn');
          alert('No valid code files found.');
          return;
        }

        await processScannedFiles(filesMap, rootFolderName, gitignoreContent);
      } catch (err) {
        log(`Scan failed: ${err.message}`, 'error');
      } finally {
        folderInput.value = '';
      }
    });
  }

  // Button select folder
  if (btnSelectFolder) {
    btnSelectFolder.addEventListener('click', (e) => {
      e.stopPropagation();
      if (folderInput) folderInput.click();
    });
  }

  // File Search input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderFileList();
    });
  }

  // Toggle all files checkbox
  let allSelected = true;
  if (toggleAllBtn) {
    toggleAllBtn.addEventListener('click', () => {
      allSelected = !allSelected;
      for (const entry of state.files.values()) {
        entry.selected = allSelected;
      }
      toggleAllBtn.textContent = allSelected ? 'Deselect All' : 'Select All';
      renderFileList();
      renderFolderPills();
      updateBudgetDashboard();
    });
  }

  // Folder Quick-Filter Bar actions
  if (selectAllFoldersBtn) {
    selectAllFoldersBtn.addEventListener('click', () => {
      for (const entry of state.files.values()) {
        entry.selected = true;
      }
      if (toggleAllBtn) toggleAllBtn.textContent = 'Deselect All';
      renderFileList();
      renderFolderPills();
      updateBudgetDashboard();
    });
  }

  if (deselectAllFoldersBtn) {
    deselectAllFoldersBtn.addEventListener('click', () => {
      for (const entry of state.files.values()) {
        entry.selected = false;
      }
      if (toggleAllBtn) toggleAllBtn.textContent = 'Select All';
      renderFileList();
      renderFolderPills();
      updateBudgetDashboard();
    });
  }

  // Expand / Collapse All Folders
  if (expandAllFoldersBtn) {
    expandAllFoldersBtn.addEventListener('click', () => {
      state.collapsedFolders.clear();
      renderFileList();
    });
  }

  if (collapseAllFoldersBtn) {
    collapseAllFoldersBtn.addEventListener('click', () => {
      const folderMap = groupFilesByDirectory(Array.from(state.files.values()));
      for (const folderPath of folderMap.keys()) {
        state.collapsedFolders.add(folderPath);
      }
      renderFileList();
    });
  }

  // View Mode toggle (Grouped vs Flat)
  if (viewModeBtn) {
    viewModeBtn.addEventListener('click', () => {
      state.viewMode = state.viewMode === 'grouped' ? 'flat' : 'grouped';
      viewModeBtn.innerHTML = state.viewMode === 'grouped'
        ? '<span>📁 Grouped</span>'
        : '<span>📄 Flat List</span>';
      renderFileList();
    });
  }

  // Bulk mode buttons
  if (bulkFullBtn) bulkFullBtn.addEventListener('click', () => setAllFilesMode('full'));
  if (bulkCompressedBtn) bulkCompressedBtn.addEventListener('click', () => setAllFilesMode('compressed'));
  if (bulkSkeletonBtn) bulkSkeletonBtn.addEventListener('click', () => setAllFilesMode('skeleton'));

  // Format selector
  if (formatSelect) {
    formatSelect.addEventListener('change', () => {
      state.outputFormat = formatSelect.value;
      updateBudgetDashboard();
    });
  }

  // Options toggles
  if (optSanitize) {
    optSanitize.addEventListener('change', () => {
      state.options.sanitize = optSanitize.checked;
      for (const entry of state.files.values()) {
        processFileEntry(entry);
      }
      renderFileList();
      updateBudgetDashboard();
      runWorkerBatchTokenization();
    });
  }

  if (optDocstrings) {
    optDocstrings.addEventListener('change', () => {
      state.options.preserveDocstrings = optDocstrings.checked;
      for (const entry of state.files.values()) {
        processFileEntry(entry);
      }
      renderFileList();
      updateBudgetDashboard();
      runWorkerBatchTokenization();
    });
  }

  // Prompts inputs live update overhead
  if (customStart) customStart.addEventListener('input', () => updateBudgetDashboard());
  if (customEnd) customEnd.addEventListener('input', () => updateBudgetDashboard());

  // Actions
  if (generateBtn) generateBtn.addEventListener('click', downloadContextFile);
  if (copyBtn) copyBtn.addEventListener('click', copyContextToClipboard);
  if (telegramBtn) telegramBtn.addEventListener('click', sendToTelegramBackup);

  // Preview Modal
  if (closePreviewBtn) closePreviewBtn.addEventListener('click', closePreviewModal);
  if (previewModal) {
    previewModal.addEventListener('click', (e) => {
      if (e.target === previewModal) closePreviewModal();
    });
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEvents);
} else {
  initEvents();
}
