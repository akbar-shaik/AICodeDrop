/**
 * worker.js - Dedicated Web Worker for Non-blocking o200k BPE Token Estimation
 */

let gptTokenizer = null;
let activeEncoding = 'heuristic';

// Attempt dynamic import of o200k_base (modern GPT-4o / o1 / o3 tokenizer)
async function initTokenizer() {
  if (gptTokenizer) return;
  try {
    const mod = await import('https://esm.sh/gpt-tokenizer@2.8.1/encoding/o200k_base');
    if (mod && typeof mod.encode === 'function') {
      gptTokenizer = mod;
      activeEncoding = 'o200k_base';
      return;
    }
  } catch (_) {
    // Fallback to standard gpt-tokenizer (cl100k)
    try {
      const fallbackMod = await import('https://esm.sh/gpt-tokenizer@2.8.1');
      if (fallbackMod && typeof fallbackMod.encode === 'function') {
        gptTokenizer = fallbackMod;
        activeEncoding = 'cl100k_base';
        return;
      }
    } catch (_) {
      gptTokenizer = null;
      activeEncoding = 'heuristic';
    }
  }
}

// Initialize on load
initTokenizer();

/**
 * Fast accurate BPE estimation heuristic for code & text (cl100k/o200k approximation)
 */
function estimateTokensHeuristic(text) {
  if (!text) return 0;
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

function countTokens(text) {
  if (!text) return 0;
  if (gptTokenizer && typeof gptTokenizer.encode === 'function') {
    try {
      return gptTokenizer.encode(text).length;
    } catch (_) {
      return estimateTokensHeuristic(text);
    }
  }
  return estimateTokensHeuristic(text);
}

self.onmessage = async (e) => {
  const { id, action, text, items } = e.data;

  if (action === 'init') {
    await initTokenizer();
    self.postMessage({ id, success: true, usingBPE: !!gptTokenizer, encoding: activeEncoding });
    return;
  }

  if (action === 'count') {
    const tokens = countTokens(text);
    self.postMessage({ id, tokens, usingBPE: !!gptTokenizer, encoding: activeEncoding });
    return;
  }

  if (action === 'batch') {
    const results = {};
    if (items) {
      for (const key of Object.keys(items)) {
        results[key] = countTokens(items[key]);
      }
    }
    self.postMessage({ id, results, usingBPE: !!gptTokenizer, encoding: activeEncoding });
    return;
  }
};
