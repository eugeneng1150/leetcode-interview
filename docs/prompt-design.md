# Prompt Design and API Contracts

## Purpose

This document locks the free-tier AI behavior and JSON interfaces for hinting and review.

## Hint Behavior

Hints should:

- nudge instead of reveal
- escalate gradually
- point to useful patterns
- sound like interviewer guidance

Hints should not:

- dump a full solution
- provide exact code too early
- skip directly to the optimal answer without progression

## Review Behavior

The basic review should return:

- clarity feedback
- likely time complexity
- likely space complexity
- one improvement suggestion

## Structured Contracts

### `ProblemContext`

```json
{
  "problemTitle": "string",
  "problemDescription": "string",
  "problemUrl": "string",
  "difficulty": "Easy | Medium | Hard | null"
}
```

### `POST /api/hint` request

```json
{
  "problemTitle": "string",
  "problemDescription": "string",
  "userAttempt": "string",
  "hintLevel": 1
}
```

### `POST /api/hint` response

```json
{
  "hint": "string",
  "followUpQuestion": "string"
}
```

### `POST /api/review` request

```json
{
  "problemTitle": "string",
  "approach": "string",
  "code": "string"
}
```

### `POST /api/review` response

```json
{
  "clarityFeedback": "string",
  "timeComplexity": "string",
  "spaceComplexity": "string",
  "improvementSuggestion": "string"
}
```

### API error response

```json
{
  "code": "string",
  "message": "string"
}
```

### `SessionSummary`

```json
{
  "problemUrl": "string",
  "problemTitle": "string",
  "difficulty": "Easy | Medium | Hard | null",
  "startedAt": "ISO timestamp",
  "endedAt": "ISO timestamp",
  "durationSeconds": 0,
  "modeEnabled": true,
  "hintCount": 0,
  "reviewRequested": false,
  "notesPreview": "string"
}
```

## Free-Tier Policy Defaults

- Daily hint limit: `3`
- Hint ladder levels per session: `3`
- Basic reviews per session: `1`
- Session persistence: local only

## Output Requirements

- API responses should be structured JSON only.
- The backend should not return markdown-heavy or conversational blobs.
- If model output is malformed, retry or return a typed error for the UI to render.
- Local development runs the API at `http://127.0.0.1:8787` by default.
- The local API may use OpenAI when `OPENAI_API_KEY` is configured.
- If `OPENAI_API_KEY` is missing, the backend falls back to the local heuristic generator.
- `OPENAI_MODEL` can override the backend model selection.
- `LEETCODE_INTERVIEWER_FALLBACK_TO_LOCAL=false` disables heuristic fallback when OpenAI fails.
