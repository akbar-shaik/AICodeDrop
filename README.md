# 🤖 AICodeDrop v2

**100% Client-Side AI Codebase Ingestion, Token Minimizer & Structured XML Context Assembler.**

[![Netlify Status](https://api.netlify.com/api/v1/badges/netlify/status)](https://www.netlify.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

AICodeDrop v2 converts entire multi-file codebases into optimized, model-ready XML (Claude 3.7, GPT-4o, Gemini 2.5/1.5) or structured plain-text context directly inside your browser.

By executing all directory traversal, `.gitignore` evaluation, comment stripping, structural skeletonization, secret sanitization, and token estimation client-side in the browser, AICodeDrop v2 can process multi-megabyte codebases without hitting any server timeout or payload limits at zero hosting cost on Netlify's free tier.

---

## 🏛️ System Architecture

```
                      [ Client Browser (Pure Static SPA) ]
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       ▼                              ▼                              ▼
[ 1. Ingestion Engine ]    [ 2. Optimization Pipeline ]   [ 3. Token & XML Assembler ]
 • Directory scanning       • Secret sanitization          • Tiktoken BPE calculation
 • .gitignore rule parsing  • Comment stripping            • XML schema packaging
 • Binary/lockfile filter   • Skeleton outline mode        • Direct local .txt/.xml download
                                      │
                                      ▼ (Payload < 4.5MB Serverless Guardrail)
                       [ Netlify Function: /api/backup ]
                                      │
                                      ▼
                         [ Telegram Bot API (Backup) ]
```

---

## ✨ Key Features in v2

- **⚡ 100% Browser-Powered:** Zero server dependencies for processing. Code never leaves your browser unless you explicitly trigger the optional Telegram backup.
- **🛡️ Native `.gitignore` Parser:** Automatically reads `.gitignore` at your project root, compiling glob patterns to exclude unwanted files and directories.
- **🧹 Zero-Value Token Sink Purge:** Automatically blocks massive token sinks like `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `Cargo.lock`, and minified assets (`*.min.js`, `*.bundle.css`).
- **🔒 Automated Secret Sanitizer:** Pre-scan regex passes automatically redact private keys, Telegram bot tokens, AWS access keys, GitHub tokens, and AI API keys before assembly.
- **✂️ Token Minimization Pipeline:**
  - **Whitespace Normalization:** Tabs converted to 2 spaces, trailing spaces stripped, 3+ blank lines collapsed.
  - **Universal Comment Stripping:** String-literal-aware comment stripper supporting C-style, Python/Ruby/Shell, SQL, and HTML.
  - **Structural Skeletonization:** Preserves exports, classes, interfaces, types, and function signatures while omitting function bodies (`/* implementation omitted */`) — saving 60% – 85% of tokens.
- **📊 Real-Time Token Budget Meter:**
  - Visual milestone capacity bar reflecting:
    - **32k** (Standard Baseline)
    - **128k** (GPT-4o)
    - **200k** (Claude 3.5 / 3.7 Sonnet)
    - **1M+** (Gemini 1.5 / 2.5 Pro)
  - Non-blocking token counting with Web Worker offloading.
- **📋 Structured LLM XML Format:** Formats output with `<project_context>`, auto-extracted dependency manifests, ASCII directory tree, and CDATA-escaped code files.
- **🚀 Netlify Serverless Telegram Relay:** Lightweight, optional relay with an enforced 4.5MB payload boundary to safely respect Netlify's 6MB limit.

---

## 📂 Project Structure

```
aicode-drop-v2/
├── netlify/
│   └── functions/
│       └── telegram-backup.js     # Serverless relay with 4.5MB guardrails
├── public/
│   └── favicon.svg                # Modern SVG favicon
├── src/
│   ├── js/
│   │   ├── app.js                 # UI coordinator & DOM event orchestration
│   │   ├── scanner.js             # Client-side traversal & .gitignore glob parser
│   │   ├── optimizer.js           # Comment stripping, whitespace normalization, skeletonizer
│   │   ├── tokenizer.js           # Tiktoken/BPE client-side estimation
│   │   ├── worker.js              # Dedicated Web Worker for background tokenization
│   │   └── xmlFormatter.js        # Structured LLM XML / Plain-text assembler
│   └── css/
│       └── styles.css             # Custom utility styles, terminal scrollbars & animations
├── test/
│   └── test-engine.js             # Automated test suite (18 assertions)
├── index.html                     # Modernized UI with Tailwind CSS & Token Budget Bar
├── netlify.toml                   # Netlify configuration & API route redirects
└── package.json                   # Project metadata & dependencies
```

---

## 🚀 Deployment to Netlify

### 1-Click Deployment
1. Connect your repository to Netlify.
2. The included `netlify.toml` automatically configures the publish directory and functions directory:
   ```toml
   [build]
     publish = "."
     functions = "netlify/functions"

   [[redirects]]
     from = "/api/backup"
     to = "/.netlify/functions/telegram-backup"
     status = 200

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200
   ```
3. *(Optional)* Set your Telegram environment variables in **Netlify Site Configuration > Environment Variables**:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`

---

## 🧪 Testing

Run the automated test suite locally with Node.js:

```bash
npm test
```

---

## 📄 License

MIT © Akbar Shaik
