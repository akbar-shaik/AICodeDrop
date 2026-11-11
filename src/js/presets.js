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

// ==========================================
// PromptShelf Studio Categories & Library
// ==========================================

export const PROMPT_CATEGORIES = [
  { id: 'all', name: 'All Categories', icon: '▦', color: 'slate' },
  { id: 'favorites', name: 'Favorites', icon: '★', color: 'amber' },
  { id: 'Prompt Engineering', name: 'Prompt Engineering', icon: '✦', color: 'purple' },
  { id: 'Production Safety', name: 'Production Safety', icon: '◇', color: 'green' },
  { id: 'Planning & Architecture', name: 'Planning & Architecture', icon: '⌘', color: 'amber' },
  { id: 'Code Quality', name: 'Code Quality', icon: '⌁', color: 'blue' },
  { id: 'Testing & QA', name: 'Testing & QA', icon: '✓', color: 'green' },
  { id: 'Security & Performance', name: 'Security & Performance', icon: '⬡', color: 'rose' },
  { id: 'DevOps & Reliability', name: 'DevOps & Reliability', icon: '⇧', color: 'blue' },
  { id: 'Research & Documentation', name: 'Research & Documentation', icon: '▤', color: 'amber' },
  { id: 'custom', name: 'My Custom Prompts', icon: '✎', color: 'indigo' },
  { id: 'classic', name: 'Classic Presets', icon: '⚡', color: 'blue' }
];

export const PROMPT_LIBRARY = [
  {
    "id": "master-architect",
    "title": "Master Meta-Prompt: Expert Prompt Architect",
    "category": "Prompt Engineering",
    "kind": "Core framework",
    "featured": true,
    "description": "Turn a vague request into a complete, efficient, ready-to-use prompt for a weaker AI model.",
    "tags": [
      "Prompt design",
      "Weak-model friendly",
      "Reusable"
    ],
    "prompt": "# ROLE: EXPERT PROMPT ARCHITECT\nAct as a senior prompt engineer, systems analyst, and instruction designer. Convert my raw request into a precise, self-contained prompt that a comparatively weak AI model can execute reliably.\n\n## OBJECTIVE\nEngineer the task, not just rewrite my wording. Maximize execution accuracy while minimizing unnecessary tokens.\n\n## WORKFLOW\n1. Understand the goal: identify the desired outcome, underlying need, deliverable, context, constraints, and success criteria.\n2. Check inputs: list what is known, what is missing, and what must not be assumed.\n3. Resolve ambiguity: infer only low-risk details. Ask one concise question only when an unknown would materially change the result. Otherwise state a reasonable assumption.\n4. Design execution: choose the correct sequence, decision rules, tools, calculations, dependencies, and verification steps. Make critical decisions explicit so the target model does not have to invent them.\n5. Draft: use simple language, numbered steps, explicit priorities, exact output structures, and placeholders for changing values.\n6. Harden: address likely failure modes, invalid inputs, edge cases, conflicting requirements, and uncertainty.\n7. Compress: remove repetition and filler without deleting requirements needed for correctness.\n8. Validate: check that a weaker model can understand the task, follow the order, produce the specified deliverable, and verify completion.\n\n## WEAK-MODEL RULES\n- Give each instruction one clear purpose.\n- Separate mandatory requirements from optional suggestions.\n- Define important terms and provide exact formats where consistency matters.\n- Never use vague directions such as \"do your best\" or \"make it perfect\".\n- Do not invent facts, APIs, files, requirements, or capabilities.\n- State what to do when information is missing or uncertain.\n- Do not expose private reasoning. Provide decisions, assumptions, and concise rationale only.\n- Do not claim guaranteed success.\n\n## OUTPUT\n1. Understanding: a brief statement of the goal and chosen approach.\n2. Final optimized prompt: complete and ready to copy. It must work without access to this conversation.\n3. Configuration notes: only required placeholders, files, tools, or assumptions.\n4. Optimization notes: only meaningful safeguards or design choices.\n\n## INPUT\nMy request: [PASTE REQUEST]\nTarget model/tool: [MODEL OR UNKNOWN]\nAvailable context/files: [CONTEXT OR NONE]\nConstraints: [CONSTRAINTS OR NONE]\n\nApply the workflow now. If the request is sufficiently clear, produce the prompt without asking unnecessary questions."
  },
  {
    "id": "production-readiness",
    "title": "Production Readiness: Full Project Audit",
    "category": "Production Safety",
    "kind": "Safety gate",
    "featured": true,
    "description": "Audit the project end to end and separate verified defects from potential risks before release.",
    "tags": [
      "Production",
      "Audit",
      "Risk-based"
    ],
    "prompt": "# ROLE\nAct as a senior software architect, application security reviewer, and QA lead.\n\n# OBJECTIVE\nAssess whether this project is ready for production. Find evidence-backed defects, missing controls, and operational risks. Do not change code during the audit.\n\n# SCOPE\nInspect relevant architecture, code quality, business logic, data flows, APIs, integrations, authentication, authorization, validation, error handling, logging, performance, dependencies, tests, configuration, deployment, backups, and recovery.\n\n# METHOD\n1. Map the application structure and identify critical execution paths.\n2. Inspect entry points, data boundaries, privileged operations, external integrations, and persistence flows.\n3. Trace important flows from input to output, including failure handling.\n4. Run existing tests and safe static/build checks. Do not run destructive commands or access production data.\n5. Reproduce suspected defects where practical. Distinguish confirmed defects from unverified risks.\n6. Check common real-world cases: invalid input, empty data, network failure, timeouts, retries, duplicate requests, concurrent use, permission boundaries, and partial failure.\n7. Prioritize by severity and likelihood. Cite exact file and line references where available.\n8. Recommend the smallest practical remediation and a verification test for each finding.\n\n# SAFETY\n- Audit only. Do not edit files, migrate data, change configuration, or deploy.\n- Do not claim complete coverage if files, tools, or tests were unavailable.\n- Never expose secrets found in files; identify their location and recommend rotation.\n- Do not invent findings or report style preferences as defects.\n\n# OUTPUT\nA. Executive verdict: Ready / Ready with conditions / Not ready, with a brief evidence-based reason.\nB. Findings table: Severity | Confidence | File:Line | Issue | Impact | Evidence / Reproduction | Recommended fix | Verification.\nC. Critical production gaps: only items that block release.\nD. Test and check results: command, outcome, and limitations.\nE. Ordered remediation checklist.\n\nSeverity: Critical = likely severe compromise, data loss, or outage; High = major functionality/security impact; Medium = meaningful but bounded impact; Low = minor risk. Be explicit about uncertainty."
  },
  {
    "id": "production-change-gate",
    "title": "Production Change: Safety Gate Before Coding",
    "category": "Production Safety",
    "kind": "Do-not-break protocol",
    "featured": true,
    "description": "Require evidence and impact analysis before allowing any modification to live production code.",
    "tags": [
      "No regressions",
      "Minimal diff",
      "Backward compatible"
    ],
    "prompt": "This is production code. Production safety and data integrity take priority over speed.\n\nBefore writing or changing any code:\n1. Inspect the relevant implementation, tests, configuration, and call sites. Understand current behavior.\n2. Identify affected files, dependencies, side effects, data flows, permissions, and consumers.\n3. Confirm the requested behavior and acceptance criteria. Do not invent missing requirements.\n4. Check for regressions, breaking changes, security issues, data loss, performance impact, and backward-compatibility risks.\n5. Prefer the smallest change that fully satisfies the request. Reuse existing patterns. Do not refactor unrelated code or add dependencies without a demonstrated need.\n6. Define a validation plan covering normal behavior, failure paths, invalid input, edge cases, and existing functionality.\n7. If any critical requirement is ambiguous or a material safety risk is unresolved, STOP before editing. Explain the precise blocker and ask only the question needed to resolve it.\n8. If safe to proceed, implement only the approved scope, then run the relevant tests and inspect the final diff.\n\nNever claim 100% certainty. State what was verified and what could not be verified. Never hide uncertainty, silently change behavior, or replace working logic with an untested solution.\n\nRequested change: [DESCRIBE CHANGE]\nRelevant context: [FILES / REQUIREMENTS / TESTS]\n\nFirst output: Scope understood | Affected areas | Risks | Validation plan | Proceed or Blocked. Do not edit until this safety gate passes."
  },
  {
    "id": "safe-implementation",
    "title": "Minimal Safe Implementation Protocol",
    "category": "Production Safety",
    "kind": "Implementation guardrail",
    "description": "A compact set of rules for implementing a change while protecting existing behavior.",
    "tags": [
      "Small diff",
      "Code changes",
      "Compatibility"
    ],
    "prompt": "Implement this change in the existing project: [REQUEST].\n\nRules:\n1. Inspect the relevant files and trace the current behavior before editing.\n2. Identify dependencies, callers, side effects, data contracts, and affected tests.\n3. Reuse the current architecture, naming, validation, and error-handling patterns.\n4. Make the smallest complete change. Preserve all unrelated behavior.\n5. Do not refactor, rename, reformat, or restructure unrelated code.\n6. Do not add a package, service, API, database field, or infrastructure unless required. Explain any necessary addition.\n7. Preserve existing interfaces and data formats unless the request explicitly authorizes a breaking change.\n8. Validate inputs and handle expected failures. Protect secrets and sensitive data.\n9. Add or update focused tests for the change and regression-prone behavior.\n10. Run the relevant test, lint, type-check, and build commands available in the project. Inspect the final diff for unintended edits.\n\nStop and report a blocker before editing if a missing requirement or unresolved risk could change the correct implementation. Do not claim tests passed unless you ran them.\n\nFinal response: Summary | Files changed | Behavior changed | Tests run and results | Remaining risks."
  },
  {
    "id": "existing-project-plan",
    "title": "Existing Project: Implementation Plan",
    "category": "Planning & Architecture",
    "kind": "Antigravity planner",
    "featured": true,
    "description": "Create a concise, prioritized execution plan for Gemini Flash or another cost-efficient coding model.",
    "tags": [
      "Antigravity",
      "Gemini Flash",
      "Token efficient"
    ],
    "prompt": "Act as a senior software architect and implementation planner. Analyze only the relevant parts of my existing project and create a concise, executable plan for [TARGET MODEL / IDE, e.g. Gemini Flash in Antigravity]. Do not implement the changes.\n\n## PRIORITIES\n- Minimize expensive-model usage without sacrificing correctness.\n- Reuse the existing architecture, components, and conventions.\n- Prefer minimal, backward-compatible changes.\n- Make reasonable low-risk decisions independently. Flag only genuine blockers or important risks.\n- Avoid exhaustive codebase analysis, code generation, repeated explanations, and unnecessary alternatives.\n\n## TASK\nRequested changes: [LIST FEATURES / BUG FIXES]\n\n## ANALYSIS\nInspect the relevant files, trace affected flows, and identify essential dependencies, data contracts, side effects, and tests. Do not assume files or APIs exist. Mention a file only when it is identifiable from the repository.\n\n## REQUIRED OUTPUT\n1. Approach: one or two sentences describing the recommended solution.\n2. Changes: ordered implementation steps, naming relevant files/components and what to change.\n3. Critical considerations: essential edge cases, dependencies, compatibility, or risks only.\n4. Validation: focused tests, build checks, and commands.\n5. Blockers: only facts that genuinely prevent safe implementation.\n6. Scaffolding snippets: include only small interfaces, schemas, or examples that prevent likely implementation mistakes.\n\nKeep the plan short but complete enough that the target model does not need to make major architectural decisions. Do not write code or modify files. If a detail is uncertain but non-critical, state the assumption; if it is critical, identify it as a blocker."
  },
  {
    "id": "budget-plan",
    "title": "Cost-Efficient Planner for Weak Coding Models",
    "category": "Planning & Architecture",
    "kind": "Token-saving planner",
    "description": "Give a coding agent a short implementation checklist while reserving expensive reasoning for real blockers.",
    "tags": [
      "Low token use",
      "Checklist",
      "Agent workflow"
    ],
    "prompt": "You are a pragmatic senior engineer preparing work for a cost-efficient coding model.\n\nGoal: Create the shortest implementation plan that preserves all essential technical details.\n\nTask: [REQUEST]\nProject context: [RELEVANT FILES / ARCHITECTURE]\nTarget executor: [MODEL / IDE]\n\nInstructions:\n1. Inspect only files directly related to the task and their immediate dependencies.\n2. Reuse established patterns; avoid architecture changes unless required.\n3. Decide routine technical details yourself. Do not present multiple options unless a real trade-off affects the outcome.\n4. List exact files or modules to inspect/change when known. Never invent paths.\n5. Specify ordered changes, critical data/API contracts, and non-obvious edge cases.\n6. Exclude unrelated cleanup, broad audits, boilerplate, and code dumps.\n7. State assumptions briefly. Stop only for a missing fact that could cause a wrong or unsafe implementation.\n8. Include only high-value validation steps.\n\nOutput exactly:\nApproach: [1–2 sentences]\nSteps: [numbered, actionable checklist]\nRisks / blockers: [only material items]\nValidation: [commands or focused checks]\n\nDo not implement the task. Optimize for high signal per token, not an arbitrary word limit."
  },
  {
    "id": "greenfield-plan",
    "title": "Greenfield: Production-Ready Project Blueprint",
    "category": "Planning & Architecture",
    "kind": "New project planner",
    "featured": true,
    "description": "Plan a clean project foundation, stack, module boundaries, and phased build sequence from scratch.",
    "tags": [
      "Greenfield",
      "Stack selection",
      "Scaffolding"
    ],
    "prompt": "Act as a senior software architect. Produce an implementation-ready greenfield blueprint for: [APP IDEA].\n\nInputs:\n- Core users and problem: [USERS / PROBLEM]\n- Required features: [FEATURES]\n- Preferred stack: [STACK OR \"CHOOSE A SUITABLE STACK\"]\n- Target deliverable: [MVP / API / WEB APP / TOOL]\n- Deployment environment: [ENVIRONMENT OR UNKNOWN]\n\nDesign rules:\n1. Choose a simple, maintainable stack that fits the requirements. Prefer mature, lightweight dependencies and minimal infrastructure.\n2. State key assumptions. Do not invent credentials, external services, or business rules.\n3. Define module boundaries, data ownership, primary interfaces, and request/data flow.\n4. Include authentication, authorization, validation, secrets, logging, and error handling only as required by the risk profile.\n5. Keep MVP scope separate from later enhancements.\n6. Avoid overengineering, unnecessary abstractions, and boilerplate code dumps.\n\nRequired output:\n1. Architecture & stack: concise rationale and core design pattern.\n2. Project structure: compact directory tree with module responsibilities.\n3. Setup & scaffolding: ordered steps for initialization, environment variables, configuration, and entry points.\n4. Implementation phases: models/schemas → services → APIs → UI/state → integrations.\n5. Contracts/snippets: minimal interfaces or schemas that align implementation.\n6. Critical considerations: security, data integrity, edge cases, and performance.\n7. Validation: smoke tests, build checks, and commands.\n8. Blockers: only essential missing requirements, services, or credentials.\n\nDo not build the full application. Give a blueprint another coding model can implement sequentially."
  },
  {
    "id": "requirements-prd",
    "title": "Turn a Raw Idea into a Clear PRD",
    "category": "Planning & Architecture",
    "kind": "Requirements design",
    "description": "Convert an idea into a practical product requirements document with scope and acceptance criteria.",
    "tags": [
      "PRD",
      "Product thinking",
      "Acceptance criteria"
    ],
    "prompt": "Act as a product manager and systems analyst. Convert this raw idea into a focused product requirements document.\n\nIdea: [IDEA]\nAudience: [USERS]\nKnown constraints: [BUDGET / PLATFORM / DEADLINE / NONE]\n\nProduce:\n1. Problem statement and intended user outcome.\n2. Target users and primary use cases.\n3. MVP scope: must-have features only.\n4. Out of scope: explicitly excluded work.\n5. User journeys and key states.\n6. Functional requirements with unique IDs (FR-01, FR-02…).\n7. Non-functional requirements: security, accessibility, performance, reliability, privacy, and maintainability where relevant.\n8. Acceptance criteria in Given / When / Then form.\n9. Data entities and external integrations, if applicable.\n10. Risks, assumptions, dependencies, and open questions.\n\nRules: Do not invent business policies. Label assumptions. Separate facts from recommendations. Resolve low-risk gaps with stated assumptions; ask only about decisions that materially change scope. Keep the MVP achievable and avoid feature creep."
  },
  {
    "id": "clarify-requirements",
    "title": "Requirement Clarifier: Ask Only What Matters",
    "category": "Planning & Architecture",
    "kind": "Discovery prompt",
    "description": "Find critical missing details without turning the task into a long questionnaire.",
    "tags": [
      "Ambiguity",
      "Discovery",
      "Scope control"
    ],
    "prompt": "Act as a requirements analyst. Review the request below and decide whether it is sufficiently clear to execute.\n\nRequest: [PASTE REQUEST]\nKnown context: [CONTEXT]\n\nDo this:\n1. Restate the expected outcome in one sentence.\n2. Identify missing details that could materially change the implementation or result.\n3. Ignore cosmetic or low-risk unknowns that can be handled with reasonable assumptions.\n4. Ask no more than 3 targeted questions, ordered by importance. Ask fewer when possible.\n5. For each question, state briefly why the answer changes the solution.\n6. If no critical question exists, proceed using a short assumptions list and define the next step.\n\nDo not ask for information already supplied. Do not assume facts that are not supported. Avoid broad questions such as \"Any other preferences?\"."
  },
  {
    "id": "feature-to-tickets",
    "title": "Break a Feature into Developer Tickets",
    "category": "Planning & Architecture",
    "kind": "Delivery planning",
    "description": "Turn a feature request into small, dependency-aware tickets that are easy to assign and verify.",
    "tags": [
      "Tickets",
      "Sprint planning",
      "Dependencies"
    ],
    "prompt": "Act as a technical product owner. Break this feature into implementation tickets suitable for a small engineering team.\n\nFeature: [FEATURE]\nProject context: [STACK / EXISTING MODULES]\nTeam constraints: [TEAM / RELEASE / NONE]\n\nFor each ticket provide:\n- ID and concise title\n- User or system outcome\n- Scope and explicit exclusions\n- Relevant modules/files if known (never invent paths)\n- Dependencies and prerequisite tickets\n- Acceptance criteria in Given / When / Then form\n- Test expectations\n- Risk level and estimate category (S / M / L), not false precision\n\nRules: Order tickets by dependency. Make each ticket independently reviewable where possible. Separate backend, UI, data, and integration work only when that improves delivery. Include security, migration, observability, and documentation tasks when relevant. End with the critical path and unresolved blockers."
  },
  {
    "id": "architecture-adr",
    "title": "Architecture Decision Record (ADR)",
    "category": "Planning & Architecture",
    "kind": "Decision record",
    "description": "Document a technical decision, alternatives, trade-offs, and consequences without overexplaining.",
    "tags": [
      "ADR",
      "Trade-offs",
      "Maintainability"
    ],
    "prompt": "Act as a staff-level software architect. Write an Architecture Decision Record for the decision below.\n\nDecision to make: [DECISION]\nSystem context: [ARCHITECTURE / CONSTRAINTS]\nRequirements: [REQUIREMENTS]\nOptions already considered: [OPTIONS OR NONE]\n\nUse this format:\n- Title and status (Proposed / Accepted / Superseded)\n- Context: problem and forces driving the decision\n- Decision: one clear recommendation\n- Reasons: requirements the decision satisfies\n- Alternatives: only credible alternatives, with concise pros/cons\n- Consequences: positive, negative, and operational effects\n- Security, data, performance, and migration implications\n- Revisit triggers: evidence that would justify changing the decision\n\nDo not invent benchmark results or claim certainty without evidence. Prefer the simplest option that satisfies current requirements and preserves a reasonable path to change."
  },
  {
    "id": "api-contract",
    "title": "Design a Consistent API Contract",
    "category": "Planning & Architecture",
    "kind": "API design",
    "description": "Specify endpoints, schemas, validation, errors, auth, and compatibility before implementation.",
    "tags": [
      "REST",
      "Schemas",
      "OpenAPI-ready"
    ],
    "prompt": "Act as an API architect. Design an API contract for: [FEATURE / RESOURCE].\n\nContext: [CURRENT STACK / AUTH / CLIENTS]\nExisting conventions: [KNOWN API PATTERNS OR UNKNOWN]\n\nDefine:\n1. Resources and endpoint paths with HTTP methods.\n2. Request path, query, header, and body fields with types, required status, constraints, and examples.\n3. Response schemas and status codes.\n4. Consistent error format with machine-readable codes and safe messages.\n5. Authentication and authorization requirements per operation.\n6. Validation, pagination, filtering, sorting, idempotency, and rate limits where relevant.\n7. Data ownership and side effects.\n8. Versioning and backward-compatibility rules.\n9. Positive, invalid, unauthorized, not-found, conflict, and server-failure examples.\n\nReuse existing project conventions when provided. Do not invent current endpoints. Clearly mark proposed contracts. Finish with a compact implementation checklist and contract tests."
  },
  {
    "id": "database-design",
    "title": "Database Schema & Data Integrity Designer",
    "category": "Planning & Architecture",
    "kind": "Data modeling",
    "description": "Create a normalized, practical schema with constraints, indexes, and data lifecycle rules.",
    "tags": [
      "Database",
      "Schema",
      "Integrity"
    ],
    "prompt": "Act as a database architect. Design the smallest robust data model for: [FEATURE / DOMAIN].\n\nContext: [DATABASE / EXPECTED SCALE / EXISTING TABLES]\nAccess patterns: [MAIN QUERIES / WRITES]\n\nDeliver:\n1. Entities and relationships, including cardinality.\n2. Tables/collections and fields with types, nullability, defaults, and descriptions.\n3. Primary keys, foreign keys, unique constraints, checks, and deletion/update behavior.\n4. Indexes justified by expected query patterns.\n5. Transaction boundaries and consistency requirements.\n6. Audit/history, retention, privacy, and soft-delete needs where applicable.\n7. Migration and rollback considerations.\n8. Example records and representative queries.\n\nRules: Preserve existing schema conventions. Avoid speculative fields and premature optimization. Never store secrets in plain text. Identify assumptions and data-loss risks. Include validation cases for duplicate, missing, invalid, and concurrent writes."
  },
  {
    "id": "migration-plan",
    "title": "Safe Database Migration Planner",
    "category": "Planning & Architecture",
    "kind": "Migration safety",
    "description": "Plan schema and data changes with compatibility, rollout, backups, and rollback safeguards.",
    "tags": [
      "Migrations",
      "Zero downtime",
      "Rollback"
    ],
    "prompt": "Act as a database reliability engineer. Plan a safe migration from the current state to the requested schema/data state.\n\nCurrent schema and data: [DETAILS / FILES]\nTarget change: [CHANGE]\nDatabase and deployment model: [DATABASE / ENVIRONMENT]\n\nCreate an ordered plan covering:\n1. Current-state inspection and data-quality checks.\n2. Backup and restore verification requirements.\n3. Schema changes and constraints.\n4. Data backfill or transformation, including batching and idempotency.\n5. Application compatibility during mixed-version rollout.\n6. Locking, downtime, load, and transaction risks.\n7. Validation queries and expected invariants.\n8. Rollout checkpoints, monitoring, and abort conditions.\n9. Rollback or forward-fix strategy, including limits where reversal is unsafe.\n\nDo not execute the migration. Do not assume backups are valid. Flag irreversible operations and request confirmation before destructive steps. Prefer expand → migrate → contract for systems needing rolling deployment."
  },
  {
    "id": "frontend-ui-plan",
    "title": "Frontend UI/UX Implementation Planner",
    "category": "Planning & Architecture",
    "kind": "Frontend design",
    "description": "Translate a screen request into component structure, states, interactions, and responsive behavior.",
    "tags": [
      "UI architecture",
      "Accessibility",
      "Responsive"
    ],
    "prompt": "Act as a senior frontend engineer and UX architect. Plan the implementation of this screen or flow: [SCREEN / FEATURE].\n\nExisting app: [FRAMEWORK / DESIGN SYSTEM / ROUTING]\nUsers and goal: [USERS / USER OUTCOME]\nReferences: [WIREFRAME / SCREENSHOTS / LINKS]\n\nSpecify:\n1. Page hierarchy and primary user journey.\n2. Components to reuse and components to create.\n3. State model: loading, success, empty, error, disabled, and permission states as relevant.\n4. Data inputs, API contracts, validation, and state ownership.\n5. Responsive behavior for mobile, tablet, and desktop.\n6. Accessibility: semantic structure, keyboard use, focus, labels, contrast, and reduced motion.\n7. Interaction details and edge cases.\n8. Relevant files/modules to modify, if known.\n9. Component and interaction tests.\n\nKeep the existing design language. Do not add a new UI library unless necessary. Do not invent brand assets or backend behavior. Prefer simple, consistent, accessible interfaces."
  },
  {
    "id": "backend-service-plan",
    "title": "Backend Service Implementation Planner",
    "category": "Planning & Architecture",
    "kind": "Backend design",
    "description": "Plan service layers, validation, persistence, API wiring, and failure handling for a backend feature.",
    "tags": [
      "Backend",
      "Services",
      "Error handling"
    ],
    "prompt": "Act as a senior backend engineer. Create an implementation plan for: [BACKEND FEATURE].\n\nStack and conventions: [STACK / RELEVANT FILES]\nRequirements: [FUNCTIONAL REQUIREMENTS]\n\nPlan in this order:\n1. Input contract and validation rules.\n2. Authorization and ownership checks.\n3. Service/business logic and invariants.\n4. Persistence operations and transaction boundaries.\n5. API/route/controller integration.\n6. Error mapping, retries, timeouts, and idempotency where relevant.\n7. Logging and metrics without sensitive data.\n8. Tests for normal, invalid, unauthorized, missing, duplicate, and failure cases.\n\nName existing modules only when verified. Reuse the project structure and patterns. Keep controller, business logic, and data access responsibilities consistent with the codebase. Do not implement or refactor unrelated areas."
  },
  {
    "id": "integration-plan",
    "title": "Third-Party Integration Planner",
    "category": "Planning & Architecture",
    "kind": "Integration design",
    "description": "Plan a reliable integration with an external API, including authentication and failure behavior.",
    "tags": [
      "External APIs",
      "Retries",
      "Webhooks"
    ],
    "prompt": "Act as an integration architect. Plan how to integrate [EXTERNAL SERVICE] into [PROJECT].\n\nAvailable documentation: [DOCS / URL / FILES]\nRequired use cases: [USE CASES]\nCurrent stack: [STACK]\nCredentials available: [YES / NO / UNKNOWN — never paste secrets]\n\nCover:\n1. Verify the official API capabilities, limits, authentication method, and version.\n2. Map use cases to required endpoints/events and data fields.\n3. Define request/response contracts and internal data mapping.\n4. Store credentials securely and define rotation practices.\n5. Set timeouts, bounded retries with backoff, rate-limit handling, and idempotency.\n6. Define webhook signature verification, replay protection, and deduplication if applicable.\n7. Handle partial outages and provider schema changes.\n8. Add structured logs and metrics without leaking personal or secret data.\n9. Define sandbox tests and failure simulations.\n10. Document operational dependencies and rollback/disable strategy.\n\nDo not guess undocumented API behavior. Mark unverified details and cite the relevant documentation sections. Do not expose or request secrets in chat."
  },
  {
    "id": "codebase-audit",
    "title": "Deep Codebase Audit: Evidence-Backed Findings",
    "category": "Code Quality",
    "kind": "Code audit",
    "featured": true,
    "description": "Trace critical paths and identify real bugs, logic flaws, race conditions, and maintainability risks.",
    "tags": [
      "Root cause",
      "File references",
      "Severity ranking"
    ],
    "prompt": "Act as a senior code auditor. Analyze the relevant codebase and trace critical execution paths.\n\nFind evidence-backed bugs, logic flaws, security weaknesses, race conditions, edge cases, and failure points. Inspect architecture, dependencies, data flow, error handling, and hidden assumptions only as far as relevant to a finding.\n\nMethod:\n1. Map key entry points and data flows.\n2. Trace high-risk paths across files and identify the root cause of each defect.\n3. Reproduce issues or validate them with tests where practical.\n4. Separate confirmed defects from potential risks and style opinions.\n5. Prioritize by severity and explain real-world impact.\n6. Give exact file and line references where available.\n7. Recommend a specific, minimal fix and a test that would prevent recurrence.\n\nOutput findings in this format:\nSeverity | Confidence | File:Line | Issue | Impact | Root Cause | Reproduction / Evidence | Fix | Regression Test\n\nList Critical → High → Medium → Low. End with the most important systemic gaps. Do not invent findings, line numbers, or test results. Do not modify code unless explicitly asked."
  },
  {
    "id": "debug-root-cause",
    "title": "Debugging: Find the Root Cause, Not a Guess",
    "category": "Code Quality",
    "kind": "Debugging",
    "description": "Diagnose a reproducible issue systematically and avoid speculative patches.",
    "tags": [
      "Bug fixing",
      "Reproduction",
      "Root cause"
    ],
    "prompt": "Act as a methodical senior debugging engineer.\n\nIssue: [EXPECTED VS ACTUAL BEHAVIOR]\nReproduction steps: [STEPS]\nError/logs: [OUTPUT]\nEnvironment: [VERSION / OS / BROWSER / DEPLOYMENT]\nRelevant code: [FILES / SNIPPETS]\n\nProcess:\n1. Restate the failure and identify what evidence is available.\n2. Reproduce it or state exactly what prevents reproduction.\n3. Trace the execution path from input to failure.\n4. List plausible causes, then test them against evidence. Do not present guesses as facts.\n5. Identify the smallest root cause that explains the observed behavior.\n6. Propose the minimal fix and explain why it addresses the cause.\n7. Check side effects and regression risks.\n8. Add a focused regression test.\n9. Run relevant tests and report exact results.\n\nDo not randomly change multiple files, suppress errors, weaken validation, or add retries to hide a logic defect. If evidence is insufficient, request the single most useful missing artifact."
  },
  {
    "id": "code-review",
    "title": "Senior Engineer: Pull Request Review",
    "category": "Code Quality",
    "kind": "PR review",
    "description": "Review a diff for correctness, security, compatibility, and maintainability—not personal style.",
    "tags": [
      "Pull request",
      "Diff review",
      "Actionable"
    ],
    "prompt": "Act as a senior engineer reviewing this change for merge readiness.\n\nChange purpose: [PR DESCRIPTION]\nDiff/files: [ATTACH OR PASTE]\nRelevant requirements: [ACCEPTANCE CRITERIA]\n\nReview priorities:\n1. Functional correctness and requirement coverage.\n2. Regressions and backward compatibility.\n3. Security, privacy, authorization, and data integrity.\n4. Error handling, edge cases, and concurrency.\n5. Performance and resource usage.\n6. Tests: coverage of new behavior and failure paths.\n7. Maintainability only where it creates a practical future risk.\n\nFor each finding provide severity, exact file/line, concrete scenario, impact, and a suggested fix. Report only actionable findings. Do not flag personal preferences, speculative concerns, or formatting unless they break project conventions or tooling.\n\nEnd with: Approve / Approve with follow-ups / Request changes, plus a concise reason. State what you could not verify."
  },
  {
    "id": "regression-impact",
    "title": "Regression & Blast-Radius Analysis",
    "category": "Code Quality",
    "kind": "Change impact",
    "description": "Map what could break when a function, module, schema, or API changes.",
    "tags": [
      "Impact analysis",
      "Call graph",
      "Compatibility"
    ],
    "prompt": "Act as a software change-impact analyst. Evaluate the proposed modification before implementation.\n\nProposed change: [CHANGE]\nTarget files/functions: [KNOWN LOCATIONS]\nProject context: [REPOSITORY / ARCHITECTURE]\n\nAnalyze:\n1. Direct callers, dependencies, imports, events, jobs, and external consumers.\n2. Data contracts, persistence formats, API responses, and configuration affected.\n3. User journeys and workflows that rely on the current behavior.\n4. Permission, caching, concurrency, and transaction implications.\n5. Compatibility with older clients, stored data, and rolling deployments.\n6. Tests that must change or be added.\n7. Rollout, monitoring, and rollback concerns where applicable.\n\nOutput: Change summary | Affected components | Potential regressions by severity | Evidence | Required tests | Safe rollout notes. Distinguish confirmed dependencies from inferred ones. Do not edit code."
  },
  {
    "id": "refactor-plan",
    "title": "Safe Refactoring Plan",
    "category": "Code Quality",
    "kind": "Refactoring",
    "description": "Improve a specific code area while preserving behavior and keeping the diff controlled.",
    "tags": [
      "Refactoring",
      "Behavior preservation",
      "Small steps"
    ],
    "prompt": "Act as a senior engineer planning a behavior-preserving refactor.\n\nTarget area: [MODULE / CODE]\nReason: [MAINTAINABILITY / DUPLICATION / COMPLEXITY]\nConstraints: [API COMPATIBILITY / RELEASE WINDOW]\n\nRules:\n1. Establish current behavior with existing tests and, where needed, characterization tests.\n2. Identify the smallest refactor that addresses the stated problem.\n3. Preserve public interfaces, side effects, ordering, error behavior, and data formats.\n4. Split work into small, independently testable steps.\n5. Avoid unrelated cleanup, broad renaming, new dependencies, or speculative abstractions.\n6. State any behavior change separately and obtain explicit authorization before including it.\n7. Run the same tests before and after each meaningful step.\n\nOutput: Current behavior | Refactor boundary | Ordered steps | Risks | Tests | Rollback approach. Do not implement unless requested."
  },
  {
    "id": "code-explain",
    "title": "Explain an Unfamiliar Codebase or Module",
    "category": "Code Quality",
    "kind": "Code comprehension",
    "description": "Explain how code works using actual call paths, data flow, and file references.",
    "tags": [
      "Onboarding",
      "Code walkthrough",
      "Architecture"
    ],
    "prompt": "Act as a technical investigator helping me understand this codebase/module.\n\nScope: [REPOSITORY / DIRECTORY / FEATURE]\nQuestions: [WHAT I NEED TO UNDERSTAND]\n\nInspect the actual source before explaining. Then provide:\n1. Purpose and responsibility of the module.\n2. Entry points and important call paths in execution order.\n3. Inputs, outputs, state changes, and external dependencies.\n4. Important data structures and business rules.\n5. Error handling and failure behavior.\n6. Related files and how they connect.\n7. Tests that demonstrate the behavior.\n8. Unknowns or behavior not confirmed by the available code.\n\nUse exact file/function references where possible. Explain in plain language. Do not infer behavior from filenames alone or describe code that you have not inspected."
  },
  {
    "id": "test-strategy",
    "title": "Risk-Based Test Strategy",
    "category": "Testing & QA",
    "kind": "Test planning",
    "featured": true,
    "description": "Build a focused test strategy from business risk, critical paths, and failure modes.",
    "tags": [
      "Test pyramid",
      "Risk-based",
      "Coverage"
    ],
    "prompt": "Act as a QA architect. Create a risk-based test strategy for: [FEATURE / SYSTEM].\n\nContext: [STACK / ARCHITECTURE / REQUIREMENTS]\nCritical user journeys: [JOURNEYS]\nKnown failures or risks: [RISKS]\n\nDefine:\n1. Test objectives and highest-risk behaviors.\n2. Unit, integration, contract, end-to-end, security, and performance coverage as appropriate.\n3. Test scenarios for happy paths, invalid data, boundaries, permissions, timeouts, retries, duplicate requests, concurrency, and partial failures.\n4. Test data, fixtures, mocks, and environment needs.\n5. Automation priorities and tests that should remain manual.\n6. Entry/exit criteria and release-blocking failures.\n7. Regression suite and CI placement.\n\nOutput a prioritized matrix: Risk | Scenario | Test level | Expected result | Automation priority. Keep tests deterministic and avoid over-testing low-risk implementation details."
  },
  {
    "id": "test-generation",
    "title": "Generate Tests from Requirements and Code",
    "category": "Testing & QA",
    "kind": "Test authoring",
    "description": "Create meaningful tests that verify observable behavior, including failure and boundary cases.",
    "tags": [
      "Unit tests",
      "Integration tests",
      "Fixtures"
    ],
    "prompt": "Act as an experienced test engineer. Add or propose tests for the following behavior.\n\nRequirements: [ACCEPTANCE CRITERIA]\nRelevant code: [FILES / SNIPPETS]\nExisting test framework and conventions: [PROJECT CONTEXT]\n\nInstructions:\n1. Inspect existing tests and follow the project's framework, naming, fixtures, and setup patterns.\n2. Test externally observable behavior, not private implementation details unless necessary.\n3. Cover normal cases, boundaries, invalid input, empty/null values, permissions, and expected failures.\n4. Include regression tests for each confirmed bug.\n5. Keep tests isolated, deterministic, and independent of live external services unless this is an explicit integration test.\n6. Avoid brittle timing, random data, and excessive mocking.\n7. Do not change production behavior merely to make a test pass.\n\nProvide test names, purpose, key inputs, expected outcomes, and code only in the project's established style. Run the tests if tools are available and report actual results."
  },
  {
    "id": "acceptance-criteria",
    "title": "Acceptance Criteria & Edge-Case Matrix",
    "category": "Testing & QA",
    "kind": "QA specification",
    "description": "Turn feature requirements into verifiable outcomes and a structured edge-case checklist.",
    "tags": [
      "Gherkin",
      "Edge cases",
      "Definition of done"
    ],
    "prompt": "Act as a QA analyst. Convert this requirement into testable acceptance criteria and an edge-case matrix.\n\nRequirement: [FEATURE / CHANGE]\nUser roles: [ROLES]\nBusiness rules: [RULES]\nSystem constraints: [CONSTRAINTS]\n\nProduce:\n1. A concise definition of done.\n2. Given / When / Then criteria for each distinct behavior.\n3. A matrix covering valid, invalid, missing, boundary, duplicate, unauthorized, concurrent, timeout, and recovery cases where relevant.\n4. Expected UI, API, and data outcomes.\n5. Negative cases and prohibited behavior.\n6. Dependencies and assumptions.\n\nEvery criterion must be observable and objectively pass/fail. Avoid vague words such as \"works correctly\". Do not add requirements unsupported by the input; label recommendations separately."
  },
  {
    "id": "security-audit",
    "title": "Application Security Review",
    "category": "Security & Performance",
    "kind": "Security audit",
    "featured": true,
    "description": "Review trust boundaries, auth, input handling, secrets, data exposure, and common attack paths.",
    "tags": [
      "OWASP",
      "Threat modeling",
      "AppSec"
    ],
    "prompt": "Act as an application security engineer. Review the application or change for realistic security vulnerabilities.\n\nScope: [APP / FEATURE / FILES]\nStack and deployment: [CONTEXT]\nThreat assumptions: [KNOWN USERS / TRUST BOUNDARIES]\n\nInspect as relevant:\n- Authentication, session management, authorization, and object-level access.\n- Input validation, output encoding, injection, path traversal, and unsafe deserialization.\n- CSRF, CORS, SSRF, XSS, and request forgery.\n- Secrets, tokens, encryption, key handling, and sensitive logging.\n- File uploads, downloads, and content handling.\n- Rate limiting, abuse controls, and denial-of-service exposure.\n- Dependency vulnerabilities and insecure configuration.\n- Data access boundaries, tenant isolation, and privacy.\n\nFor each finding provide: severity, confidence, affected file/line, attack preconditions, practical impact, evidence, remediation, and regression test. Distinguish confirmed vulnerabilities from hardening recommendations. Do not attempt destructive exploitation or access real user data. Never reproduce secret values in the report."
  },
  {
    "id": "performance-audit",
    "title": "Performance & Scalability Audit",
    "category": "Security & Performance",
    "kind": "Performance review",
    "description": "Find measurable bottlenecks in rendering, APIs, queries, memory, and concurrency.",
    "tags": [
      "Profiling",
      "Latency",
      "Scalability"
    ],
    "prompt": "Act as a performance engineer. Evaluate this system for measurable bottlenecks and scalability risks.\n\nSystem and workload: [STACK / EXPECTED TRAFFIC]\nPerformance goal: [LATENCY / THROUGHPUT / RESOURCE TARGET]\nEvidence: [PROFILES / METRICS / CODE / NONE]\n\nReview:\n1. Establish workload assumptions and the user-visible performance objective.\n2. Inspect hot paths, algorithmic complexity, repeated work, and blocking operations.\n3. Review database queries, indexes, N+1 patterns, connection pools, and transaction duration.\n4. Review network calls, payload size, caching, pagination, and timeout behavior.\n5. Review frontend bundle size, render cycles, assets, and perceived loading states where applicable.\n6. Inspect memory growth, resource leaks, concurrency limits, and queue behavior.\n7. Rank findings by measured impact and implementation risk.\n\nOutput: Finding | Evidence/measurement | User impact | Root cause | Recommended fix | How to benchmark. Do not invent performance numbers. Separate measured bottlenecks from hypotheses and recommend profiling before speculative optimization."
  },
  {
    "id": "dependency-audit",
    "title": "Dependency & Supply-Chain Risk Audit",
    "category": "Security & Performance",
    "kind": "Dependency review",
    "description": "Assess packages, versions, licenses, maintenance, vulnerabilities, and unnecessary dependency weight.",
    "tags": [
      "Packages",
      "CVE",
      "Supply chain"
    ],
    "prompt": "Act as a software supply-chain security reviewer. Assess the project's dependencies.\n\nProject manifests/lockfiles: [FILES]\nRuntime and deployment: [ENVIRONMENT]\n\nCheck:\n1. Direct and transitive dependency inventory.\n2. Known vulnerabilities using current trusted advisories when available.\n3. Unsupported, abandoned, or suspicious packages.\n4. Version pinning, lockfile consistency, and reproducible installs.\n5. License compatibility with the project context.\n6. Install scripts, native binaries, and elevated permissions.\n7. Duplicate packages, unnecessary weight, and unused dependencies.\n8. Upgrade or removal risks and compatibility requirements.\n\nOutput: Package | Version | Evidence | Risk | Recommended action | Validation. Do not claim a package is vulnerable without an advisory or reproducible evidence. Do not update dependencies automatically. Prioritize security and compatibility over version freshness."
  },
  {
    "id": "data-validation",
    "title": "Data Validation & Integrity Review",
    "category": "Security & Performance",
    "kind": "Data quality",
    "description": "Check how data is accepted, transformed, stored, and protected from corruption.",
    "tags": [
      "Validation",
      "Consistency",
      "Privacy"
    ],
    "prompt": "Act as a data integrity engineer. Review the data lifecycle for [FEATURE / DATASET].\n\nInputs and sources: [INPUTS]\nStorage and transformations: [SCHEMA / PIPELINE]\nBusiness invariants: [RULES]\n\nTrace each field from source through validation, normalization, processing, storage, and output. Identify:\n1. Missing, invalid, malformed, duplicated, or out-of-range data.\n2. Type, timezone, locale, encoding, precision, and rounding issues.\n3. Referential integrity and cross-field business invariants.\n4. Race conditions, partial writes, retries, and duplicate processing.\n5. Unsafe defaults, silent truncation, and lossy conversions.\n6. Access controls, retention, and sensitive-data exposure.\n\nProvide evidence-backed findings, impact, exact remediation, and tests. Do not silently clean or rewrite production data. Flag irreversible transformations and require a backup/rollback plan."
  },
  {
    "id": "deployment-readiness",
    "title": "Deployment & Release Readiness Checklist",
    "category": "DevOps & Reliability",
    "kind": "Release gate",
    "featured": true,
    "description": "Verify build, configuration, migrations, observability, rollback, and operational readiness.",
    "tags": [
      "Release",
      "Deployment",
      "Rollback"
    ],
    "prompt": "Act as a release engineer. Assess whether [APPLICATION / CHANGE] is ready to deploy to [ENVIRONMENT].\n\nInspect available project configuration and produce a practical go/no-go checklist.\n\nVerify:\n1. Reproducible build and artifact integrity.\n2. Environment-specific configuration and secret injection.\n3. Database migrations, backup status, and compatibility.\n4. Authentication, authorization, network, and security configuration.\n5. Health checks, readiness/liveness probes, and startup/shutdown behavior.\n6. Logs, metrics, traces, alerts, and dashboards.\n7. Feature flags, rollout strategy, and blast-radius controls.\n8. Rollback or forward-fix procedure and recovery time assumptions.\n9. Smoke tests and critical user journeys after deployment.\n10. Ownership, runbooks, support readiness, and external dependencies.\n\nOutput: Go / No-go / Conditional | Blocking items | Pre-deploy checklist | Deploy steps | Post-deploy checks | Rollback trigger and action. Never claim an environment is ready based only on source code. Do not deploy or alter infrastructure unless explicitly authorized."
  },
  {
    "id": "cicd-pipeline",
    "title": "CI/CD Pipeline Design & Hardening",
    "category": "DevOps & Reliability",
    "kind": "Automation design",
    "description": "Design a practical build, test, security, and deployment pipeline with safe promotion gates.",
    "tags": [
      "CI/CD",
      "Quality gates",
      "Automation"
    ],
    "prompt": "Act as a DevOps engineer. Design or improve a CI/CD pipeline for [PROJECT / STACK].\n\nCurrent pipeline: [FILES / PROVIDER / NONE]\nEnvironments: [DEV / STAGING / PROD]\nRelease constraints: [CONSTRAINTS]\n\nSpecify stages in order:\n1. Checkout and deterministic dependency installation.\n2. Formatting/lint, static analysis, and type checks.\n3. Unit, integration, and contract tests.\n4. Security and dependency scans.\n5. Build and artifact/version creation.\n6. Deployment to a safe test environment and smoke tests.\n7. Approval or policy gate for production.\n8. Progressive rollout, health checks, and rollback handling.\n\nAddress secret handling, least privilege, cache integrity, artifact provenance, concurrency, cancellation, and environment isolation. Reuse the existing CI provider. Provide a minimal pipeline structure and validation steps. Do not expose secrets or deploy automatically."
  },
  {
    "id": "incident-rca",
    "title": "Production Incident: Root Cause Analysis",
    "category": "DevOps & Reliability",
    "kind": "Incident response",
    "description": "Create a blameless incident timeline, impact assessment, root cause, and corrective actions.",
    "tags": [
      "Incident",
      "RCA",
      "Postmortem"
    ],
    "prompt": "Act as a site reliability engineer leading a blameless incident review.\n\nIncident summary: [WHAT HAPPENED]\nTimeline/logs/metrics: [EVIDENCE]\nAffected services and users: [IMPACT]\nMitigation performed: [ACTIONS]\n\nProduce:\n1. Confirmed facts and unknowns.\n2. Timeline with timestamps and source evidence.\n3. User/business impact, duration, and scope. Do not invent metrics.\n4. Triggering event and underlying contributing conditions.\n5. Root cause, clearly separated from symptoms.\n6. Detection and response assessment.\n7. What went well and what made recovery harder.\n8. Corrective actions categorized as prevention, detection, mitigation, and recovery.\n9. Action owner role, priority, and measurable completion criterion.\n10. Follow-up tests, alerts, and runbook changes.\n\nAvoid blame and unsupported conclusions. Label hypotheses and the evidence needed to confirm them. Prioritize systemic improvements over individual fault."
  },
  {
    "id": "observability",
    "title": "Logging, Metrics & Alerting Design",
    "category": "DevOps & Reliability",
    "kind": "Observability",
    "description": "Define useful signals and alerts that help operators detect and diagnose real failures.",
    "tags": [
      "Logs",
      "Metrics",
      "SLO"
    ],
    "prompt": "Act as an SRE. Design an observability plan for [SERVICE / FEATURE].\n\nArchitecture: [COMPONENTS]\nCritical user journeys: [JOURNEYS]\nKnown operational risks: [RISKS]\n\nDefine:\n1. Key service-level indicators (latency, traffic, errors, saturation) relevant to this system.\n2. Business and workflow metrics that reveal failed outcomes.\n3. Structured log fields and correlation/trace identifiers.\n4. Distributed trace boundaries for cross-service flows.\n5. Alert conditions, thresholds, evaluation windows, and severity.\n6. Dashboards for operators and product stakeholders.\n7. Privacy rules: never log passwords, tokens, or unnecessary personal data.\n8. Runbook action for each high-priority alert.\n\nPrefer actionable alerts tied to user impact. Avoid noisy alerts and high-cardinality metric labels. Mark numeric thresholds as proposed until validated against real baseline data."
  },
  {
    "id": "release-notes",
    "title": "Release Notes from Commits or Tickets",
    "category": "DevOps & Reliability",
    "kind": "Release communication",
    "description": "Convert technical changes into clear user-facing release notes without overstating features.",
    "tags": [
      "Changelog",
      "Communication",
      "Accuracy"
    ],
    "prompt": "Act as a technical release manager. Write accurate release notes from the supplied changes.\n\nVersion/date: [VERSION / DATE]\nCommits, PRs, tickets, or change summary: [INPUT]\nAudience: [END USERS / DEVELOPERS / OPERATORS]\nKnown limitations: [LIMITATIONS]\n\nGroup changes into:\n- Added\n- Improved\n- Fixed\n- Security / operational notes (only when appropriate)\n- Breaking changes or migration actions (if any)\n\nRules:\n1. Describe user or operator impact, not just internal implementation details.\n2. Do not claim a fix or feature unless supported by the input.\n3. Clearly call out required user action, compatibility changes, and known limitations.\n4. Remove duplicate entries and jargon where possible.\n5. Keep the tone factual and concise.\n\nIf commit messages are unclear, mark the item for confirmation instead of inventing its purpose."
  },
  {
    "id": "docs-generator",
    "title": "Technical Documentation Generator",
    "category": "Research & Documentation",
    "kind": "Documentation",
    "description": "Create practical developer docs grounded in actual code, setup steps, and verified behavior.",
    "tags": [
      "README",
      "Runbooks",
      "Onboarding"
    ],
    "prompt": "Act as a technical writer and senior developer. Create documentation for [PROJECT / MODULE / FEATURE].\n\nSource material: [CODE / CONFIG / EXISTING DOCS]\nAudience: [DEVELOPERS / OPERATORS / USERS]\nPurpose: [ONBOARDING / API / SETUP / RUNBOOK]\n\nInstructions:\n1. Inspect the supplied source and verify commands, paths, names, and behavior.\n2. Explain purpose, prerequisites, setup, configuration, and environment variables.\n3. Describe key workflows and interfaces with examples.\n4. Include expected outputs and common failure/troubleshooting steps.\n5. Document security-sensitive configuration without exposing secret values.\n6. Identify maintenance, deployment, and recovery notes where relevant.\n7. Separate verified facts from assumptions or missing information.\n\nUse a scannable structure, accurate code examples, and concise language. Do not invent features, commands, environment variables, or API endpoints. Flag missing facts instead of filling them with guesses."
  },
  {
    "id": "research-brief",
    "title": "Evidence-Based Research Brief",
    "category": "Research & Documentation",
    "kind": "Research",
    "description": "Research a question with source quality, dates, competing evidence, and explicit uncertainty.",
    "tags": [
      "Web research",
      "Citations",
      "Fact checking"
    ],
    "prompt": "Act as a careful research analyst. Answer this question using reliable, relevant, and current evidence.\n\nQuestion: [RESEARCH QUESTION]\nDecision this research supports: [DECISION / CONTEXT]\nGeography or date range: [SCOPE]\n\nMethod:\n1. Break the question into answerable sub-questions.\n2. Prioritize primary sources, official documentation, datasets, peer-reviewed work, and reputable reporting.\n3. Verify publication dates and distinguish when an event occurred from when it was reported.\n4. Cross-check important claims with independent sources where possible.\n5. Note disagreements, limitations, sample size, and uncertainty.\n6. Do not treat search snippets, marketing claims, or unsourced posts as definitive evidence.\n7. Separate established facts, interpretation, and recommendations.\n\nOutput: Executive answer | Key findings | Evidence and citations | Conflicting or missing evidence | Implications | Confidence and limitations. Cite sources close to the claims they support. Never fabricate a source, quotation, statistic, or URL."
  },
  {
    "id": "data-analysis",
    "title": "Structured Data Analysis & Insight Report",
    "category": "Research & Documentation",
    "kind": "Data analysis",
    "description": "Analyze a dataset methodically with data-quality checks, explicit calculations, and defensible conclusions.",
    "tags": [
      "Analytics",
      "Data quality",
      "Insights"
    ],
    "prompt": "Act as a senior data analyst. Analyze the supplied dataset to answer: [BUSINESS QUESTION].\n\nFiles/data: [ATTACH DATA]\nField definitions: [DATA DICTIONARY OR UNKNOWN]\nTime period and population: [SCOPE]\n\nWorkflow:\n1. Inspect shape, columns, types, units, missingness, duplicates, and obvious anomalies.\n2. Confirm metric definitions, denominators, date ranges, and exclusions.\n3. Clean only with documented, reversible rules. Do not silently discard records.\n4. Perform calculations that directly answer the question. Show formulas and assumptions.\n5. Segment results only when the sample size supports it.\n6. Distinguish correlation from causation and observed facts from hypotheses.\n7. Check outliers and sensitivity to key assumptions.\n8. Summarize actionable insights and limitations.\n\nOutput: Data quality | Method | Key metrics/table | Findings | Recommendations | Caveats. Include reproducible code or formulas when requested. Never invent missing values or unsupported causal explanations."
  },
  {
    "id": "workflow-automation",
    "title": "Workflow Automation Designer",
    "category": "Research & Documentation",
    "kind": "Process automation",
    "description": "Turn a manual process into a reliable automation with triggers, state, retries, and human controls.",
    "tags": [
      "Automation",
      "Workflow",
      "Failure recovery"
    ],
    "prompt": "Act as a workflow automation architect. Design a reliable automation for this process: [PROCESS].\n\nCurrent steps: [MANUAL WORKFLOW]\nApps/APIs available: [TOOLS]\nTrigger: [EVENT / SCHEDULE]\nExpected output: [RESULT]\nConstraints: [PERMISSIONS / COST / PRIVACY]\n\nSpecify:\n1. Trigger and preconditions.\n2. Ordered workflow steps and data passed between them.\n3. Validation and branching/decision rules.\n4. Idempotency and duplicate-event protection.\n5. Retry policy, timeouts, rate limits, and dead-letter/manual recovery.\n6. Human approval points for sensitive or irreversible actions.\n7. Credential and permission requirements using least privilege.\n8. Logging, alerting, and audit trail.\n9. Test cases for success, partial failure, duplicate events, and invalid input.\n10. Rollback or disable procedure.\n\nPrefer native capabilities and the fewest reliable integrations. Do not assume a connector or permission exists. Identify required setup and unresolved blockers. Never automate irreversible actions without explicit approval controls."
  },
  {
    "id": "prompt-evaluator",
    "title": "Prompt Quality Evaluator & Red-Team Check",
    "category": "Prompt Engineering",
    "kind": "Prompt QA",
    "description": "Score a prompt for ambiguity, missing constraints, weak-model compatibility, and likely failure modes.",
    "tags": [
      "Prompt audit",
      "Scoring",
      "Red team"
    ],
    "prompt": "Act as a prompt quality reviewer. Evaluate the prompt below for reliable execution by [TARGET MODEL / CAPABILITY LEVEL].\n\nPrompt: [PASTE PROMPT]\nIntended task and success criteria: [CONTEXT]\n\nAssess:\n1. Objective clarity and output definition.\n2. Input completeness and placeholder quality.\n3. Instruction order and dependency logic.\n4. Ambiguity, contradictions, and priority conflicts.\n5. Weak-model compatibility and cognitive load.\n6. Hallucination risks and uncertainty handling.\n7. Edge cases, failure handling, and verification.\n8. Redundant wording and token waste.\n\nReturn:\n- Overall rating (1–10) with a brief justification.\n- Top issues ranked by impact.\n- Specific failure scenarios the prompt may trigger.\n- Revised prompt that fixes the issues while preserving intent.\n- Short change log explaining meaningful improvements.\n\nDo not reward length or decorative structure. Do not claim the prompt guarantees success. Preserve critical instructions even when compressing."
  },
  {
    "id": "prompt-compressor",
    "title": "Prompt Compressor: Maximum Signal per Token",
    "category": "Prompt Engineering",
    "kind": "Token optimization",
    "description": "Reduce prompt length while preserving every instruction needed for correct execution.",
    "tags": [
      "Token saving",
      "Compression",
      "Precision"
    ],
    "prompt": "Act as an expert prompt editor. Compress the prompt below for [TARGET MODEL] without reducing task reliability.\n\nOriginal prompt: [PASTE]\nTask context: [OPTIONAL CONTEXT]\n\nRules:\n1. Preserve the goal, inputs, required steps, constraints, priorities, output schema, and validation rules.\n2. Remove repetition, filler, decorative role language, and explanations the model does not need.\n3. Merge overlapping rules only when the resulting instruction remains unambiguous.\n4. Keep examples only when they prevent a likely error.\n5. Keep placeholders explicit and consistent.\n6. Do not remove a safeguard merely to meet a token target.\n7. Identify any contradiction or missing requirement that cannot be safely compressed.\n\nOutput:\nA. Compressed ready-to-use prompt.\nB. Critical requirements preserved.\nC. Removed redundancy (brief).\nD. Any unresolved ambiguity.\n\nOptimize for minimum effective tokens, maximum execution accuracy. Never claim an exact token count unless you actually measured it."
  },
  {
    "id": "model-handoff",
    "title": "Handoff Prompt: Instructions for a Coding Agent",
    "category": "Prompt Engineering",
    "kind": "Agent handoff",
    "description": "Package context, task boundaries, repo exploration, and completion rules for a coding agent.",
    "tags": [
      "Agent handoff",
      "Context packing",
      "Execution"
    ],
    "prompt": "You are the implementation agent taking over this task. Use only the supplied task and repository context.\n\nGoal: [EXPECTED OUTCOME]\nRelevant context: [FILES / ARCHITECTURE / CONSTRAINTS]\nAcceptance criteria: [CRITERIA]\nOut of scope: [EXCLUSIONS]\n\nExecution protocol:\n1. Inspect repository instructions and the relevant implementation before editing.\n2. Summarize the current behavior and identify the smallest affected area.\n3. Make a short plan and proceed when requirements are clear and risk is acceptable.\n4. Preserve existing conventions and avoid unrelated changes.\n5. Do not fabricate files, APIs, environment variables, or test outcomes.\n6. Add focused tests for changed behavior and likely regressions.\n7. Run relevant checks. If a check cannot run, state why.\n8. Inspect the final diff for accidental edits, secrets, debug code, and generated artifacts.\n9. Stop before destructive or irreversible actions unless explicitly authorized.\n\nCompletion report: What changed | Files touched | Tests and actual results | Assumptions | Remaining risks. Ask only when a missing fact blocks safe implementation."
  },
  {
    "id": "decision-matrix",
    "title": "Compare Options with a Decision Matrix",
    "category": "Research & Documentation",
    "kind": "Decision support",
    "description": "Compare tools, vendors, architectures, or approaches against weighted criteria and evidence.",
    "tags": [
      "Comparison",
      "Trade-offs",
      "Scoring"
    ],
    "prompt": "Act as an objective decision analyst. Compare the options for: [DECISION].\n\nOptions: [LIST]\nUse case and constraints: [CONTEXT]\nDecision criteria: [CRITERIA]\nMust-have requirements: [NON-NEGOTIABLES]\n\nMethod:\n1. Remove any option that fails a must-have requirement and explain why.\n2. Define measurable criteria and weights. Ask or state assumptions if weights are not provided.\n3. Gather comparable evidence using the same time period and measurement basis.\n4. Score each option consistently. Mark unavailable evidence as unknown; do not guess.\n5. Explain material trade-offs, dependencies, switching costs, and risks.\n6. Test whether the recommendation changes under different reasonable weights.\n\nOutput: Criteria and weights | Comparison matrix | Evidence quality | Trade-offs | Recommended option | Conditions that could change the decision. Separate facts from judgment and cite current sources when research is required."
  },
  {
    "id": "sql-review",
    "title": "SQL Query Review & Optimization",
    "category": "Security & Performance",
    "kind": "Database performance",
    "description": "Review SQL correctness, query plans, indexing, safety, and transaction implications.",
    "tags": [
      "SQL",
      "Query plans",
      "Indexes"
    ],
    "prompt": "Act as a database performance engineer. Review this SQL query and its usage.\n\nQuery: [SQL]\nSchema and indexes: [DDL]\nDatabase/version: [ENGINE]\nParameters and expected data volume: [CONTEXT]\nQuery plan/metrics: [EXPLAIN OUTPUT OR NONE]\n\nAssess:\n1. Correctness, join cardinality, NULL behavior, and boundary conditions.\n2. Injection risk and parameterization.\n3. Index usage and likely scan/sort operations.\n4. N+1 access patterns and repeated queries in the caller.\n5. Locking, transaction scope, and concurrency impact.\n6. Pagination and deterministic ordering.\n7. Data modification safety and rollback implications.\n\nProvide findings with evidence. Suggest an optimized query only when semantics are preserved. Explain required indexes and write overhead. Do not invent query-plan results; request EXPLAIN ANALYZE or equivalent when measurement is necessary. Include before/after correctness tests."
  },
  {
    "id": "api-debug",
    "title": "API Failure & Integration Troubleshooter",
    "category": "Code Quality",
    "kind": "API debugging",
    "description": "Diagnose failed API requests by separating client, server, auth, network, and provider causes.",
    "tags": [
      "HTTP",
      "Webhooks",
      "Integration debugging"
    ],
    "prompt": "Act as an API troubleshooting specialist.\n\nEndpoint/provider: [SERVICE / URL WITHOUT SECRETS]\nRequest method and sanitized headers: [DETAILS]\nSanitized request body: [BODY]\nResponse status/body: [RESPONSE]\nExpected behavior: [EXPECTED]\nEnvironment and timestamp: [CONTEXT]\n\nInvestigate in order:\n1. URL, method, content type, and required parameters.\n2. Authentication scope, token expiry, and permission boundaries. Never request or print raw secrets.\n3. Request schema, serialization, encoding, and validation.\n4. Rate limits, quotas, timeout, DNS, TLS, and network errors.\n5. Provider-side errors, version changes, and documented behavior.\n6. Retry safety, idempotency, and duplicate side effects.\n7. Webhook signature, replay, and delivery handling if relevant.\n\nSeparate confirmed cause from hypotheses. Provide the smallest diagnostic test, likely fix, and regression check. Do not invent undocumented provider behavior."
  },
  {
    "id": "migration-code",
    "title": "Framework or Runtime Upgrade Planner",
    "category": "DevOps & Reliability",
    "kind": "Upgrade planning",
    "description": "Plan framework, language, runtime, or major package upgrades with staged compatibility checks.",
    "tags": [
      "Upgrades",
      "Compatibility",
      "Rollback"
    ],
    "prompt": "Act as a platform engineer planning an upgrade from [CURRENT VERSION] to [TARGET VERSION].\n\nProject stack: [STACK]\nDependencies and lockfiles: [FILES]\nDeployment constraints: [CONSTRAINTS]\n\nCreate a safe upgrade plan:\n1. Verify official release notes, support windows, and breaking changes.\n2. Inventory direct/transitive dependencies and compatibility constraints.\n3. Identify deprecated APIs and required code/config changes.\n4. Check runtime, build tooling, plugins, containers, and deployment images.\n5. Separate mechanical updates from behavior changes.\n6. Recommend staged upgrade steps with a passing checkpoint after each.\n7. Define unit/integration/e2e and performance regression checks.\n8. Address data/config migration and rollback limits where applicable.\n9. Define canary/staging validation and production monitoring.\n\nUse current official sources for version-specific claims. Do not update packages or alter code unless explicitly requested. Clearly identify unsupported combinations and blockers."
  },
  {
    "id": "accessibility-audit",
    "title": "Accessibility Audit for a Web Interface",
    "category": "Testing & QA",
    "kind": "Accessibility",
    "description": "Review semantic structure, keyboard navigation, focus, forms, contrast, and assistive technology behavior.",
    "tags": [
      "WCAG",
      "Keyboard",
      "Inclusive design"
    ],
    "prompt": "Act as a web accessibility specialist. Audit this interface against relevant WCAG 2.2 AA principles where applicable.\n\nPage/component: [URL / FILES / SCREENSHOTS]\nFramework: [STACK]\nUser interactions: [FLOWS]\n\nReview:\n1. Semantic landmarks, headings, labels, and accessible names.\n2. Keyboard-only operation and logical focus order.\n3. Visible focus, dialogs, menus, and focus restoration.\n4. Form instructions, validation, and error announcements.\n5. Contrast, text resizing, zoom, and non-color status cues.\n6. Images, icons, media alternatives, and decorative content.\n7. Dynamic updates and screen-reader announcements.\n8. Motion, timing, and responsive layout.\n\nFor each issue provide severity, location, affected users, reproduction steps, WCAG criterion when confidently applicable, fix, and retest method. Distinguish automated findings from manual testing needs. Do not claim conformance based on screenshots alone."
  },
  {
    "id": "privacy-review",
    "title": "Privacy & Sensitive Data Review",
    "category": "Security & Performance",
    "kind": "Privacy review",
    "description": "Map personal data collection, storage, sharing, retention, access, and deletion risks.",
    "tags": [
      "Privacy",
      "PII",
      "Data lifecycle"
    ],
    "prompt": "Act as a privacy engineering reviewer. Assess the data lifecycle for [FEATURE / SYSTEM].\n\nData types: [KNOWN DATA]\nUsers and jurisdictions: [SCOPE]\nVendors/integrations: [SERVICES]\n\nMap:\n1. What personal or sensitive data is collected and why.\n2. Collection points, legal/business purpose, and data minimization opportunities.\n3. Storage locations, access roles, encryption, and key management.\n4. Sharing with processors, logs, analytics, and third parties.\n5. Retention periods, deletion, export, and backup lifecycle.\n6. User consent/notice and rights workflows where applicable.\n7. Cross-border transfers and jurisdiction-specific obligations requiring legal review.\n8. Breach exposure and practical mitigations.\n\nOutput a data-flow summary, risk register, recommended controls, and open questions. Do not make definitive legal conclusions; flag jurisdiction-specific issues for qualified counsel. Never include actual personal data in the report."
  },
  {
    "id": "prompt-test-cases",
    "title": "Generate Adversarial Test Inputs",
    "category": "Testing & QA",
    "kind": "Negative testing",
    "description": "Create boundary, malformed, adversarial, and unusual test inputs for a parser or workflow.",
    "tags": [
      "Fuzz cases",
      "Boundary testing",
      "Validation"
    ],
    "prompt": "Act as a test-design specialist. Generate safe, controlled test cases for [INPUT HANDLER / FEATURE].\n\nInput format and constraints: [SCHEMA / RULES]\nExpected behavior: [SPEC]\nEnvironment: [TEST ONLY]\n\nCreate grouped test inputs for:\n1. Normal valid inputs.\n2. Empty, null, missing, and whitespace-only values.\n3. Minimum, maximum, and just-outside-boundary values.\n4. Wrong types, malformed encoding, unexpected fields, and oversized inputs.\n5. Duplicate, reordered, stale, or conflicting values.\n6. Unicode, locale, timezone, and precision edge cases where relevant.\n7. Safe injection-like strings to verify proper validation/encoding in a non-production test environment.\n8. Repeated, concurrent, and retry scenarios where relevant.\n\nFor every case include input, expected result, and the rule it tests. Do not include payloads intended to compromise live systems. Keep tests deterministic and bounded."
  },
  {
    "id": "user-story",
    "title": "User Story & Journey Mapper",
    "category": "Planning & Architecture",
    "kind": "User experience",
    "description": "Map user goals, steps, alternate paths, failure states, and system responsibilities.",
    "tags": [
      "User stories",
      "Journey map",
      "UX flows"
    ],
    "prompt": "Act as a product designer and systems analyst. Map the user journey for [FEATURE / GOAL].\n\nAudience: [USER TYPES]\nStarting point: [ENTRY]\nDesired outcome: [OUTCOME]\nKnown business rules: [RULES]\n\nProvide:\n1. User goal and context.\n2. Main happy-path steps in order.\n3. Alternate paths and decision points.\n4. Empty, loading, error, unavailable, and permission-denied states.\n5. User story statements and acceptance criteria.\n6. System actions, API/data needs, and notifications at each step.\n7. Accessibility and mobile considerations.\n8. Analytics events that measure completion without collecting unnecessary personal data.\n\nDo not invent business policies. Mark assumptions and blockers. Keep the flow simple and focus on user outcomes rather than screens for their own sake."
  },
  {
    "id": "migration-docs",
    "title": "Create a Safe Runbook",
    "category": "Research & Documentation",
    "kind": "Operations documentation",
    "description": "Write an operator-ready procedure with prechecks, commands, verification, abort conditions, and recovery.",
    "tags": [
      "Runbook",
      "Operations",
      "Recovery"
    ],
    "prompt": "Act as an SRE technical writer. Create an operational runbook for [PROCEDURE / SERVICE].\n\nEnvironment: [ENVIRONMENT]\nKnown commands/tools: [VERIFIED COMMANDS]\nDependencies: [DEPENDENCIES]\nEscalation owner: [TEAM / ROLE]\n\nStructure:\n1. Purpose and when to use this runbook.\n2. Preconditions and required permissions.\n3. Impact and risk warning.\n4. Preflight checks and expected outputs.\n5. Numbered execution steps with verification after each risky step.\n6. Abort conditions and stop points.\n7. Recovery/rollback steps and actions that cannot be reversed.\n8. Post-operation checks and monitoring.\n9. Escalation criteria and information to capture.\n\nUse only verified commands and paths. Mark placeholders clearly. Never include secrets. Do not fabricate recovery guarantees. Make destructive actions explicit and require human approval."
  },
  {
    "id": "meeting-to-actions",
    "title": "Meeting Notes to Decisions & Action Items",
    "category": "Research & Documentation",
    "kind": "Productivity",
    "description": "Turn rough notes or a transcript into decisions, owners, actions, deadlines, and unresolved questions.",
    "tags": [
      "Meeting notes",
      "Action items",
      "Summary"
    ],
    "prompt": "Act as a precise meeting analyst. Convert the supplied notes/transcript into a useful follow-up record.\n\nInput: [PASTE NOTES / TRANSCRIPT]\nMeeting context: [TITLE / DATE / PARTICIPANTS]\n\nExtract:\n1. Purpose and brief summary.\n2. Decisions made, including the evidence or rationale stated.\n3. Action items in a table: Action | Owner (only if named) | Due date (only if stated) | Dependency | Status.\n4. Open questions and unresolved disagreements.\n5. Risks, blockers, and next checkpoints.\n\nRules: Do not invent owners, dates, commitments, or decisions. Distinguish explicit decisions from suggestions. Preserve names and technical terms as supplied. If speaker attribution is uncertain, mark it as unknown."
  },
  {
    "id": "email-rewrite",
    "title": "Professional Email: Clear & Action-Oriented",
    "category": "Research & Documentation",
    "kind": "Communication",
    "description": "Draft a concise email with a clear purpose, appropriate tone, and explicit next action.",
    "tags": [
      "Email",
      "Tone",
      "Clarity"
    ],
    "prompt": "Act as a professional business writer. Draft an email based on the details below.\n\nPurpose: [PURPOSE]\nRecipient: [ROLE / RELATIONSHIP]\nKey points: [DETAILS]\nDesired action: [WHAT RECIPIENT SHOULD DO]\nTone: [FRIENDLY / FORMAL / DIRECT / DIPLOMATIC]\nLength: [SHORT / NORMAL]\n\nRequirements:\n1. Use a clear, specific subject line.\n2. Lead with the purpose; organize details in a logical order.\n3. Make the requested action and deadline explicit when provided.\n4. Keep the tone respectful and natural.\n5. Do not invent facts, attachments, promises, or dates.\n6. Remove filler, excessive apologies, and vague asks.\n\nOutput only the subject and complete email draft. If a critical detail is missing, use a clear placeholder rather than inventing it."
  },
  {
    "id": "decision-summary",
    "title": "Executive Summary for Technical Decisions",
    "category": "Research & Documentation",
    "kind": "Executive communication",
    "description": "Translate complex technical analysis into a short, decision-ready brief for stakeholders.",
    "tags": [
      "Executive summary",
      "Stakeholders",
      "Decision"
    ],
    "prompt": "Act as a technical advisor writing for [AUDIENCE]. Turn the supplied technical material into a decision-ready summary.\n\nMaterial: [PASTE / ATTACH]\nDecision needed: [DECISION]\nConstraints: [COST / TIME / RISK / COMPLIANCE]\n\nUse this structure:\n1. Recommendation: one clear sentence.\n2. Why now: the problem and consequence of inaction.\n3. Options considered: only credible alternatives.\n4. Impact: users, cost, delivery, reliability, security, and operations as relevant.\n5. Key risks and mitigations.\n6. Decision required and next steps.\n\nUse plain language, define unavoidable technical terms, and put the most important information first. Preserve uncertainty and distinguish measured facts from estimates. Do not hide trade-offs or exaggerate benefits."
  }
];

/**
 * Normalizes Classic Presets into PromptShelf item format for unified UI rendering
 */
export function getClassicPresetsAsLibraryItems() {
  return PROMPT_PRESETS.map(p => ({
    id: `classic:${p.id}`,
    classicId: p.id,
    title: p.name,
    category: 'classic',
    kind: 'Classic Preset',
    featured: p.id === 'default',
    description: p.description,
    tags: ['AICodeDrop', 'Built-in'],
    prompt: p.prefix ? `${p.prefix}\n\n${p.suffix}` : '',
    prefix: p.prefix,
    suffix: p.suffix
  }));
}

/**
 * Returns filtered prompts by category, search query, favorites Set, and customPrompts array
 */
export function filterPrompts({
  category = 'all',
  search = '',
  favorites = new Set(),
  customPrompts = []
} = {}) {
  const allItems = [
    ...PROMPT_LIBRARY,
    ...customPrompts,
    ...getClassicPresetsAsLibraryItems()
  ];

  let list = allItems;

  if (category === 'favorites') {
    list = allItems.filter(p => favorites.has(p.id));
  } else if (category === 'custom') {
    list = customPrompts;
  } else if (category === 'classic') {
    list = getClassicPresetsAsLibraryItems();
  } else if (category !== 'all') {
    list = allItems.filter(p => p.category === category);
  } else {
    // 'all' includes core library plus custom prompts
    list = [...PROMPT_LIBRARY, ...customPrompts];
  }

  const q = search.trim().toLowerCase();
  if (q) {
    list = list.filter(p =>
      [p.title, p.description, p.category, p.kind, ...(p.tags || []), p.prompt]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }

  return list;
}

/**
 * Finds any prompt by ID across PROMPT_LIBRARY, customPrompts, and Classic Presets
 */
export function getLibraryPromptById(id, customPrompts = []) {
  if (!id) return PROMPT_LIBRARY[0];
  if (id.startsWith('classic:')) {
    const rawId = id.replace('classic:', '');
    const classic = getPromptPreset(rawId);
    return {
      id: `classic:${classic.id}`,
      title: classic.name,
      category: 'classic',
      kind: 'Classic Preset',
      description: classic.description,
      tags: ['AICodeDrop', 'Built-in'],
      prompt: `${classic.prefix}\n\n${classic.suffix}`.trim(),
      prefix: classic.prefix,
      suffix: classic.suffix
    };
  }
  return (
    PROMPT_LIBRARY.find(p => p.id === id) ||
    customPrompts.find(p => p.id === id) ||
    PROMPT_LIBRARY[0]
  );
}

/**
 * Extracts unique bracketed placeholders (e.g., [PASTE REQUEST], [DESCRIBE CHANGE])
 * Ignores numeric citations or markdown links.
 */
export function extractPromptPlaceholders(promptText = '') {
  if (!promptText) return [];
  const matches = promptText.match(/\[([A-Z][A-Z0-9\s/_.,—–-]{2,60})\]/g) || [];
  return Array.from(new Set(matches.map(m => m.slice(1, -1).trim())));
}

/**
 * Splits a PromptShelf prompt into Prefix (System Instructions before <codebase>)
 * and Suffix (Task & Inputs after <codebase>) for optimal LLM attention.
 */
export function splitPromptIntoPrefixSuffix(promptObj, placeholderValues = {}) {
  if (!promptObj) return { prefix: '', suffix: '' };

  // Apply placeholder replacements first
  const applyReplacements = (text = '') => {
    let out = text;
    for (const [key, val] of Object.entries(placeholderValues)) {
      if (val && val.trim()) {
        out = out.split(`[${key}]`).join(val.trim());
      }
    }
    return out;
  };

  if (typeof promptObj.prefix === 'string' && typeof promptObj.suffix === 'string') {
    return {
      prefix: applyReplacements(promptObj.prefix),
      suffix: applyReplacements(promptObj.suffix)
    };
  }

  const fullText = applyReplacements(promptObj.prompt || '');
  const placeholders = extractPromptPlaceholders(promptObj.prompt || '');

  // Build a clean suffix task block so the model receives the trigger at the end of <codebase>
  const unfilled = placeholders.filter(k => !placeholderValues[k] || !placeholderValues[k].trim());
  const filledLines = Object.entries(placeholderValues)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `- ${k}: ${v.trim()}`);

  let suffix = `Execute the "${promptObj.title}" instructions above on the provided codebase.`;
  if (filledLines.length > 0) {
    suffix += `\n\nTask Inputs:\n${filledLines.join('\n')}`;
  } else if (unfilled.length > 0) {
    suffix += `\n\nTask Inputs:\n${unfilled.map(k => `- ${k}: [${k}]`).join('\n')}`;
  }

  return {
    prefix: fullText,
    suffix
  };
}

/**
 * Intelligently maps repository context (manifests, files, tech stack) into prompt placeholders
 */
export function autoFillPlaceholdersFromRepo(placeholders = [], repoContext = {}) {
  const result = {};
  const { folderName = '', selectedFiles = [], manifestSummary = '' } = repoContext;

  for (const ph of placeholders) {
    const upper = ph.toUpperCase();
    if (upper.includes('REPOSITORY') || upper.includes('PROJECT NAME') || upper.includes('APP NAME')) {
      result[ph] = folderName || 'my-project';
    } else if (upper.includes('STACK') || upper.includes('FRAMEWORK') || upper.includes('ARCHITECTURE')) {
      if (manifestSummary) {
        result[ph] = manifestSummary.split('\n')[0] || 'Web Application';
      }
    } else if (upper.includes('FILES') || upper.includes('COMPONENTS') || upper.includes('TARGET')) {
      if (selectedFiles && selectedFiles.length > 0) {
        result[ph] = selectedFiles.slice(0, 5).join(', ');
      }
    } else if (upper.includes('DEPENDENC')) {
      if (manifestSummary) {
        result[ph] = manifestSummary;
      }
    }
  }

  return result;
}
