/**
 * tokenizer.js - Client-Side Token Estimator & Model Window Meter
 * 
 * Supports:
 * - Real-time o200k_base BPE token counting with Web Worker offloading
 * - Calibrated model estimators (OpenAI, Claude, Gemini)
 * - Full context overhead accounting (prompts, tree, manifests, XML tags)
 * - Synchronous fallback heuristic when offline or worker initializing
 */

import { CONTEXT_GUIDE_TEXT } from './xmlFormatter.js';

export const MODEL_THRESHOLDS = {
  STANDARD_32K: 32768,
  GPT4O_128K: 128000,
  CLAUDE_200K: 200000,
  GEMINI_1M: 1000000
};

// Model calibration factors relative to o200k_base
export const MODEL_CALIBRATIONS = {
  openai: 1.0,      // Native o200k_base
  claude: 1.08,     // Calibrated for Anthropic's Claude 3.5/3.7 tokenizer
  gemini: 1.04      // Calibrated for Google's Gemini tokenizer
};

let worker = null;
let msgCounter = 0;
const pendingCallbacks = new Map();
let isWorkerReady = false;
let gptTokenizerModule = null;
let currentEncoding = 'heuristic';

/**
 * Fast synchronous BPE heuristic approximation
 */
export function estimateTokensSync(text) {
  if (!text) return 0;
  if (gptTokenizerModule && typeof gptTokenizerModule.encode === 'function') {
    try {
      return gptTokenizerModule.encode(text).length;
    } catch (_) {}
  }

  const tokens = text.match(/\w+|[^\w\s]|\s+/g);
  if (!tokens) return 0;

  let count = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (/^\s+$/.test(t)) {
      count += Math.max(1, Math.ceil(t.length / 4));
    } else if (t.length > 8) {
      count += Math.ceil(t.length / 4);
    } else {
      count += 1;
    }
  }
  return Math.max(1, count);
}

/**
 * Initializes Worker and/or CDN tokenizer
 */
export async function initTokenizer(onStatusChange) {
  if (typeof window === 'undefined') return;

  // Try direct dynamic import of o200k_base in main thread as fallback
  try {
    const mod = await import('https://esm.sh/gpt-tokenizer@2.8.1/encoding/o200k_base');
    if (mod && typeof mod.encode === 'function') {
      gptTokenizerModule = mod;
      currentEncoding = 'o200k_base';
      if (onStatusChange) onStatusChange({ usingBPE: true, encoding: 'o200k_base' });
    }
  } catch (_) {
    try {
      const fallbackMod = await import('https://esm.sh/gpt-tokenizer@2.8.1');
      if (fallbackMod && typeof fallbackMod.encode === 'function') {
        gptTokenizerModule = fallbackMod;
        currentEncoding = 'cl100k_base';
        if (onStatusChange) onStatusChange({ usingBPE: true, encoding: 'cl100k_base' });
      }
    } catch (_) {}
  }

  // Spawn Worker if supported
  if (window.Worker && !worker) {
    try {
      worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = (e) => {
        const { id, tokens, results, usingBPE, encoding } = e.data;
        if (encoding) currentEncoding = encoding;
        if (onStatusChange && usingBPE) {
          onStatusChange({ usingBPE, encoding: currentEncoding });
        }

        if (pendingCallbacks.has(id)) {
          const cb = pendingCallbacks.get(id);
          pendingCallbacks.delete(id);
          cb(results !== undefined ? results : tokens);
        }
      };

      const initId = ++msgCounter;
      worker.postMessage({ id: initId, action: 'init' });
      isWorkerReady = true;
    } catch (e) {
      console.warn('Web Worker initialization failed, using main thread estimation:', e);
    }
  }
}

/**
 * Returns current tokenizer status (exact BPE vs heuristic)
 */
export function getTokenizerStatus() {
  return {
    isExact: currentEncoding !== 'heuristic',
    encoding: currentEncoding
  };
}

/**
 * Count tokens asynchronously using Worker when available
 */
export function countTokensAsync(text) {
  if (!text) return Promise.resolve(0);

  if (worker && isWorkerReady) {
    return new Promise((resolve) => {
      const id = ++msgCounter;
      pendingCallbacks.set(id, resolve);
      worker.postMessage({ id, action: 'count', text });
    });
  }

  return Promise.resolve(estimateTokensSync(text));
}

/**
 * Count tokens for a batch of items: { [key: string]: text }
 */
export function batchCountTokensAsync(items) {
  if (worker && isWorkerReady && Object.keys(items).length > 0) {
    return new Promise((resolve) => {
      const id = ++msgCounter;
      pendingCallbacks.set(id, resolve);
      worker.postMessage({ id, action: 'batch', items });
    });
  }

  const results = {};
  for (const [key, text] of Object.entries(items)) {
    results[key] = estimateTokensSync(text);
  }
  return Promise.resolve(results);
}

/**
 * Calculates hidden wrapper overhead tokens (prompts, directory tree, manifests, XML schema)
 */
export function calculateContextOverhead({
  userInstructions = '',
  userPrompt = '',
  asciiTree = '',
  manifestSummary = '',
  architectureMap = '',
  fileCount = 0,
  format = 'xml'
}) {
  let overheadText = '';

  if (format === 'xml') {
    overheadText += '<?xml version="1.0" encoding="UTF-8"?>\n<project_context>\n';
    overheadText += `<context_guide>${CONTEXT_GUIDE_TEXT}</context_guide>\n`;
    overheadText += `<architecture_map>${architectureMap}</architecture_map>\n`;
    overheadText += `<manifests>${manifestSummary}</manifests>\n`;
    overheadText += `<directory_structure>${asciiTree}</directory_structure>\n`;
    overheadText += `<user_instructions>${userInstructions}</user_instructions>\n`;
    overheadText += `<user_prompt>${userPrompt}</user_prompt>\n`;
    overheadText += '</project_context>\n';
  } else {
    overheadText += `CONTEXT GUIDE:\n${CONTEXT_GUIDE_TEXT}\n`;
    overheadText += `ARCHITECTURE MAP:\n${architectureMap}\n`;
    overheadText += `USER INSTRUCTIONS:\n${userInstructions}\n`;
    overheadText += `PROJECT FOLDER STRUCTURE:\n${asciiTree}\n`;
    overheadText += `USER PROMPT:\n${userPrompt}\n`;
  }

  // Base overhead of wrappers + prompts
  const baseTokens = estimateTokensSync(overheadText);
  // Plus ~15 tokens per file for <file path="..." mode="..."> tag wrappers
  const fileTagsOverhead = fileCount * 15;

  return baseTokens + fileTagsOverhead;
}

/**
 * Returns calibrated token estimates for specific model families
 */
export function getCalibratedModelTokens(bpeTokens) {
  return {
    openai: Math.round(bpeTokens * MODEL_CALIBRATIONS.openai),
    claude: Math.ceil(bpeTokens * MODEL_CALIBRATIONS.claude),
    gemini: Math.ceil(bpeTokens * MODEL_CALIBRATIONS.gemini)
  };
}

/**
 * Computes context capacity statistics against major LLM windows
 */
export function getBudgetStatus(totalTokens) {
  const p32k = Math.min(100, Math.round((totalTokens / MODEL_THRESHOLDS.STANDARD_32K) * 100));
  const p128k = Math.min(100, Math.round((totalTokens / MODEL_THRESHOLDS.GPT4O_128K) * 100));
  const p200k = Math.min(100, Math.round((totalTokens / MODEL_THRESHOLDS.CLAUDE_200K) * 100));
  const p1m = Math.min(100, Math.round((totalTokens / MODEL_THRESHOLDS.GEMINI_1M) * 100));

  let tier = 'green';
  let statusText = 'Comfortably fits standard 32k context';
  let badgeColor = 'bg-emerald-500';

  if (totalTokens > MODEL_THRESHOLDS.GEMINI_1M) {
    tier = 'red';
    statusText = 'Exceeds 1M tokens - recommend skeletonizing or filtering';
    badgeColor = 'bg-rose-600';
  } else if (totalTokens > MODEL_THRESHOLDS.CLAUDE_200K) {
    tier = 'purple';
    statusText = 'Fits in Gemini 1.5/2.5 Pro (1M+)';
    badgeColor = 'bg-purple-600';
  } else if (totalTokens > MODEL_THRESHOLDS.GPT4O_128K) {
    tier = 'indigo';
    statusText = 'Fits in Claude 3.5/3.7 (200k)';
    badgeColor = 'bg-indigo-600';
  } else if (totalTokens > MODEL_THRESHOLDS.STANDARD_32K) {
    tier = 'blue';
    statusText = 'Fits in GPT-4o / Claude (128k)';
    badgeColor = 'bg-blue-600';
  }

  const calibrated = getCalibratedModelTokens(totalTokens);

  return {
    totalTokens,
    calibrated,
    percentages: {
      p32k,
      p128k,
      p200k,
      p1m
    },
    tier,
    statusText,
    badgeColor
  };
}
