# Prompt Design and API Contracts

## Purpose

This document locks the current AI behavior and JSON interfaces for hinting and review.

## Hint Behavior

Hints should:

- nudge instead of reveal
- escalate gradually
- point to useful patterns
- sound like interviewer guidance
- stay concise
- avoid generic assistant phrasing

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

Reviews should:

- be grounded in the candidate's notes and code
- acknowledge when code is missing rather than inventing details
- sound like interview feedback, not a tutorial
- stay concise and specific

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

`hintLevel` is any integer `>= 1`. The backend treats `1` as the lightest nudge, `2` as pattern guidance, and `3+` as stronger direction without handing over the full solution.

### `POST /api/hint` response

```json
{
  "hint": "string",
  "followUpQuestion": "string"
}
```

### Internal `POST /api/hint/stream` transport

This is an internal extension-to-local-backend transport used by the background worker so the panel can render partial hint text while the final structured hint is still generating.

The response is newline-delimited JSON events:

```json
{
  "type": "hint_delta",
  "delta": "string",
  "hint": "string"
}
```

```json
{
  "type": "completed",
  "data": {
    "hint": "string",
    "followUpQuestion": "string"
  }
}
```

```json
{
  "type": "error",
  "error": {
    "code": "string",
    "message": "string"
  }
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

## Behavior Defaults

- Hint ladder levels: `3+`
- Hint requests: unlimited
- Review requests: unlimited
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
- OpenAI requests use structured JSON schema output and short output-token caps to keep hint and review text compact.
- The backend trims long problem descriptions, candidate notes, and code before sending them to the model to reduce latency.
- Hint requests use an internal streamed channel through the extension background worker so the panel can render partial hint text before the final structured response completes.
