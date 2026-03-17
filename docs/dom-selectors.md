# DOM Selectors and Page Integration

## Purpose

This document defines what the LeetCode DOM integration layer must detect and extract. It is the source of truth for selector ownership and page-integration expectations.

## Supported Page Type

Only LeetCode problem pages are in scope for the first build.

## Required Extracted Fields

The DOM layer must publish a normalized problem payload with:

- `problemTitle`
- `problemDescription`
- `problemUrl`
- `difficulty` when available, otherwise `null`

## Required Detectable Regions

The DOM layer must be able to identify:

- the main problem statement region
- whether a code editor is present
- the solution section
- the discussion section

## Selector Policy

- Prefer stable attributes, semantic structure, or durable anchors over deep class chains.
- Keep selector logic isolated from panel UI code.
- If multiple selectors are required, document them here with the behavior they support.

## Fallback Policy

- If the problem title or description cannot be extracted, render the panel in an unsupported or degraded state.
- Do not guess missing values from unrelated page content.
- If solution or discussion sections cannot be safely identified, leave them visible rather than hiding the wrong content.

## Change Policy

- Any selector update must also update this document.
- Any selector change should note which LeetCode pages were manually checked.
- Selector fixes should prefer broad resilience over one-page hacks.

## Initial Validation Target

When implementation starts, validate selectors on at least 3 different LeetCode problem pages across different difficulties.
