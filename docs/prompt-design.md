# Prompt Design and API Contracts

## Purpose

This document locks the current AI behavior and JSON interfaces for hinting and review. On the current branch, these contracts are used by the extension background worker when it calls OpenAI directly with a user-provided key.

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

### Hint request

```json
{
  "problemTitle": "string",
  "problemDescription": "string",
  "userAttempt": "string",
  "hintLevel": 1
}
```

`hintLevel` is any integer `>= 1`. The extension treats `1` as the lightest nudge, `2` as pattern guidance, and `3+` as stronger direction without handing over the full solution.

### Hint response

```json
{
  "hint": "string",
  "followUpQuestion": "string"
}
```

### Internal hint stream transport

This is an internal panel-to-background transport used so the panel can render partial hint text while the final structured hint is still generating.

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

### Review request

```json
{
  "problemTitle": "string",
  "approach": "string",
  "code": "string"
}
```

### Review response

```json
{
  "clarityFeedback": "string",
  "timeComplexity": "string",
  "spaceComplexity": "string",
  "improvementSuggestion": "string"
}
```

### Runtime error response

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

- Hint and review responses should be structured JSON only.
- The background integration should not return markdown-heavy or conversational blobs.
- If model output is malformed, retry or return a typed error for the UI to render.
- The extension stores the user's API key locally in the active Chrome profile.
- The extension background worker calls OpenAI directly for hint and review generation.
- The model can be changed in the panel setup card and defaults to `gpt-4.1-mini`.
- OpenAI requests use structured JSON schema output and short output-token caps to keep hint and review text compact.
- The background worker trims long problem descriptions, candidate notes, and code before sending them to the model to reduce latency.
- Hint requests use an internal streamed channel through the extension background worker so the panel can render partial hint text before the final structured response completes.
