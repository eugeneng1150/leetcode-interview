# Next Steps

This file tracks what is left to build for the local-first free-tier version of LeetCode Interviewer Mode.

## Current State

Working locally today:

- unpacked Chrome extension loads on supported LeetCode problem pages
- Interview Mode panel mounts and persists across LeetCode SPA navigation
- timer, notes autosave, hint usage tracking, and local review flow work
- hint limit is enforced locally at `3` per day
- recent session history, last session summary, and reset-local-data controls exist
- a local API server exists for `POST /api/hint` and `POST /api/review`
- the extension is wired to the local API through the background service worker
- the backend can use OpenAI when `OPENAI_API_KEY` is configured
- local watch build is available with `npm run dev:extension`
- local API dev is available with `npm run dev:api`

Not wired yet:

- editor code extraction from the LeetCode page
- broader QA across multiple LeetCode problems
- deployment or Chrome Web Store packaging

## Immediate Priorities

### 1. Editor Code Extraction

Goal:
Send actual code to review instead of only notes.

Tasks:

- inspect the current LeetCode editor DOM patterns
- add a code extraction helper under `apps/extension/src/lib`
- pass extracted code into review requests
- show a clear panel state if code could not be detected

Definition of done:

- review requests include editor code on supported pages
- failure to read code does not break the panel

### 2. Browser Validation and Selector Hardening QA

Goal:
Validate the API-backed extension across more LeetCode problems and tighten selectors where needed.

Tasks:

- run the extension with `npm run dev:api` and confirm hint and review requests succeed from Chrome
- test on at least 5 to 10 problems across different categories
- confirm title, description, and difficulty extraction
- confirm hide/show behavior for discussion and solution areas
- update `docs/dom-selectors.md` for any selector contract changes

Definition of done:

- extension works cleanly on at least 3 problems with no console-breaking issues
- selector assumptions are documented

## Secondary Priorities

### 3. Better Review UX

Tasks:

- improve loading and error messaging around review
- show whether review used notes only or notes plus code
- make the saved session summary more readable

### 4. Better Hint UX

Tasks:

- make hint progression more explicit in the UI
- show which hint level the user is on
- improve exhausted-state messaging further if needed

### 5. Local Debug Mode

Tasks:

- add a small debug toggle for detected page context
- show which problem fields were extracted
- show whether editor code was detected

## Later

- server-side quota enforcement if needed
- local-to-hosted environment configuration
- packaging for Chrome Web Store

## Working Notes

- If selector contracts change, update `docs/dom-selectors.md`.
- If API contracts change, update `docs/prompt-design.md`.
- Keep the README stable and use this file as the moving backlog.
