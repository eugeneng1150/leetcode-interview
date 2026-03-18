import type { HintRequest, ReviewRequest } from "@leetcode-interviewer/shared";
import { extractEditorSnapshot } from "../lib/editor-content";
import { setDistractionSectionsHidden } from "../lib/page-distractions";
import {
  clearAssistantSettings,
  loadAssistantSettings,
  requestHint,
  requestReview,
  saveAssistantSettings,
  testAssistantConnection
} from "../lib/api-client";
import { extractProblemContext, isSupportedProblemPage } from "../lib/problem-page";
import {
  clearLocalData,
  loadLastSessionSummary,
  loadSessionHistory,
  loadProblemNotes,
  saveProblemNotes,
  saveSessionSummary
} from "../lib/session-storage";
import { createInterviewPanel } from "../panel/index";

const PANEL_ID = "leetcode-interviewer-root";
const REAPPLY_DELAY_MS = 150;

let mountedPanel: { problemUrl: string; destroy(): Promise<void> } | null = null;
let reapplyTimer: number | null = null;
let distractionsHidden = false;

bootstrap();

function bootstrap(): void {
  observeNavigation();
  observeDom();
  void syncPanel();
}

function observeNavigation(): void {
  const { pushState, replaceState } = window.history;
  const dispatch = () => window.dispatchEvent(new Event("leetcode-interviewer:navigation"));

  window.history.pushState = function pushStatePatched(...args) {
    pushState.apply(this, args);
    dispatch();
  };

  window.history.replaceState = function replaceStatePatched(...args) {
    replaceState.apply(this, args);
    dispatch();
  };

  window.addEventListener("popstate", dispatch);
  window.addEventListener("leetcode-interviewer:navigation", () => {
    distractionsHidden = false;
    void syncPanel();
  });
}

function observeDom(): void {
  const observer = new MutationObserver(() => {
    if (reapplyTimer !== null) {
      window.clearTimeout(reapplyTimer);
    }

    reapplyTimer = window.setTimeout(() => {
      if (distractionsHidden) {
        setDistractionSectionsHidden(document, true);
      }

      void syncPanel();
    }, REAPPLY_DELAY_MS);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  window.addEventListener(
    "beforeunload",
    () => {
      observer.disconnect();
    },
    { once: true }
  );
}

async function syncPanel(): Promise<void> {
  const url = new URL(window.location.href);

  if (!isSupportedProblemPage(url)) {
    await unmountPanel();
    return;
  }

  const context = extractProblemContext(document, url);

  if (!context) {
    return;
  }

  if (mountedPanel?.problemUrl === context.problemUrl) {
    return;
  }

  await unmountPanel();

  const host = document.createElement("div");
  host.id = PANEL_ID;
  document.body.append(host);

  const controller = createInterviewPanel(host, {
    context,
    loadAssistantSettings,
    loadLastSessionSummary,
    loadSessionHistory,
    loadNotes() {
      return loadProblemNotes(context.problemUrl);
    },
    getEditorSnapshot() {
      return extractEditorSnapshot(document, window);
    },
    onDistractionToggle(hidden) {
      distractionsHidden = hidden;
      return setDistractionSectionsHidden(document, hidden);
    },
    onClearAssistantSettings: clearAssistantSettings,
    onHintRequest(input) {
      return requestHint(
        {
          userAttempt: input.userAttempt,
          hintLevel: input.hintLevel,
          problemTitle: context.problemTitle,
          problemDescription: context.problemDescription
        } satisfies HintRequest,
        input.onProgress
      );
    },
    onReviewRequest(input) {
      return requestReview({
        ...input,
        problemTitle: context.problemTitle
      } satisfies ReviewRequest);
    },
    onNotesChange(notes) {
      return saveProblemNotes(context.problemUrl, notes);
    },
    onResetLocalData: clearLocalData,
    onSessionComplete: saveSessionSummary,
    onSaveAssistantSettings: saveAssistantSettings,
    onTestAssistantConnection: testAssistantConnection
  });

  mountedPanel = {
    problemUrl: context.problemUrl,
    destroy: controller.destroy
  };
}

async function unmountPanel(): Promise<void> {
  if (!mountedPanel) {
    const existing = document.getElementById(PANEL_ID);
    existing?.remove();
    return;
  }

  const current = mountedPanel;
  mountedPanel = null;
  await current.destroy();
}
