<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Browser testing preference

- The user only wants desktop browser checks at a **1440 × 1080 CSS-pixel viewport**.
- Apply this viewport to every Playwright page and context, including temporary checks and screenshots.
- Do not run mobile/tablet emulation, other viewport sizes, or a responsive-size matrix unless the user explicitly asks.
- Normal and reduced-motion checks may both run at 1440 × 1080. Older multi-size reports are historical evidence, not the current test scope.


## Development workflow and efficiency

### Scope and implementation

- Implement the requested behavior with the smallest reasonable set of changes.
- Preserve existing behavior, architecture, conventions, and in-progress user changes. Inspect relevant Git status/diffs before editing; never overwrite or revert unrelated work.
- Do not add unrequested features, persistence, dependencies, abstractions, broad refactors, or configuration changes just because they might be useful. If an extra change meaningfully affects behavior or scope, ask first.
- Make small technical and accessibility decisions needed for correctness without asking about every implementation detail.
- Avoid unrelated cleanup. If you notice separate issues, briefly report them instead of silently expanding the task.


### Context and file reading

- Start with the user's request and the context already available in the current session.
- Locate relevant files and symbols first; read only the code and documentation needed to make a correct change.
- Follow the Next.js rule above: consult the relevant installed-version guide before writing code, but do not indiscriminately read the entire documentation tree.
- Avoid repeatedly rereading unchanged files, HANDOFF.md, large logs, build artifacts, or unrelated documentation.
- Use HANDOFF.md for a new-session handoff or when its contents are needed; do not treat it as a required reread before every task.
- Prefer concise command output and targeted searches. Expand investigation only when findings justify it.


### Verification: proportional to risk

- Use the smallest set of checks that provides meaningful confidence in the change. Do not skip necessary correctness or safety checks to save tokens.
- For text, styling, and layout changes: inspect the diff and use a targeted preview or browser check when visual behavior needs confirmation.
- For interactive behavior, shared state, and audio: run relevant type/lint checks where available and test representative affected flows, including important failure cases.
- For structural changes, dependency/configuration changes, release preparation, or suspected integration issues: run broader tests and a full build as appropriate.
- Reuse existing checks and scripts where possible. Avoid creating permanent test frameworks or extensive new tests for minor one-off changes unless justified.
- Avoid redundant checks (for example, rerunning the same successful validation without intervening changes). Do not automatically run every test suite and full build for every small edit.
- When browser tests are needed, comply with the desktop viewport rules above.
- Report what was actually tested and what remains unverified; never imply that a successful isolated test proves another environment works.


### Environment troubleshooting

- First determine whether an error is caused by the current change or by an existing development environment issue.
- Start with focused, low-impact diagnostics. Do not disrupt or terminate the user's existing development processes without need.
- Avoid automatically cloning the whole project, creating parallel dev servers, or performing lengthy environment recovery for an unrelated issue.
- If an environment problem blocks essential verification, investigate as needed; if further work would substantially expand the task, explain the blocker and ask before undertaking a major workaround.
- If a non-blocking environment issue remains, document it briefly and clearly distinguish it from the feature's status.


### Documentation and handoff

- Treat Git history as the record of completed edits; do not duplicate a running changelog in HANDOFF.md.
- Update HANDOFF.md only when the user requests a handoff or when explicitly required by the task. Replace obsolete notes rather than endlessly appending history.
- Keep handoff notes short: current state, key decisions, relevant files, unresolved issues, and next steps.
- Do not update README, create reports, or generate screenshots/test artifacts by default unless the task or maintainability calls for them.
- Do not commit, push, deploy, install dependencies, or make destructive changes unless requested or necessary and clearly authorized.


### Communication

- For routine requests, keep planning and progress messages brief; work directly when the change is straightforward.
- At the end, summarize the behavior changed, relevant files, checks performed, and any unresolved issue or limitation.
- Avoid long narrative reports, repetitive explanations, or dumping full logs unless requested.


## Project Knowledge and Context Management

### Document Responsibilities

- `AGENTS.md`: Persistent development instructions,
  coding conventions, and workflow rules.
- `PROJECT.md`: Long-term project architecture,
  important technical decisions, component
  responsibilities, and design constraints.
- `HANDOFF.md`: Concise session handoff containing
  current progress, unfinished tasks, known issues,
  and immediate next steps.

### Reading Rules

- Do not automatically read PROJECT.md or HANDOFF.md
  before every task.
- Read HANDOFF.md when starting a new session that
  requires previous development context.
- Read PROJECT.md only when the current task requires
  architectural context or historical decisions.
- Read only relevant sections when possible.
- Do not repeatedly read unchanged documentation.
- After /compact, reuse retained context and read
  documentation only if necessary information is missing.

### Updating Rules

- Do not automatically update PROJECT.md or HANDOFF.md
  after every modification.
- Update PROJECT.md when explicitly requested, preserving
  important long-term decisions without duplicating Git
  history or implementation details.
- Update HANDOFF.md when explicitly requested for session
  handoff; replace outdated content rather than appending
  a chronological development log.
- When a significant architectural decision should be
  documented, briefly notify the user.
- Keep both documents concise and avoid duplicating
  information between them.
- Existing source code and Git state take precedence
  over outdated documentation.
