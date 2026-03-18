# Next Steps

This file tracks what is left to build for the local-first version of LeetCode Interviewer Mode.

## Current State

Working locally today:

- unpacked Chrome extension loads on supported LeetCode problem pages
- Interview Mode panel mounts and persists across LeetCode SPA navigation
- timer, notes autosave, and local review flow work
- the panel can collapse to a compact state to get out of the way while solving
- hints and reviews are available without local quota caps
- recent session history, last session summary, and reset-local-data controls exist
- OpenAI key and model settings can be saved directly in the extension panel
- the extension background service worker calls OpenAI directly with the saved key
- editor code extraction from the LeetCode page is wired for review requests
- hint responses stream into the panel while the backend is still generating
- the panel shows detection status and the editor source used for review
- local watch build is available with `npm run dev:extension`

Not wired yet:

- broader QA across multiple LeetCode problems
- Chrome Web Store packaging and onboarding polish

## Immediate Priorities

### 1. Browser Validation and Selector Hardening QA

Goal:
Validate the BYOK extension across more LeetCode problems and tighten selectors where needed.

Tasks:

- load the extension, save a test API key, and confirm hint and review requests succeed from Chrome
- test on at least 5 to 10 problems across different categories
- confirm title, description, and difficulty extraction
- confirm hide/show behavior for discussion and solution areas
- update `docs/dom-selectors.md` for any selector contract changes

Definition of done:

- extension works cleanly on at least 3 problems with no console-breaking issues
- selector assumptions are documented

## Secondary Priorities

### 2. Better Review UX

Tasks:

- improve loading and error messaging around review
- make the saved session summary more readable
- improve repeated-review UX so it is obvious the user can rerun review after editing notes or code

### 3. Better Hint UX

Tasks:

- make hint progression more explicit in the UI
- show which hint level the user is on before the request is sent
- evaluate whether streamed hint text should render with a more obvious loading state or cursor effect

### 4. Local Debug Mode

Tasks:

- turn the current detection status card into an optional debug toggle if it becomes too noisy
- expose more extracted page fields only when debug mode is enabled
- surface selector fallback details only when debug mode is enabled

## Later

- local-to-hosted environment configuration
- packaging for Chrome Web Store

## Working Notes

- If selector contracts change, update `docs/dom-selectors.md`.
- If API contracts change, update `docs/prompt-design.md`.
- Keep the README stable and use this file as the moving backlog.
