# Chrome Web Store Prep

This document tracks what is needed to ship the current BYOK version of LeetCode Interviewer Mode through the Chrome Web Store.

## Current Packaging State

Ready in repo:

- Manifest V3 extension
- required icon files in `apps/extension/public`
- direct OpenAI integration from the extension background worker
- in-panel OpenAI setup flow
- local session storage

Still needed before submission:

- store screenshots
- final category choice in the dashboard
- privacy policy URL hosted on a public page
- final QA pass on multiple LeetCode problems

## Build For Submission

1. Run `npm run build:extension`
2. Use the built folder in `apps/extension/dist`
3. Zip the contents of `apps/extension/dist` for upload

Do not zip the repo root. Upload only the built extension package contents.

## Privacy Policy URL With GitHub Pages

The repo now includes a public-ready policy page at `docs/privacy-policy.html`.

Suggested setup:

1. Commit and push the page
2. In GitHub:
   `Settings` -> `Pages`
3. Set:
   `Build and deployment` -> `Source` -> `Deploy from a branch`
4. Choose:
   branch `main`
   folder `/docs`
5. Save and wait for deployment

The expected project-site URL format is:

`https://<your-github-username>.github.io/<repository-name>/privacy-policy.html`

Official source:

- `https://docs.github.com/pages`
- `https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site`

## Store Listing Checklist

Chrome Web Store listing requirements currently require:

- a non-empty description
- an icon
- screenshots
- accurate privacy fields
- accurate listing metadata

Official sources:

- `https://developer.chrome.com/docs/webstore/program-policies/listing-requirements`
- `https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/`
- `https://developer.chrome.com/docs/webstore/program-policies/policies`

## Suggested Store Copy

### Name

LeetCode Interviewer Mode

### Short Description

Practice LeetCode in interview mode with timed sessions, progressive hints, and AI review using your own OpenAI API key.

### Long Description

LeetCode Interviewer Mode turns supported LeetCode problem pages into a more interview-like practice environment.

Features:

- Interview Mode toggle and session timer
- collapsible panel that stays out of the way while solving
- progressive hints that stream into the panel
- AI review based on your notes and detected editor code
- local session summaries and recent session history
- bring-your-own-key OpenAI setup directly in the extension

This extension does not provide its own API credits. To use hint and review features, you must add your own OpenAI API key in the extension settings.

The extension stores your API key locally in your Chrome profile and sends your problem context, notes, and code to OpenAI only when you request hint or review actions.

## Suggested Screenshots

Capture at least:

1. Panel expanded on a LeetCode problem page
2. OpenAI setup card with model field visible
3. Streaming hint in progress
4. Review output with code-aware feedback
5. Collapsed panel state

## Suggested Privacy Disclosures

Likely data handling based on the current build:

- user-provided API key is stored locally in Chrome storage
- problem title, problem description, user notes, and detected code are sent to OpenAI when hint or review is requested
- local session summaries are stored in Chrome storage
- no account system
- no remote backend owned by this project in the primary flow

You should confirm the Chrome Web Store privacy fields match the actual behavior exactly.

## Final QA Before Submission

- verify the panel mounts only on supported problem pages
- verify hint and review are disabled until an API key is saved
- verify `Save`, `Test`, and `Clear` in the OpenAI setup card
- verify hint streaming works
- verify review can be rerun in the same session
- verify session history and reset-local-data still work
- verify behavior across at least 5 LeetCode problems

## Post-Submission Notes

- consider enabling verified uploads in the Chrome Web Store dashboard

Official source:

- `https://developer.chrome.com/blog/verified-uploads-cws`
