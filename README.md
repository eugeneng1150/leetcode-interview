# LeetCode Interviewer Mode

LeetCode Interviewer Mode is a Chrome extension that makes LeetCode practice feel more like a real technical interview. The first build targets the free tier only.

## Status

This repository is in the planning stage. The docs in this repo define the free-tier scope, agent ownership, and implementation contracts for the first build.

## Free-Tier Scope

The first build includes:

- Interview Mode toggle
- timer
- 3 progressive hints per day
- basic AI review
- local session summary

The first build does not include:

- unlimited hints
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
6. The user requests a basic review after attempting the problem.
7. The session summary is saved locally.

## Agent Ownership

The free-tier build is split into 5 agents:

- Extension Shell Agent: extension bootstrap, manifest, content-script mount, top-level wiring
- LeetCode DOM Agent: problem-page detection, metadata extraction, solution and discussion selectors
- Interview Panel Agent: panel UI, timer, toggle, notes, hint and review actions, state rendering
- AI Backend Agent: `/api/hint`, `/api/review`, prompts, output validation, free-tier quota behavior
- Persistence and QA Agent: local storage schema, daily hint tracking, session summaries, manual validation

Detailed ownership and handoff rules live in `AGENTS.md`.

## Build Order

1. Build the extension shell and DOM integration in parallel.
2. Build the panel UI against stable page-detection and metadata contracts.
3. Build the hint and review backend against fixed JSON interfaces.
4. Add local persistence, daily quota tracking, and end-to-end QA.

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
  `problemUrl`, `problemTitle`, `startedAt`, `endedAt`, `modeEnabled`, `hintCount`, `reviewRequested`

The full shapes are documented in `docs/prompt-design.md`.

## Repository Docs

- `AGENTS.md`: agent ownership, boundaries, contracts, and definition of done
- `docs/product-spec.md`: free-tier feature behavior and UX states
- `docs/dom-selectors.md`: DOM integration contract and selector policy
- `docs/prompt-design.md`: prompt rules, API contracts, and output requirements

## Repository Structure

The repo is scaffolded for parallel implementation:

- `apps/extension`: Chrome extension shell and LeetCode page integration
- `apps/api`: hint and review API skeleton
- `packages/shared`: shared contracts and free-tier constants
- `docs`: planning and implementation source-of-truth docs

## Success Criteria

The first build is successful when a user can:

- open a supported LeetCode problem
- start Interview Mode
- use up to 3 progressive hints in a day
- receive a basic structured review
- finish a session and have it saved locally

## Next Step After Docs

Once the docs are approved, implementation should start with the extension shell, DOM integration, and panel mount contract.
