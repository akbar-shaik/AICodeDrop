/**
 * app.js - Main Application Orchestrator
 * 
 * Coordinates:
 * - Scanning & .gitignore filtering
 * - Optimization pipeline (Full, Compressed, Skeleton)
 * - Secret sanitization
 * - Live token counting & context budget feedback
 * - XML / Plain-text assembly & instant local download
 * - Telegram backup relay via Netlify Function
 */

import {
  scanFileSystemEntries,
  scanFileList,
  sanitizeSecrets,
  MANIFEST_FILENAMES,
  getExtension
} from './scanner.js';

import {
  optimizeContent
} from './optimizer.js';

import {
  initTokenizer,
  estimateTokensSync,
  countTokensAsync,
  getBudgetStatus,
  MODEL_THRESHOLDS
} from './tokenizer.js';

import {
  buildXmlContext,
  buildPlainTextContext
} from './xmlFormatter.js';

// Application State
const state = {
  folderName: 'project',
  files: new Map(), // relativePath -> FileEntry
  manifestMap: new Map(), // path -> text
  totalTokens: 0,
  outputFormat: 'xml', // 'xml' | 'text'
  searchQuery: '',
  options: {
    sanitize: true,
    preserveDocstrings: false
  },
  activePreviewFile: null
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

// Token Budget Elements
const tokenCountDisplay = document.getElementById('tokenCountDisplay');
const tokenTierBadge = document.getElementById('tokenTierBadge');
const tokenProgressBar = document.getElementById('tokenProgressBar');
const tokenStatusText = document.getElementById('tokenStatusText');
const selectedFilesCount = document.getElementById('selectedFilesCount');
const totalSizeDisplay = document.getElementById('totalSizeDisplay');

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
  state.totalTokens = 0;
  fileList.innerHTML = '';
  consoleOutput.innerHTML = '';
  updateBudgetDashboard();
}

/**
 * Process raw file content into transformed content based on file mode
 */
function processFileEntry(entry) {
  let content = entry.rawContent;

  // 1. Sanitization pass
  if (state.options.sanitize) {
    content = sanitizeSecrets(content);
  }

  // 2. Optimization pass (whitespace, comments, or skeleton)
  content = optimizeContent(content, entry.path, entry.mode, {
    preserveDocstrings: state.options.preserveDocstrings
  });

  entry.optimizedContent = content;
  entry.tokens = estimateTokensSync(content);
  return entry;
}

/**
 * Re-computes token counts and updates UI dashboard
 */
async function updateBudgetDashboard() {
  let totalTokens = 0;
  let selectedCount = 0;
  let totalSizeBytes = 0;

  for (const entry of state.files.values()) {
    if (entry.selected) {
      totalTokens += (entry.tokens || 0);
      selectedCount++;
      totalSizeBytes += (entry.optimizedContent ? entry.optimizedContent.length : entry.size);
    }
  }

  state.totalTokens = totalTokens;

  // Update DOM counts
  if (tokenCountDisplay) {
    tokenCountDisplay.textContent = totalTokens.toLocaleString();
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
    // Fill relative to 200k or 1M
    const baseline = totalTokens > MODEL_THRESHOLDS.CLAUDE_200K ? MODEL_THRESHOLDS.GEMINI_1M : MODEL_THRESHOLDS.CLAUDE_200K;
    const pct = Math.min(100, Math.max(1, Math.round((totalTokens / baseline) * 100)));
    tokenProgressBar.style.width = `${pct}%`;

    // Color gradient according to tier
    tokenProgressBar.className = `h-full rounded-full token-bar-fill ${budget.badgeColor}`;
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
 * Renders the interactive file explorer table
 */
function renderFileList() {
  fileList.innerHTML = '';

  const query = state.searchQuery.toLowerCase().trim();
  const entries = Array.from(state.files.values()).filter(entry => {
    if (!query) return true;
    return entry.path.toLowerCase().includes(query);
  });

  if (entries.length === 0) {
    fileList.innerHTML = `
      <div class="py-12 text-center text-slate-500 font-mono text-sm">
        No files matching "${query}"
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  entries.forEach(entry => {
    const row = document.createElement('div');
    row.className = `flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg border border-slate-700/60 bg-slate-900/60 hover:bg-slate-800/80 transition-colors gap-2`;

    // Left section: checkbox + path + language badge
    const left = document.createElement('div');
    left.className = 'flex items-center gap-2.5 min-w-0 flex-1';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = entry.selected;
    checkbox.className = 'w-4 h-4 rounded text-blue-500 bg-slate-800 border-slate-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer';
    checkbox.addEventListener('change', () => {
      entry.selected = checkbox.checked;
      updateBudgetDashboard();
    });

    const ext = getExtension(entry.path);
    const badge = document.createElement('span');
    badge.className = 'px-1.5 py-0.5 text-[10px] uppercase font-mono font-bold rounded bg-slate-800 text-slate-400 border border-slate-700';
    badge.textContent = ext || 'txt';

    const pathLabel = document.createElement('span');
    pathLabel.className = 'font-mono text-xs text-slate-200 truncate cursor-pointer hover:text-blue-400 transition-colors';
    pathLabel.textContent = entry.path;
    pathLabel.title = `Click to preview: ${entry.path}`;
    pathLabel.addEventListener('click', () => openPreviewModal(entry));

    left.appendChild(checkbox);
    left.appendChild(badge);
    left.appendChild(pathLabel);

    // Right section: Size + Tokens + Mode Segmented Selector + Preview Button
    const right = document.createElement('div');
    right.className = 'flex items-center gap-3 shrink-0 self-end sm:self-auto';

    // Token count badge
    const tokenBadge = document.createElement('span');
    tokenBadge.className = 'font-mono text-xs text-indigo-300 bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded';
    tokenBadge.textContent = `~${entry.tokens.toLocaleString()} tok`;

    // Mode Selector (Full | Comp | Skel)
    const modeGroup = document.createElement('div');
    modeGroup.className = 'inline-flex rounded-md shadow-sm border border-slate-700 bg-slate-950 p-0.5 text-xs';

    const modes = [
      { key: 'full', label: 'Full', title: 'Complete code' },
      { key: 'compressed', label: 'Min', title: 'Comments stripped & whitespace compressed' },
      { key: 'skeleton', label: 'Skel', title: 'Signatures & structure only' }
    ];

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
        tokenBadge.textContent = `~${entry.tokens.toLocaleString()} tok`;

        // Update active class on sibling buttons
        Array.from(modeGroup.children).forEach((b, idx) => {
          b.className = `px-2 py-0.5 rounded mode-btn font-mono text-[11px] ${
            modes[idx].key === m.key ? `active-${modes[idx].key}` : 'text-slate-400 hover:text-white'
          }`;
        });

        updateBudgetDashboard();
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
    fragment.appendChild(row);
  });

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
    previewModeBadge.className = `px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase ${
      entry.mode === 'full' ? 'bg-blue-600 text-white' :
      entry.mode === 'compressed' ? 'bg-emerald-600 text-white' :
      'bg-purple-600 text-white'
    }`;
  }
  if (previewCode) {
    previewCode.textContent = entry.optimizedContent || entry.rawContent;
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

  log(`Optimizing code and estimating tokens...`, 'engine');

  let index = 0;
  for (const [path, file] of filesMap.entries()) {
    try {
      const rawContent = await file.text();
      const baseName = path.split('/').pop().toLowerCase();

      // Check if dependency manifest
      if (MANIFEST_FILENAMES.has(baseName)) {
        state.manifestMap.set(path, rawContent);
      }

      const entry = {
        path,
        size: file.size,
        rawContent,
        optimizedContent: '',
        mode: 'full', // Default mode
        tokens: 0,
        selected: true
      };

      processFileEntry(entry);
      state.files.set(path, entry);
      index++;
    } catch (err) {
      log(`Could not read ${path}: ${err.message}`, 'warn');
    }
  }

  renderFileList();
  await updateBudgetDashboard();

  if (selectionArea) {
    selectionArea.classList.remove('hidden');
    selectionArea.scrollIntoView({ behavior: 'smooth' });
  }

  log(`Engine ready. Total context: ${state.totalTokens.toLocaleString()} tokens`, 'success');
}

/**
 * Bulk Mode Setter
 */
function setAllFilesMode(mode) {
  log(`Switching all files to ${mode.toUpperCase()} mode...`, 'engine');
  for (const entry of state.files.values()) {
    entry.mode = mode;
    processFileEntry(entry);
  }
  renderFileList();
  updateBudgetDashboard();
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
    tokens: e.tokens
  }));

  if (format === 'text') {
    return {
      content: buildPlainTextContext({
        repositoryName: state.folderName,
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
*AICodeDrop Context Backup*
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
  // Initialize tokenizer in background
  initTokenizer();

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
      updateBudgetDashboard();
    });
  }

  // Bulk mode buttons
  if (bulkFullBtn) bulkFullBtn.addEventListener('click', () => setAllFilesMode('full'));
  if (bulkCompressedBtn) bulkCompressedBtn.addEventListener('click', () => setAllFilesMode('compressed'));
  if (bulkSkeletonBtn) bulkSkeletonBtn.addEventListener('click', () => setAllFilesMode('skeleton'));

  // Options toggles
  if (optSanitize) {
    optSanitize.addEventListener('change', () => {
      state.options.sanitize = optSanitize.checked;
      for (const entry of state.files.values()) {
        processFileEntry(entry);
      }
      renderFileList();
      updateBudgetDashboard();
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
    });
  }

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
