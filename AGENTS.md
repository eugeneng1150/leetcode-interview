# AGENTS.md

## Project Goal

Build the free tier of LeetCode Interviewer Mode first. The free tier includes the Interview Mode toggle, timer, 3 progressive hints per day, basic AI review, and local session summaries.

## Global Rules

- Prefer TypeScript throughout the implementation.
- Keep the scope narrow to the free tier.
- Isolate LeetCode-specific logic from general extension UI logic.
- Do not rely on undocumented brittle selectors.
- Any selector change must update `docs/dom-selectors.md`.
- Any prompt or API contract change must update `docs/prompt-design.md`.
- Local persistence is the default for session summaries and free-tier usage tracking in v1.

## Agent Ownership

### 1. Extension Shell Agent

Owns:

- Manifest V3 setup
- extension bootstrap
- content-script root injection
- top-level state wiring
- panel mount lifecycle

Does not own:

- LeetCode selectors
- prompt design
- quota logic details

### 2. LeetCode DOM Agent

Owns:

- supported problem-page detection
- normalized problem metadata extraction
- solution and discussion section detection
- hide and restore behavior for LeetCode page areas

Does not own:

- panel UI
- API behavior
- storage schema

### 3. Interview Panel Agent

Owns:

- Interview Mode panel UI
- timer interaction
- toggle behavior
- approach notes input
- hint and review action states
- unsupported, loading, error, and quota-exhausted states

Does not own:

- selector definitions
- backend prompt behavior
- storage persistence rules

### 4. AI Backend Agent

Owns:

- `POST /api/hint`
- `POST /api/review`
- prompt templates
- model integration
- structured response validation
- free-tier quota behavior at the API boundary if enforced server-side

Does not own:

- panel rendering
- DOM extraction
- local session storage

### 5. Persistence and QA Agent

Owns:

- local storage keys and session schema
- daily hint usage tracking
- session summary persistence
- manual validation plan
- regression checks across multiple LeetCode problems

Does not own:

- UI styling decisions
- prompt wording
- selector definitions

## Handoff Contracts

- The LeetCode DOM Agent publishes a normalized problem payload with:
  `problemTitle`, `problemDescription`, `problemUrl`, `difficulty`
- The AI Backend Agent publishes stable JSON contracts for hint and review requests and responses.
- The Persistence and QA Agent publishes local storage keys and the session summary schema.
- The Interview Panel Agent consumes these contracts and should not invent alternate fields.
- The Extension Shell Agent owns the top-level wiring between content scripts, panel mount, and shared state flow.

## Definition of Done

The free-tier implementation is done when:

- the extension works on at least 3 LeetCode problem pages
- the panel mounts only on supported problem pages
- no page-breaking console errors occur during the main flow
- the user can toggle Interview Mode and run the timer
- the user can request hints up to the daily limit of 3
- the user can request 1 basic review per session
- the session summary is saved locally

## Working Agreement

- Keep agent ownership narrow and avoid overlapping edits when possible.
- If a contract changes, update the relevant doc first or in the same change.
- Prefer stable shared interfaces over informal assumptions between agents.
