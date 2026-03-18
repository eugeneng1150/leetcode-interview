# LeetCode Interviewer Mode

LeetCode Interviewer Mode is a Chrome extension that makes LeetCode practice feel more like a real technical interview. The current build is local-first, OpenAI-compatible, and designed for bring-your-own-key usage without a paid layer.

## Status

This repository now has a working local prototype of the extension with direct OpenAI requests from the extension background worker, streamed hint rendering in the panel, editor code extraction, and local session persistence. The current focus is browser-level QA, selector reliability, onboarding polish, and Chrome Web Store readiness.

## Current Scope

The first build includes:

- Interview Mode toggle
- timer
- collapsible side panel
- progressive hints with no hard cap
- basic AI review
- repeat review requests during a session
- local session summary

The first build does not include:

- voice mode
- analytics dashboard
- company-style modes
- advanced follow-up interview flows

## Core User Flow

1. The user opens a supported LeetCode problem page.
2. The extension detects the page and mounts the Interview Mode panel.
3. The user enables Interview Mode and starts a timed session.
4. The extension can hide solution and discussion areas.
5. The user types approach notes and requests hints when needed.
6. Hints stream into the panel as they are generated.
7. The user requests basic AI review after attempting the problem.
8. The session summary is saved locally.

## Agent Ownership

The current build is split into 5 agents:

- Extension Shell Agent: extension bootstrap, manifest, content-script mount, top-level wiring
- LeetCode DOM Agent: problem-page detection, metadata extraction, solution and discussion selectors
- Interview Panel Agent: panel UI, timer, toggle, notes, hint and review actions, state rendering
- AI Integration Agent: prompt templates, model integration, structured response validation, and background request flow
- Persistence and QA Agent: local storage schema, session summaries, manual validation

Detailed ownership and handoff rules live in `AGENTS.md`.

## Build Order

1. Build the extension shell and DOM integration in parallel.
2. Build the panel UI against stable page-detection and metadata contracts.
3. Build the hint and review integration against fixed JSON interfaces.
4. Add local persistence and end-to-end QA.

## Locked Interfaces

These contracts are fixed for the first build:

- Problem context:
  `problemTitle`, `problemDescription`, `problemUrl`, `difficulty`
- Hint request:
  `problemTitle`, `problemDescription`, `userAttempt`, `hintLevel`
- Hint response:
  `hint`, `followUpQuestion`
- Review request:
  `problemTitle`, `approach`, `code`
- Review response:
  `clarityFeedback`, `timeComplexity`, `spaceComplexity`, `improvementSuggestion`
- Session summary:
  `problemUrl`, `problemTitle`, `difficulty`, `startedAt`, `endedAt`, `durationSeconds`, `modeEnabled`, `hintCount`, `reviewRequested`, `notesPreview`

The full shapes are documented in `docs/prompt-design.md`.

## Repository Docs

- `AGENTS.md`: agent ownership, boundaries, contracts, and definition of done
- `docs/product-spec.md`: current feature behavior and UX states
- `docs/dom-selectors.md`: DOM integration contract and selector policy
- `docs/prompt-design.md`: prompt rules, API contracts, and output requirements
- `docs/chrome-web-store.md`: submission checklist, listing copy, and release prep
- `docs/privacy-policy.md`: privacy policy draft for public publishing
- `next-step.md`: current build backlog and implementation checklist

## Repository Structure

The repo is scaffolded for parallel implementation:

- `apps/extension`: Chrome extension shell and LeetCode page integration
- `apps/api`: optional local API prototype kept for experimentation
- `packages/shared`: shared contracts
- `docs`: planning and implementation source-of-truth docs

## Local OpenAI Setup

To use OpenAI-backed hints and reviews in the extension:

1. Build the extension with `npm run build:extension`
2. Load `apps/extension/dist` as an unpacked extension in Chrome
3. Open a supported LeetCode problem page
4. In the panel, paste your OpenAI API key into the `OpenAI Setup` card
5. Optionally change the model from the default `gpt-4.1-mini`
6. Click `Save`, then `Test`

The key is stored locally in that Chrome profile and used directly by the extension background worker.

## Success Criteria

The current build is successful when a user can:

- open a supported LeetCode problem
- start Interview Mode
- request progressive hints without a hard cap
- request repeated basic structured reviews when needed
- finish a session and have it saved locally

## Current Build Tracking

Use `next-step.md` as the active implementation backlog. Keep the README stable and use that file for moving priorities.
