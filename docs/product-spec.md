# Product Spec

## Summary

The first release builds the current local-first version of LeetCode Interviewer Mode as a Chrome extension overlay for LeetCode problem pages. The goal is to make practice feel more interview-like without expanding into paid or advanced features.

## Current Features

- Interview Mode toggle
- session timer
- collapsible side panel
- hide and restore solution and discussion sections
- approach notes input
- progressive hints with no hard cap
- repeatable basic review requests
- local session summary

## Out of Scope

- advanced interviewer follow-up flows
- voice mode
- company-specific mock modes
- analytics dashboards
- support outside Chrome

## User Flow

1. User opens a supported LeetCode problem page.
2. Extension detects the page and mounts the Interview Mode panel.
3. User enables Interview Mode.
4. Timer starts when the interview session starts.
5. User can hide distracting sections and write approach notes.
6. User can request hints progressively and see hint text stream into the panel while it is generating.
7. User can request basic review after attempting the problem, including multiple times in the same session if needed.
8. Session summary is saved locally when the session ends or the review completes.

## Locked Defaults

- In-session hint ladder: `3` guidance levels, with unlimited requests
- Session persistence: local only

## Required UX States

- unsupported page
- ready to start
- interview active
- hint loading
- hint streaming
- review loading
- backend error
- saved session summary

## Review Output Requirements

The basic review must return:

- `clarityFeedback`
- `timeComplexity`
- `spaceComplexity`
- `improvementSuggestion`

## Success Criteria

The release is successful if a user can:

- open a supported LeetCode problem page
- start Interview Mode
- use hints without seeing a full spoiled solution immediately
- receive a useful basic review
- finish a session and have the summary stored locally
