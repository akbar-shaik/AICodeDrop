/**
 * worker.js - Dedicated Web Worker for Non-blocking Token Estimation
 */

let gptTokenizer = null;

// Attempt dynamic import of gpt-tokenizer from CDN
async function initTokenizer() {
  if (gptTokenizer) return;
  try {
    const module = await import('https://esm.sh/gpt-tokenizer@2.8.1');
    if (module && typeof module.encode === 'function') {
      gptTokenizer = module;
    }
  } catch (err) {
    // Network offline or CDN blocked - fast heuristic will be used
    gptTokenizer = null;
  }
}

// Quick initiation
initTokenizer();

/**
 * Fast accurate BPE estimation heuristic for code & text (cl100k approximation)
 */
function estimateTokensHeuristic(text) {
  if (!text) return 0;
  // Splits words, symbols, whitespace blocks
  const tokens = text.match(/\w+|[^\w\s]|\s+/g);
  if (!tokens) return 0;

  let count = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (/^\s+$/.test(t)) {
      // Long indentations (every 4 spaces is ~1 token)
      count += Math.max(1, Math.ceil(t.length / 4));
    } else if (t.length > 8) {
      // Long identifiers / words
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
    self.postMessage({ id, success: true, usingBPE: !!gptTokenizer });
    return;
  }

  if (action === 'count') {
    const tokens = countTokens(text);
    self.postMessage({ id, tokens });
    return;
  }

  if (action === 'batch') {
    const results = {};
    for (const key of Object.keys(items)) {
      results[key] = countTokens(items[key]);
    }
    self.postMessage({ id, results });
    return;
  }
};
