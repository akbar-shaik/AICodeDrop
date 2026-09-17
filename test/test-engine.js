/**
 * test-engine.js - Comprehensive Verification Suite for AICodeDrop v2
 */

import assert from 'node:assert';
import {
  parseGitignoreRule,
  compileGitignore,
  isZeroValueSink,
  isEligibleFile,
  sanitizeSecrets,
  getExtension
} from '../src/js/scanner.js';

import {
  normalizeWhitespace,
  stripComments,
  skeletonizeJsTs,
  skeletonizePython,
  skeletonizeCurlyBraceLangs,
  optimizeContent
} from '../src/js/optimizer.js';

import {
  buildXmlContext,
  buildPlainTextContext,
  generateAsciiTree,
  escapeCData
} from '../src/js/xmlFormatter.js';

import {
  estimateTokensSync,
  getBudgetStatus,
  MODEL_THRESHOLDS
} from '../src/js/tokenizer.js';

import { handler as telegramBackupHandler } from '../netlify/functions/telegram-backup.js';

console.log('🧪 Starting AICodeDrop v2 Test Suite...\n');

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
// 1. Scanner & .gitignore Tests
// ==========================================
console.log('--- 1. Ingestion Engine & .gitignore ---');

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

test('Zero-value sink purge excludes lockfiles and minified files', () => {
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

// ==========================================
// 2. Token Minimization Pipeline Tests
// ==========================================
console.log('\n--- 2. Token Minimization Pipeline ---');

test('Whitespace normalization collapses empty lines and tabs', () => {
  const input = '\tconst a = 1;\n\n\n\n\tconst b = 2;   \n';
  const output = normalizeWhitespace(input);

  assert.strictEqual(output, '  const a = 1;\n\n  const b = 2;');
});

test('Universal comment stripper preserves string literals across languages', () => {
  // JavaScript / TypeScript
  const jsInput = `
// Single line comment
const url = "https://example.com//not-a-comment";
/* Multi-line
   comment */
const template = \`/* not a comment either */\`;
const greeting = 'Hello // world';
`;
  const jsCleaned = stripComments(jsInput, 'js');
  assert.ok(!jsCleaned.includes('Single line comment'));
  assert.ok(!jsCleaned.includes('Multi-line'));
  assert.ok(jsCleaned.includes('"https://example.com//not-a-comment"'));
  assert.ok(jsCleaned.includes('`/* not a comment either */`'));
  assert.ok(jsCleaned.includes("'Hello // world'"));

  // Python
  const pyInput = `
# Comment here
url = "https://domain.com#hash"
""" Docstring to strip """
def test():
    # another comment
    return 'ok'
`;
  const pyCleaned = stripComments(pyInput, 'py');
  assert.ok(!pyCleaned.includes('Comment here'));
  assert.ok(!pyCleaned.includes('Docstring to strip'));
  assert.ok(pyCleaned.includes('"https://domain.com#hash"'));
  assert.ok(pyCleaned.includes("'ok'"));
});

test('Structural skeletonizer preserves JS/TS signatures and types', () => {
  const tsCode = `
import { Config } from './config';
export interface User {
  id: string;
  name: string;
}

export class UserService {
  constructor(private db: any) {
    this.init();
  }

  async getUser(id: string): Promise<User> {
    const res = await this.db.find(id);
    return res;
  }
}

export function helper(val: number): number {
  const temp = val * 2;
  return temp + 1;
}
`;
  const skeleton = skeletonizeJsTs(tsCode);

  assert.ok(skeleton.includes("import { Config } from './config';"));
  assert.ok(skeleton.includes('export interface User'));
  assert.ok(skeleton.includes('export class UserService'));
  assert.ok(skeleton.includes('/* implementation omitted */'));
  assert.ok(!skeleton.includes('this.init();'));
  assert.ok(!skeleton.includes('const temp = val * 2;'));
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

// ==========================================
// 3. Structured XML Formatter Tests
// ==========================================
console.log('\n--- 3. Structured XML Context Builder ---');

test('Generates structured XML adhering to Claude 3.7 / GPT-4o / Gemini format', () => {
  const xml = buildXmlContext({
    repositoryName: 'my-project',
    totalTokens: 14850,
    userInstructions: 'Act as pair programmer',
    userPrompt: 'Help fix database query',
    files: [
      { path: 'src/server.ts', content: 'console.log("server");', mode: 'full', tokens: 420 },
      { path: 'src/helpers/utils.ts', content: 'export function add() {}', mode: 'skeleton', tokens: 65 }
    ],
    manifestMap: new Map([
      ['package.json', JSON.stringify({ dependencies: { express: '^4.18.2' } })]
    ])
  });

  assert.ok(xml.includes('<project_context repository="my-project" total_tokens="14850">'));
  assert.ok(xml.includes('<manifests>'));
  assert.ok(xml.includes('<directory_structure>'));
  assert.ok(xml.includes('<user_instructions>'));
  assert.ok(xml.includes('Act as pair programmer'));
  assert.ok(xml.includes('<codebase>'));
  assert.ok(xml.includes('<file path="src/server.ts" mode="full" tokens="420">'));
  assert.ok(xml.includes('<![CDATA[\nconsole.log("server");\n]]>'));
  assert.ok(xml.includes('<file path="src/helpers/utils.ts" mode="skeleton" tokens="65">'));
  assert.ok(xml.includes('<user_prompt>'));
  assert.ok(xml.includes('Help fix database query'));
  assert.ok(xml.includes('</project_context>'));
});

test('CDATA escaping correctly handles nested "]]>" characters', () => {
  const dangerousContent = 'const test = "]]>";';
  const escaped = escapeCData(dangerousContent);
  assert.strictEqual(escaped, 'const test = "]]]]><![CDATA[>";');
});

test('HTML and SQL comment stripping works correctly', () => {
  const html = '<div class="test"><!-- This is a comment --><span>Hello</span></div>';
  const strippedHtml = stripComments(html, 'html');
  assert.strictEqual(strippedHtml, '<div class="test"><span>Hello</span></div>');

  const sql = `
-- Select query
SELECT * FROM users WHERE id = 1; -- inline comment
/* Multi-line
   block */
`;
  const strippedSql = stripComments(sql, 'sql');
  assert.ok(!strippedSql.includes('-- Select query'));
  assert.ok(!strippedSql.includes('/* Multi-line'));
  assert.ok(strippedSql.includes('SELECT * FROM users WHERE id = 1;'));
});

test('ASCII folder tree generation produces correct visual hierarchy', () => {
  const tree = generateAsciiTree('my-app', [
    'src/index.js',
    'src/utils/helpers.js',
    'package.json'
  ]);
  assert.ok(tree.startsWith('my-app/\n'));
  assert.ok(tree.includes('src/'));
  assert.ok(tree.includes('utils/'));
  assert.ok(tree.includes('helpers.js'));
  assert.ok(tree.includes('index.js'));
  assert.ok(tree.includes('package.json'));
});

test('Plain text context generation formats sections properly', () => {
  const txt = buildPlainTextContext({
    repositoryName: 'test-repo',
    userInstructions: 'Review architecture',
    userPrompt: 'Suggest improvements',
    files: [{ path: 'main.js', content: 'console.log("hello");', mode: 'full', tokens: 10 }]
  });

  assert.ok(txt.includes('USER INSTRUCTIONS / CONTEXT:'));
  assert.ok(txt.includes('PROJECT FOLDER STRUCTURE:'));
  assert.ok(txt.includes('File: main.js [Mode: full] [Tokens: ~10]'));
  assert.ok(txt.includes('USER PROMPT / TASK:'));
});

// ==========================================
// 4. Token Metering Tests
// ==========================================
console.log('\n--- 4. Token Metering & Budget Thresholds ---');

test('Token estimation produces positive values and respects model windows', () => {
  const sample = 'function helloWorld(name) { return `Hello, ${name}!`; }';
  const tokens = estimateTokensSync(sample);
  assert.ok(tokens > 5 && tokens < 30);

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
// 5. Netlify Serverless Telegram Function Tests
// ==========================================
console.log('\n--- 5. Netlify Function: telegram-backup.js ---');

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
  // Ensure env is empty for test
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

  // Restore env
  if (oldBotToken) process.env.TELEGRAM_BOT_TOKEN = oldBotToken;
  if (oldChatId) process.env.TELEGRAM_CHAT_ID = oldChatId;
});

await testAsync('Payload exceeding 4.5MB returns 413 Payload Too Large', async () => {
  process.env.TELEGRAM_BOT_TOKEN = 'mock-token';
  process.env.TELEGRAM_CHAT_ID = 'mock-chat-id';

  // Create a body larger than 4.5MB (4.6MB)
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
