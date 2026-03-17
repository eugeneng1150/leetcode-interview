# Product Spec: Free Tier

## Summary

The first release builds the free tier of LeetCode Interviewer Mode as a Chrome extension overlay for LeetCode problem pages. The goal is to make practice feel more interview-like without expanding into paid or advanced features.

## Free-Tier Features

- Interview Mode toggle
- session timer
- hide and restore solution and discussion sections
- approach notes input
- 3 progressive hints per day
- 1 basic review per session
- local session summary

## Out of Scope

- unlimited hints
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
6. User can request hints progressively, up to the daily limit.
7. User can request 1 basic review after attempting the problem.
8. Session summary is saved locally when the session ends or the review completes.

## Locked Defaults

- Free-tier daily hint limit: `3`
- In-session hint ladder: `3` levels
- Reviews per session: `1`
- Session persistence: local only

## Required UX States

- unsupported page
- ready to start
- interview active
- hint loading
- review loading
- quota exhausted
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
