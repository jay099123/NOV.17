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
