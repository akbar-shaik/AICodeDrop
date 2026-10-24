/**
 * test-engine.js - Comprehensive Verification Suite for AICodeDrop v2.5
 */

import assert from 'node:assert';
import {
  parseGitignoreRule,
  compileGitignore,
  isZeroValueSink,
  isEligibleFile,
  sanitizeSecrets,
  getExtension,
  computeContentHash,
  isDefaultIgnoredDir,
  getFileDirectory,
  groupFilesByDirectory,
  getFolderSelectionState
} from '../src/js/scanner.js';

import {
  normalizeWhitespace,
  stripComments,
  skeletonizeJsTs,
  skeletonizePython,
  skeletonizeCurlyBraceLangs,
  optimizeContent,
  stripSvgPaths,
  compactJson,
  countStructuralBraces
} from '../src/js/optimizer.js';

import {
  buildXmlContext,
  buildPlainTextContext,
  generateAsciiTree,
  escapeCData
} from '../src/js/xmlFormatter.js';

import {
  analyzeFile,
  classifyFileRole,
  extractImports,
  extractExports,
  buildArchitectureMap
} from '../src/js/analyzer.js';

import {
  estimateTokensSync,
  getBudgetStatus,
  calculateContextOverhead,
  getCalibratedModelTokens,
  MODEL_THRESHOLDS
} from '../src/js/tokenizer.js';

import { handler as telegramBackupHandler } from '../netlify/functions/telegram-backup.js';

console.log('🧪 Starting AICodeDrop v2.5 Test Suite...\n');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
    failedTests++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
    failedTests++;
  }
}

// ==========================================
// 1. Scanner, .gitignore & Deduplication Tests
// ==========================================
console.log('--- 1. Ingestion Engine, .gitignore & Deduplication ---');

test('.gitignore parses wildcards, comments, and directory rules', () => {
  const gitignoreText = `
# Comment
node_modules/
*.log
dist/
/root-only.txt
!important.log
docs/*.tmp
`;
  const isIgnored = compileGitignore(gitignoreText);

  assert.strictEqual(isIgnored('node_modules/foo/bar.js', true), true);
  assert.strictEqual(isIgnored('error.log', false), true);
  assert.strictEqual(isIgnored('important.log', false), false); // Negated rule
  assert.strictEqual(isIgnored('root-only.txt', false), true);
  assert.strictEqual(isIgnored('nested/root-only.txt', false), false); // Anchored to root
  assert.strictEqual(isIgnored('src/index.js', false), false);
});

test('Zero-value sink purge excludes lockfiles, minified files, and deploy directories', () => {
  assert.strictEqual(isZeroValueSink('package-lock.json'), true);
  assert.strictEqual(isZeroValueSink('pnpm-lock.yaml'), true);
  assert.strictEqual(isZeroValueSink('yarn.lock'), true);
  assert.strictEqual(isZeroValueSink('Cargo.lock'), true);
  assert.strictEqual(isZeroValueSink('bundle.min.js'), true);
  assert.strictEqual(isZeroValueSink('style.bundle.css'), true);
  assert.strictEqual(isZeroValueSink('app.chunk.js'), true);
  assert.strictEqual(isZeroValueSink('vendor.min.css'), true);
  assert.strictEqual(isZeroValueSink('image.png'), true);
  assert.strictEqual(isZeroValueSink('index.ts'), false);
  assert.strictEqual(isZeroValueSink('main.py'), false);

  assert.strictEqual(isDefaultIgnoredDir('deploy'), true);
  assert.strictEqual(isDefaultIgnoredDir('.netlify'), true);
  assert.strictEqual(isDefaultIgnoredDir('node_modules'), true);
});

test('Secret sanitizer redacts private keys, Telegram tokens, AWS keys, and passwords', () => {
  const codeWithSecrets = `
const telegramToken = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz123456789";
const awsAccessKey = "AKIAIOSFODNN7EXAMPLE";
const dbPassword = "db_password=superSecretPassword123";
const apiKey = 'sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx';
const privateKey = \`-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Y...
-----END RSA PRIVATE KEY-----\`;
`;
  const sanitized = sanitizeSecrets(codeWithSecrets);

  assert.ok(!sanitized.includes('123456789:ABCdefGHIjklMNOpqrsTUVwxyz123456789'));
  assert.ok(sanitized.includes('<REDACTED_TELEGRAM_TOKEN>'));

  assert.ok(!sanitized.includes('AKIAIOSFODNN7EXAMPLE'));
  assert.ok(sanitized.includes('<REDACTED_AWS_ACCESS_KEY>'));

  assert.ok(!sanitized.includes('superSecretPassword123'));
  assert.ok(sanitized.includes('<REDACTED_SECRET>'));

  assert.ok(!sanitized.includes('sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx'));
  assert.ok(sanitized.includes('<REDACTED_AI_KEY>'));

  assert.ok(!sanitized.includes('MIIEowIBAAKCAQEA0Y'));
  assert.ok(sanitized.includes('/* <REDACTED_PRIVATE_KEY> */'));
});

test('Content-hash calculation detects identical duplicate files', () => {
  const file1 = 'console.log("hello world");\nconst x = 42;';
  const file2 = 'console.log("hello world");\nconst x = 42;';
  const file3 = 'console.log("different code");';

  const hash1 = computeContentHash(file1);
  const hash2 = computeContentHash(file2);
  const hash3 = computeContentHash(file3);

  assert.strictEqual(hash1, hash2);
  assert.notStrictEqual(hash1, hash3);
  assert.strictEqual(hash1.length, 16);
});

test('Folder helper functions: getFileDirectory, groupFilesByDirectory, getFolderSelectionState', () => {
  // getFileDirectory
  assert.strictEqual(getFileDirectory('index.html'), '(root)');
  assert.strictEqual(getFileDirectory('package.json'), '(root)');
  assert.strictEqual(getFileDirectory('src/js/app.js'), 'src/js');
  assert.strictEqual(getFileDirectory('src\\css\\styles.css'), 'src/css');
  assert.strictEqual(getFileDirectory('nested/very/deeply/file.ts'), 'nested/very/deeply');

  // groupFilesByDirectory
  const mockFiles = [
    { path: 'index.html', selected: true },
    { path: 'package.json', selected: false },
    { path: 'src/js/app.js', selected: true },
    { path: 'src/js/scanner.js', selected: true },
    { path: 'src/css/styles.css', selected: false }
  ];

  const grouped = groupFilesByDirectory(mockFiles);
  assert.strictEqual(grouped.size, 3);
  assert.ok(grouped.has('(root)'));
  assert.ok(grouped.has('src/js'));
  assert.ok(grouped.has('src/css'));
  assert.strictEqual(grouped.get('(root)').length, 2);
  assert.strictEqual(grouped.get('src/js').length, 2);
  assert.strictEqual(grouped.get('src/css').length, 1);

  // getFolderSelectionState
  // All selected
  assert.strictEqual(getFolderSelectionState(grouped.get('src/js')), 'all');
  // None selected
  assert.strictEqual(getFolderSelectionState(grouped.get('src/css')), 'none');
  // Partial selected
  assert.strictEqual(getFolderSelectionState(grouped.get('(root)')), 'partial');
  // Empty array
  assert.strictEqual(getFolderSelectionState([]), 'none');
});

// ==========================================
// 2. Token Minimization & Lexer Robustness Tests
// ==========================================
console.log('\n--- 2. Token Minimization & Lexer Robustness ---');

test('Whitespace normalization collapses empty lines and tabs', () => {
  const input = '\tconst a = 1;\n\n\n\n\tconst b = 2;   \n';
  const output = normalizeWhitespace(input, false);
  assert.strictEqual(output, '  const a = 1;\n\n  const b = 2;');

  const aggressiveOutput = normalizeWhitespace(input, true);
  assert.strictEqual(aggressiveOutput, '  const a = 1;\n  const b = 2;');
});

test('Universal comment stripper preserves JS regex literals containing slashes', () => {
  const jsWithRegex = `
// Comment to remove
const urlRegex = /https?:\\/\\/example\\.com\\/[a-z]+/gi;
const match = line.replace(/\\/\\*/g, '');
const a = 1; /* block comment */
`;
  const cleaned = stripComments(jsWithRegex, 'js');
  assert.ok(!cleaned.includes('Comment to remove'));
  assert.ok(!cleaned.includes('block comment'));
  assert.ok(cleaned.includes('/https?:\\/\\/example\\.com\\/[a-z]+/gi'));
  assert.ok(cleaned.includes('line.replace(/\\/\\*/g, \'\')'));
  assert.ok(cleaned.includes('const a = 1;'));
});

test('Universal comment stripper parses template literal ${...} expressions correctly', () => {
  const templateCode = 'const msg = `User: ${user.name /* comment inside template */} logged in!`;';
  const cleaned = stripComments(templateCode, 'js');
  assert.ok(!cleaned.includes('/* comment inside template */'));
  assert.ok(cleaned.includes('const msg = `User: ${user.name } logged in!`;'));
});

test('Structural brace counter ignores braces in strings and template literals', () => {
  const lineWithStringBrace = 'const str = "hello { brace }"; if (true) {';
  const { open, close, delta } = countStructuralBraces(lineWithStringBrace);
  assert.strictEqual(open, 1);
  assert.strictEqual(close, 0);
  assert.strictEqual(delta, 1);
});

test('Structural skeletonizer does not desync on braces inside strings', () => {
  const code = `
export function parseConfig() {
  const template = "format: {id}";
  const obj = { key: "value" };
  return obj;
}

export function secondFunc(a: number): number {
  return a * 2;
}
`;
  const skeleton = skeletonizeJsTs(code);
  assert.ok(skeleton.includes('export function parseConfig() { /* implementation omitted */ }'));
  assert.ok(skeleton.includes('export function secondFunc(a: number): number { /* implementation omitted */ }'));
  assert.ok(!skeleton.includes('format: {id}'));
  assert.ok(!skeleton.includes('return a * 2;'));
});

test('Structural skeletonizer preserves multi-line function signatures', () => {
  const code = `
export function complexService(
  userId: string,
  options: { retries: number }
): Promise<void> {
  const result = doWork(userId, options);
  return result;
}
`;
  const skeleton = skeletonizeJsTs(code);
  assert.ok(skeleton.includes('export function complexService('));
  assert.ok(skeleton.includes('userId: string,'));
  assert.ok(skeleton.includes('options: { retries: number }'));
  assert.ok(skeleton.includes('): Promise<void> { /* implementation omitted */ }'));
  assert.ok(!skeleton.includes('const result = doWork'));
});

test('Structural skeletonizer preserves Python classes and signatures', () => {
  const pyCode = `
import os
from typing import List

class DataProcessor:
    def __init__(self, path: str):
        self.path = path
        self.load()

    def process_items(self, items: List[str]) -> int:
        count = 0
        for item in items:
            count += len(item)
        return count
`;
  const skeleton = skeletonizePython(pyCode);

  assert.ok(skeleton.includes('import os'));
  assert.ok(skeleton.includes('from typing import List'));
  assert.ok(skeleton.includes('class DataProcessor:'));
  assert.ok(skeleton.includes('def __init__(self, path: str):'));
  assert.ok(skeleton.includes('def process_items(self, items: List[str]) -> int:'));
  assert.ok(skeleton.includes('pass  # implementation omitted'));
  assert.ok(!skeleton.includes('self.load()'));
  assert.ok(!skeleton.includes('count += len(item)'));
});

test('Inline SVG path stripping and JSON compaction save tokens', () => {
  const htmlWithSvg = `<div class="icon"><svg viewBox="0 0 100 100"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343" fill="currentColor"/></svg></div>`;
  const strippedSvg = stripSvgPaths(htmlWithSvg);
  assert.ok(strippedSvg.includes('<!-- icon omitted -->'));
  assert.ok(!strippedSvg.includes('M12 2C6.477'));

  const prettyJson = `{\n  "name": "test",\n  "version": "1.0.0"\n}`;
  const compacted = compactJson(prettyJson, 'compressed');
  assert.strictEqual(compacted, '{"name":"test","version":"1.0.0"}');
});

// ==========================================
// 3. Static Analyzer & AI Comprehension Tests
// ==========================================
console.log('\n--- 3. Static Analyzer & Architecture Mapping ---');

test('Analyzer extracts imports, exports, and classifies roles', () => {
  const jsCode = `
import { scanner } from './scanner.js';
import express from 'express';

export interface AppConfig {
  port: number;
}

export class AppServer {
  start() {}
}

export function init() {
  return true;
}

export const VERSION = '2.5.0';
`;
  const analysis = analyzeFile('src/js/app.js', jsCode);

  assert.strictEqual(analysis.role, 'entrypoint');
  assert.ok(analysis.imports.includes('./scanner.js'));
  assert.ok(analysis.imports.includes('express'));
  assert.ok(analysis.exports.includes('AppConfig'));
  assert.ok(analysis.exports.includes('AppServer'));
  assert.ok(analysis.exports.includes('init'));
  assert.ok(analysis.exports.includes('VERSION'));

  assert.strictEqual(classifyFileRole('package.json'), 'config');
  assert.strictEqual(classifyFileRole('netlify/functions/telegram-backup.js'), 'serverless');
  assert.strictEqual(classifyFileRole('test/test-engine.js'), 'test');
  assert.strictEqual(classifyFileRole('src/js/optimizer.js'), 'core');
});

test('Architecture map generates clear hierarchical summary', () => {
  const analyses = [
    { path: 'index.html', role: 'entrypoint', imports: ['src/js/app.js'], exports: [] },
    { path: 'src/js/app.js', role: 'entrypoint', imports: ['./scanner.js'], exports: ['start'] },
    { path: 'src/js/scanner.js', role: 'core', imports: [], exports: ['scanFileSystemEntries'] }
  ];
  const mapText = buildArchitectureMap(analyses);

  assert.ok(mapText.includes('[ENTRYPOINT] index.html -> imports: src/js/app.js'));
  assert.ok(mapText.includes('[ENTRYPOINT] src/js/app.js -> imports: ./scanner.js | exports: start'));
  assert.ok(mapText.includes('[CORE] src/js/scanner.js -> exports: scanFileSystemEntries'));
});

// ==========================================
// 4. Structured XML Context Builder Tests
// ==========================================
console.log('\n--- 4. Structured XML Context Builder ---');

test('Generates structured XML with context guide, architecture map, and duplicate references', () => {
  const xml = buildXmlContext({
    repositoryName: 'my-project',
    totalTokens: 14850,
    codeTokens: 14000,
    overheadTokens: 850,
    userInstructions: 'Act as pair programmer',
    userPrompt: 'Help fix database query',
    files: [
      { path: 'src/server.ts', content: 'export function run() {}', mode: 'full', tokens: 420 },
      { path: 'src/helpers/utils.ts', content: 'export function add() {}', mode: 'skeleton', tokens: 65 },
      { path: 'Deploy/src/server.ts', mode: 'duplicate', duplicateOf: 'src/server.ts', tokens: 5 }
    ],
    manifestMap: new Map([
      ['package.json', JSON.stringify({ name: 'my-pkg', dependencies: { express: '^4.18.2' } })]
    ])
  });

  assert.ok(xml.includes('<project_context repository="my-project" total_tokens="14850" code_tokens="14000" overhead_tokens="850">'));
  assert.ok(xml.includes('<context_guide>'));
  assert.ok(xml.includes('HOW TO READ THIS REPOSITORY CONTEXT:'));
  assert.ok(xml.includes('<architecture_map>'));
  assert.ok(xml.includes('<manifests>'));
  assert.ok(xml.includes('<directory_structure>'));
  assert.ok(xml.includes('<user_instructions>'));
  assert.ok(xml.includes('Act as pair programmer'));
  assert.ok(xml.includes('<codebase>'));
  assert.ok(xml.includes('<file path="src/server.ts" mode="full" tokens="420"'));
  assert.ok(xml.includes('<file path="Deploy/src/server.ts" mode="duplicate" duplicate_of="src/server.ts" tokens="5" />'));
  assert.ok(xml.includes('<user_prompt>'));
  assert.ok(xml.includes('Help fix database query'));
  assert.ok(xml.includes('</project_context>'));
});

test('CDATA escaping dynamically avoids double-escaping corruption', () => {
  const dangerousContent = 'const test = "]]>";';
  const escaped = escapeCData(dangerousContent);
  assert.strictEqual(escaped, 'const test = "]]]]><![CDATA[>";');

  // Verify multiple occurrences
  const multi = 'a]]>b]]>c';
  assert.strictEqual(escapeCData(multi), 'a]]]]><![CDATA[>b]]]]><![CDATA[>c');
});

test('Plain text context generation formats sections properly with architecture map', () => {
  const txt = buildPlainTextContext({
    repositoryName: 'test-repo',
    totalTokens: 100,
    userInstructions: 'Review architecture',
    userPrompt: 'Suggest improvements',
    files: [
      { path: 'main.js', content: 'console.log("hello");', mode: 'full', tokens: 10 },
      { path: 'copy.js', mode: 'duplicate', duplicateOf: 'main.js', tokens: 5 }
    ]
  });

  assert.ok(txt.includes('CONTEXT GUIDE:'));
  assert.ok(txt.includes('ARCHITECTURE MAP & SYMBOL INDEX:'));
  assert.ok(txt.includes('USER INSTRUCTIONS / CONTEXT:'));
  assert.ok(txt.includes('PROJECT FOLDER STRUCTURE:'));
  assert.ok(txt.includes('File: main.js [Mode: full'));
  assert.ok(txt.includes('File: copy.js [DUPLICATE of main.js]'));
  assert.ok(txt.includes('USER PROMPT / TASK:'));
});

// ==========================================
// 5. Token Metering & Context Overhead Tests
// ==========================================
console.log('\n--- 5. Token Metering, Calibration & Overhead Accounting ---');

test('Token estimation respects calibrated model windows and overhead', () => {
  const sample = 'function helloWorld(name) { return `Hello, ${name}!`; }';
  const tokens = estimateTokensSync(sample);
  assert.ok(tokens > 5 && tokens < 30);

  const overhead = calculateContextOverhead({
    userInstructions: 'Hello world',
    userPrompt: 'Test task',
    asciiTree: 'my-app/\n└── index.js\n',
    manifestSummary: 'deps: express',
    architectureMap: '[CORE] index.js',
    fileCount: 10,
    format: 'xml'
  });
  assert.ok(overhead > 150, `Overhead should be substantial (got ${overhead})`);

  const calibrated = getCalibratedModelTokens(10000);
  assert.strictEqual(calibrated.openai, 10000);
  assert.strictEqual(calibrated.claude, 10800); // 10000 * 1.08
  assert.strictEqual(calibrated.gemini, 10400); // 10000 * 1.04

  const budget32k = getBudgetStatus(25000);
  assert.strictEqual(budget32k.tier, 'green');

  const budget128k = getBudgetStatus(85000);
  assert.strictEqual(budget128k.tier, 'blue');

  const budget200k = getBudgetStatus(160000);
  assert.strictEqual(budget200k.tier, 'indigo');

  const budget1m = getBudgetStatus(450000);
  assert.strictEqual(budget1m.tier, 'purple');

  const budgetOver = getBudgetStatus(1200000);
  assert.strictEqual(budgetOver.tier, 'red');
});

// ==========================================
// 6. Netlify Serverless Telegram Function Tests
// ==========================================
console.log('\n--- 6. Netlify Function: telegram-backup.js ---');

await testAsync('OPTIONS request returns CORS headers with 204 status', async () => {
  const res = await telegramBackupHandler({ httpMethod: 'OPTIONS' });
  assert.strictEqual(res.statusCode, 204);
  assert.ok(res.headers['Access-Control-Allow-Origin']);
});

await testAsync('Non-POST request returns 405 Method Not Allowed', async () => {
  const res = await telegramBackupHandler({ httpMethod: 'GET' });
  assert.strictEqual(res.statusCode, 405);
  const json = JSON.parse(res.body);
  assert.ok(json.error.includes('Method GET Not Allowed'));
});

await testAsync('Missing credentials returns 500 with helpful instructions', async () => {
  const oldBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const oldChatId = process.env.TELEGRAM_CHAT_ID;
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;

  const res = await telegramBackupHandler({
    httpMethod: 'POST',
    body: JSON.stringify({ fileName: 'test.txt', fileContent: 'test' })
  });

  assert.strictEqual(res.statusCode, 500);
  const json = JSON.parse(res.body);
  assert.ok(json.error.includes('Telegram credentials not configured'));

  if (oldBotToken) process.env.TELEGRAM_BOT_TOKEN = oldBotToken;
  if (oldChatId) process.env.TELEGRAM_CHAT_ID = oldChatId;
});

await testAsync('Payload exceeding 4.5MB returns 413 Payload Too Large', async () => {
  process.env.TELEGRAM_BOT_TOKEN = 'mock-token';
  process.env.TELEGRAM_CHAT_ID = 'mock-chat-id';

  const hugeBody = JSON.stringify({
    fileName: 'large.txt',
    fileContent: 'x'.repeat(4.6 * 1024 * 1024)
  });

  const res = await telegramBackupHandler({
    httpMethod: 'POST',
    body: hugeBody
  });

  assert.strictEqual(res.statusCode, 413);
  const json = JSON.parse(res.body);
  assert.ok(json.error.includes('exceeds the 4.5MB Netlify serverless limit'));
});

await testAsync('Missing fileContent returns 400 Bad Request', async () => {
  process.env.TELEGRAM_BOT_TOKEN = 'mock-token';
  process.env.TELEGRAM_CHAT_ID = 'mock-chat-id';

  const res = await telegramBackupHandler({
    httpMethod: 'POST',
    body: JSON.stringify({ fileName: 'empty.txt' })
  });

  assert.strictEqual(res.statusCode, 400);
  const json = JSON.parse(res.body);
  assert.ok(json.error.includes('Missing required field: fileContent'));
});

console.log(`\n==========================================`);
console.log(`Test Suite Finished: ${passedTests} Passed, ${failedTests} Failed.`);
console.log(`==========================================\n`);

if (failedTests > 0) {
  process.exit(1);
}
