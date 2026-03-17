# Next Steps

This file tracks what is left to build for the local-first free-tier version of LeetCode Interviewer Mode.

## Current State

Working locally today:

- unpacked Chrome extension loads on supported LeetCode problem pages
- Interview Mode panel mounts and persists across LeetCode SPA navigation
- timer, notes autosave, hint usage tracking, and local review flow work
- hint limit is enforced locally at `3` per day
- recent session history, last session summary, and reset-local-data controls exist
- local watch build is available with `npm run dev:extension`

Not wired yet:

- real API-backed hints and reviews
- editor code extraction from the LeetCode page
- broader QA across multiple LeetCode problems
- deployment or Chrome Web Store packaging

## Immediate Priorities

### 1. Local API Wiring

Goal:
Replace the mock in-extension hint/review logic with real calls to a local API server.

Tasks:

- add an HTTP server entrypoint in `apps/api`
- expose `POST /api/hint` and `POST /api/review`
- add an extension-side API client in `apps/extension`
- switch the panel wiring from `mock-interview.ts` to the API client
- keep a local fallback or typed error state while testing

Definition of done:

- extension successfully calls a local server from the content script
- hint and review buttons surface API errors clearly
- mock logic is no longer the default path

### 2. Editor Code Extraction

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

### 3. Selector Hardening QA

Goal:
Validate the extension across more LeetCode problems and tighten selectors where needed.

Tasks:

- test on at least 5 to 10 problems across different categories
- confirm title, description, and difficulty extraction
- confirm hide/show behavior for discussion and solution areas
- update `docs/dom-selectors.md` for any selector contract changes

Definition of done:

- extension works cleanly on at least 3 problems with no console-breaking issues
- selector assumptions are documented

## Secondary Priorities

### 4. Better Review UX

Tasks:

- improve loading and error messaging around review
- show whether review used notes only or notes plus code
- make the saved session summary more readable

### 5. Better Hint UX

Tasks:

- make hint progression more explicit in the UI
- show which hint level the user is on
- improve exhausted-state messaging further if needed

### 6. Local Debug Mode

Tasks:

- add a small debug toggle for detected page context
- show which problem fields were extracted
- show whether editor code was detected

## Later

- real model integration in `apps/api`
- server-side quota enforcement if needed
- local-to-hosted environment configuration
- packaging for Chrome Web Store

## Working Notes

- If selector contracts change, update `docs/dom-selectors.md`.
- If API contracts change, update `docs/prompt-design.md`.
- Keep the README stable and use this file as the moving backlog.
