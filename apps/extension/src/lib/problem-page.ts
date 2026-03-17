import type { ProblemContext } from "@leetcode-interviewer/shared";

export function isSupportedProblemPage(url: URL): boolean {
  return /^\/problems\/[^/]+(?:\/description)?\/?$/.test(url.pathname);
}

export function extractProblemContext(doc: Document, url: URL): ProblemContext | null {
  const title = readProblemTitle(doc, url);
  const description = readProblemDescription(doc);
  const difficultyText = readDifficulty(doc);

  if (!title || !description) {
    return null;
  }

  return {
    problemTitle: normalizeProblemTitle(title),
    problemDescription: description,
    problemUrl: url.toString(),
    difficulty: normalizeDifficulty(difficultyText)
  };
}

function normalizeProblemTitle(value: string): string {
  return value.replace(/^\d+\.\s*/, "").trim();
}

function normalizeDifficulty(value: string | null): ProblemContext["difficulty"] {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  if (normalized === "Easy" || normalized === "Medium" || normalized === "Hard") {
    return normalized;
  }

  if (normalized.includes("Easy")) {
    return "Easy";
  }

  if (normalized.includes("Medium")) {
    return "Medium";
  }

  if (normalized.includes("Hard")) {
    return "Hard";
  }

  return null;
}

function readProblemTitle(doc: Document, url: URL): string | null {
  const title = firstText(doc, [
    "[data-cy='question-title']",
    ".text-title-large",
    "a[href^='/problems/'][class*='truncate']",
    "main h1",
    "h1"
  ]);

  if (title) {
    return title;
  }

  const slug = url.pathname.match(/^\/problems\/([^/]+)/)?.[1];
  if (!slug) {
    return null;
  }

  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readProblemDescription(doc: Document): string | null {
  const targeted = firstText(doc, [
    "[data-track-load='description_content']",
    "[data-key='description-content']",
    "[data-cy='question-content']",
    "article"
  ]);

  if (looksLikeProblemDescription(targeted)) {
    return sanitizeDescription(targeted ?? "");
  }

  const marker = findDescriptionMarker(doc);
  if (!marker) {
    return null;
  }

  const container = marker.closest<HTMLElement>("article, section, div");
  const candidate = container?.textContent?.trim() ?? marker.textContent?.trim() ?? "";
  return looksLikeProblemDescription(candidate) ? sanitizeDescription(candidate) : null;
}

function readDifficulty(doc: Document): string | null {
  const targeted = firstText(doc, ["[diff]", "[class*='difficulty']", "main"]);
  if (!targeted) {
    return null;
  }

  const match = targeted.match(/\b(Easy|Medium|Hard)\b/);
  return match?.[1] ?? null;
}

function firstText(doc: Document, selectors: string[]): string | null {
  for (const selector of selectors) {
    const text = doc.querySelector(selector)?.textContent?.trim();
    if (text) {
      return text;
    }
  }

  return null;
}

function findDescriptionMarker(doc: Document): HTMLElement | null {
  const candidates = Array.from(doc.querySelectorAll<HTMLElement>("p, div, section, article, pre"));

  for (const candidate of candidates) {
    const text = candidate.textContent?.trim() ?? "";
    if (text.length < 20) {
      continue;
    }

    if (
      text.includes("Example 1") ||
      text.includes("Constraints") ||
      text.includes("Input:") ||
      text.includes("Output:")
    ) {
      return candidate;
    }
  }

  return null;
}

function looksLikeProblemDescription(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const text = value.trim();
  if (text.length < 120) {
    return false;
  }

  return (
    text.includes("Example") ||
    text.includes("Constraints") ||
    text.includes("Input:") ||
    text.includes("Output:")
  );
}

function sanitizeDescription(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
