type DistractionToggleResult = {
  count: number;
  hidden: boolean;
};

const HIDE_ATTRIBUTE = "data-leetcode-interviewer-hidden";
const HIDE_VISIBILITY_ATTRIBUTE = "data-leetcode-interviewer-visibility";
const SOLUTION_LABELS = new Set(["solution", "solutions", "editorial"]);
const DISCUSSION_LABELS = new Set(["discussion", "discussions", "discuss"]);

export function setDistractionSectionsHidden(doc: Document, hidden: boolean): DistractionToggleResult {
  const targets = collectDistractionTargets(doc);

  for (const element of targets) {
    if (hidden) {
      hideElement(element);
    } else {
      showElement(element);
    }
  }

  return {
    count: targets.length,
    hidden
  };
}

function collectDistractionTargets(doc: Document): HTMLElement[] {
  const targets = new Set<HTMLElement>();
  const interactiveCandidates = Array.from(
    doc.querySelectorAll<HTMLElement>("[role='tab'], [aria-controls], button, a, h2, h3, h4")
  );

  for (const element of interactiveCandidates) {
    const label = normalizeText(element.textContent);
    if (!label) {
      continue;
    }

    if (!matchesDistraction(label) && !matchesDistractionHref(element)) {
      continue;
    }

    targets.add(element);
    addContainerTargets(element, targets);

    const controlsId = element.getAttribute("aria-controls");
    if (controlsId) {
      const controlled = doc.getElementById(controlsId);
      if (controlled instanceof HTMLElement) {
        targets.add(controlled);
        addContainerTargets(controlled, targets);
      }
    }

    const tabPanel = element.closest<HTMLElement>("[role='tabpanel']");
    if (tabPanel) {
      targets.add(tabPanel);
      addContainerTargets(tabPanel, targets);
    }
  }

  return Array.from(targets);
}

function matchesDistraction(label: string): boolean {
  return SOLUTION_LABELS.has(label) || DISCUSSION_LABELS.has(label);
}

function matchesDistractionHref(element: HTMLElement): boolean {
  if (!(element instanceof HTMLAnchorElement)) {
    return false;
  }

  const href = element.href.toLowerCase();
  return href.includes("/solutions") || href.includes("/discuss") || href.includes("/discussion");
}

function normalizeText(value: string | null): string {
  return value?.trim().toLowerCase() ?? "";
}

function hideElement(element: HTMLElement): void {
  if (!element.hasAttribute(HIDE_ATTRIBUTE)) {
    element.setAttribute(HIDE_ATTRIBUTE, element.style.display || "");
  }

  if (!element.hasAttribute(HIDE_VISIBILITY_ATTRIBUTE)) {
    element.setAttribute(HIDE_VISIBILITY_ATTRIBUTE, element.style.visibility || "");
  }

  element.style.display = "none";
  element.style.visibility = "hidden";
}

function showElement(element: HTMLElement): void {
  if (!element.hasAttribute(HIDE_ATTRIBUTE)) {
    return;
  }

  const previousDisplay = element.getAttribute(HIDE_ATTRIBUTE) ?? "";
  const previousVisibility = element.getAttribute(HIDE_VISIBILITY_ATTRIBUTE) ?? "";
  element.style.display = previousDisplay;
  element.style.visibility = previousVisibility;
  element.removeAttribute(HIDE_ATTRIBUTE);
  element.removeAttribute(HIDE_VISIBILITY_ATTRIBUTE);
}

function addContainerTargets(element: HTMLElement, targets: Set<HTMLElement>): void {
  const container = findHideContainer(element);
  if (container) {
    targets.add(container);
  }
}

function findHideContainer(element: HTMLElement): HTMLElement | null {
  const candidates = [
    element.closest<HTMLElement>("section"),
    element.closest<HTMLElement>("article"),
    element.closest<HTMLElement>("[role='tabpanel']"),
    element.closest<HTMLElement>("[data-layout-path]"),
    element.closest<HTMLElement>("div[class*='panel']"),
    element.closest<HTMLElement>("div[class*='card']")
  ].filter((candidate): candidate is HTMLElement => candidate instanceof HTMLElement);

  for (const candidate of candidates) {
    if (!candidate.textContent) {
      continue;
    }

    const textLength = candidate.textContent.trim().length;
    if (textLength >= 20 && textLength <= 4000) {
      return candidate;
    }
  }

  return null;
}
