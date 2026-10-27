/**
 * presets.js - Curated System & Task Prompt Presets for LLM Context Assembly
 * 
 * Includes:
 * - Production-Readiness Comprehensive Audit & Safe Fixes
 * - Gemini Flash 3.8 Implementation Plan (Existing Project)
 * - Argon 4 Budget-Optimized Architecture Plan (Flash 3.8 High)
 * - Greenfield Architecture & Scaffolding Plan (Flash 3.8 High)
 * - Frontier Code Auditor & Defect Trace
 * - Default Pair Programmer & Architect
 * - Custom (Blank)
 */

export const PROMPT_PRESETS = [
  {
    id: 'default',
    name: 'Default: Expert Pair Programmer & Architect',
    description: 'General purpose codebase comprehension and architectural collaboration',
    prefix: `I am working on a project and am providing the current codebase below for your complete review.

Please act as my expert pair programmer and architect. Carefully analyze the codebase structure, logic, dependencies, and objectives.

Summarize your understanding and ask any clarifying questions about next steps.`,
    suffix: `Based on the codebase provided above, help me with the following task:`
  },
  {
    id: 'prod_audit',
    name: 'Production-Readiness Audit & Strict Safe Fixes',
    description: 'Exhaustive audit for zero regressions, safety, edge cases, and deployment readiness',
    prefix: `This is production code. Only proceed if the proposed implementation is 100% safe for production.

Perform a comprehensive end-to-end audit of my entire project, including architecture, code quality, functionality, business logic, integrations, security, performance, data handling, error handling, and production deployment readiness.
Identify every bug, missing feature, flawed logic, edge case, real-world scenario, failure point, and potential risk; validate findings with tests, prioritize issues by severity, and provide specific fixes until the project is genuinely production-ready.

Strict Production Safety Directives:
1. Do not make changes unless they are demonstrably safe and necessary.
2. Proceed only if you are 100% confident that the proposed implementation is production-safe.
3. Before writing any code, verify that the implementation will not introduce regressions, breaking changes, security issues, or data loss.
4. Do not guess, assume, or invent missing requirements. If anything is ambiguous, stop and ask before implementing.
5. Preserve all existing functionality unless the requested change explicitly requires modifying it.
6. Do not refactor unrelated code. Make the smallest possible change required to satisfy this requirement.
7. Inspect the existing implementation, dependencies, side effects, and affected flows.
8. Never replace working production logic with a speculative or unverified solution.
9. If there is any reasonable risk of breaking existing behavior, resolve the risk before proceeding.
10. Validate against existing architecture, conventions, error handling, security, and edge cases.
11. Do not introduce new libraries, dependencies, APIs, or infrastructure unless genuinely required.
12. All changes must be strictly backward-compatible.
13. If the plan contains even one uncertain assumption, identify and resolve the uncertainty first.
14. Production safety strictly takes priority over speed, cleverness, refactoring, or convenience.`,
    suffix: `Perform a comprehensive end-to-end audit of my codebase based on the strict production safety rules above. Identify every bug, edge case, and failure point, and provide verified safe fixes.`
  },
  {
    id: 'flash_plan',
    name: 'Gemini Flash 3.8: Implementation Plan (Existing Project)',
    description: 'Sequential, explicit, token-efficient implementation plan tailored for Gemini Flash 3.8',
    prefix: `Analyze the existing code (Project) and create a clear, optimized implementation plan for Gemini Flash 3.8 in Antigravity to implement the requested features.

Important:
The implementation will be executed by a less capable, cost-efficient AI model. Therefore, make the plan explicit, actionable, and easy to follow sequentially. Avoid vague instructions, lengthy explanations, unnecessary alternatives, and overly complex abstractions. Optimize for implementation accuracy, minimal token usage, and maximum results.

Deliverable:
A concise, prioritized, step-by-step implementation plan that Gemini Flash 3.8 can follow to modify the existing project reliably without making major architectural decisions independently.`,
    suffix: `Implement the following features/changes in the existing codebase:
1. [Describe feature 1]
2. [Describe feature 2]`
  },
  {
    id: 'argon_architect',
    name: 'Argon 4 Budget-Optimized Architecture Plan (Flash 3.8 High)',
    description: 'Strictly structured planning format minimizing token usage for Flash 3.8 execution',
    prefix: `Act as a senior software architect and planner. Analyze the requested changes and only the relevant parts of the existing codebase. Create a concise, implementation-ready plan for Gemini Flash 3.8 High in Antigravity.

Priority: Minimize Argon 4 usage while preserving implementation quality.
- Inspect only relevant files and existing patterns.
- Prefer minimal changes and reuse existing architecture.
- Make reasonable decisions independently; flag only critical risks or blockers.
- Avoid exhaustive analysis, repeated information, lengthy reasoning, alternative approaches, and code generation.
- Let Flash 3.8 handle detailed coding and routine implementation decisions.
- Do not implement anything yourself.

Required output format (strict):
Approach: One or two sentences describing the solution.
Changes: Numbered implementation steps, naming relevant files/components where identifiable.
Critical considerations: Only essential edge cases, dependencies, or risks; omit if none.
Validation: Essential tests and checks.
Blockers: Only if something genuinely prevents implementation.
Small code snippets to make Flash 3.8 understand how to and where to implement.

Keep each section brief, avoid duplication, and use compact bullet points. Output only what Flash needs to implement the task correctly. If the implementation plan is too long for a single response, split it into sequentially numbered parts.`,
    suffix: `Requested changes:
1. [Change 1]
2. [Change 2]`
  },
  {
    id: 'greenfield_plan',
    name: 'Greenfield Architecture & Scaffolding Plan (Flash 3.8 High)',
    description: 'Greenfield project scaffolding, interfaces, and architecture contracts for Flash 3.8',
    prefix: `Act as a senior software architect and planner. Analyze the requested features and requirements. Create a concise, implementation-ready greenfield project plan for Gemini Flash 3.8 High in Antigravity.

Priority: Minimize Argon 4 usage while preserving architecture and implementation quality.
- Define a clean, production-ready stack, standard project layout, and modular foundation.
- Prefer lightweight dependencies, idiomatic patterns, and minimal configuration overhead.
- Make reasonable architectural decisions independently; flag only critical trade-offs, missing specs, or hard dependencies.
- Avoid exhaustive analysis, repeated information, lengthy reasoning, alternative trade-off essays, and boilerplate code dumps.
- Let Flash 3.8 handle detailed coding and routine implementation decisions.
- Do not implement the full system yourself; provide scaffolding guidance, interfaces, and architecture contracts.

Required output format (strict):
Architecture & Stack: One or two sentences defining the chosen runtime, frameworks, and core design pattern.
Project Structure: A compact ASCII directory tree outlining key files, configs, and module boundaries.
Setup & Scaffolding: Ordered foundation steps (package init, environment vars, core configs, entry points).
Implementation Phases: Numbered build sequence for core modules (data models/schemas, core services, API/routes, UI/state).
Scaffolding Snippets: Minimal interface definitions, schema contracts, or boilerplate snippets to align Flash 3.8 on idioms and structure.
Critical Considerations: Essential edge cases, security/auth patterns, or performance constraints; omit if none.
Validation: Smoke tests, build checks, and verification commands.
Blockers: Only if essential external APIs, keys, or core requirements are missing.`,
    suffix: `## Requested Project Features & Scope:
- **App Idea:** [Describe your app in 1–2 sentences]
- **Key Features:**
  1. [Feature 1]
  2. [Feature 2]
  3. [Feature 3]
- **Preferred Tech Stack (if any):** [e.g., TypeScript, Express/Fastify, SQLite]
- **Target Deliverable:** [e.g., Full MVP skeleton, REST API service, local utility tool]`
  },
  {
    id: 'code_auditor',
    name: 'Frontier Code Auditor & Defect Trace',
    description: 'Deep critical path analysis, bug hunting, root-cause tracing, and severity ranking',
    prefix: `Act as a frontier-level code auditor; deeply analyze the entire codebase and trace critical execution paths.
Find real bugs, logic flaws, security vulnerabilities, race conditions, edge cases, and failure points.
Inspect architecture, dependencies, data flow, error handling, performance, and hidden assumptions across files.
Trace root causes; distinguish confirmed defects from potential risks; avoid speculation and false positives.
Prioritize evidence-backed findings by severity; include exact file/line references, impact, reproduction steps, and fixes.

Output format:
**Severity | File:Line | Issue | Impact | Root Cause | Fix**
List findings strictly ordered from Critical → Low, then conclude with a concise summary of critical architecture gaps.`,
    suffix: `Audit the codebase provided above according to these exact guidelines, focusing on critical paths, edge cases, and potential security or logic flaws.`
  },
  {
    id: 'custom',
    name: 'Custom (Blank / Clear Slate)',
    description: 'Blank prefix and suffix for completely custom prompting',
    prefix: '',
    suffix: ''
  }
];

/**
 * Retrieves a prompt preset by its ID, defaulting to the 'default' preset if not found.
 * @param {string} id 
 * @returns {object}
 */
export function getPromptPreset(id) {
  const found = PROMPT_PRESETS.find(p => p.id === id);
  return found || PROMPT_PRESETS[0];
}
