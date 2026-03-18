import {
  type AssistantConnectionStatus,
  type AssistantSettingsSummary,
  type HintResponse,
  type ProblemContext,
  type ReviewResponse,
  type SaveAssistantSettingsInput,
  type SessionSummary
} from "@leetcode-interviewer/shared";
import type { EditorSnapshot } from "../lib/editor-content";

type PanelController = {
  destroy(): Promise<void>;
};

type PanelOptions = {
  context: ProblemContext;
  loadAssistantSettings(): Promise<AssistantSettingsSummary>;
  loadLastSessionSummary(): Promise<SessionSummary | null>;
  loadSessionHistory(): Promise<SessionSummary[]>;
  loadNotes(): Promise<string>;
  getEditorSnapshot(): EditorSnapshot | null;
  onDistractionToggle(hidden: boolean): { count: number; hidden: boolean };
  onClearAssistantSettings(): Promise<AssistantSettingsSummary>;
  onHintRequest(input: {
    userAttempt: string;
    hintLevel: number;
    onProgress?: (hint: string) => void;
  }): Promise<HintResponse>;
  onNotesChange(notes: string): Promise<void>;
  onResetLocalData(): Promise<void>;
  onReviewRequest(input: { approach: string; code: string }): Promise<ReviewResponse>;
  onSaveAssistantSettings(input: SaveAssistantSettingsInput): Promise<AssistantSettingsSummary>;
  onSessionComplete(summary: SessionSummary): Promise<void>;
  onTestAssistantConnection(): Promise<AssistantConnectionStatus>;
};

export function createInterviewPanel(container: HTMLElement, options: PanelOptions): PanelController {
  const root = document.createElement("aside");
  root.dataset.role = "interview-panel";
  root.style.position = "fixed";
  root.style.top = "20px";
  root.style.right = "20px";
  root.style.width = "360px";
  root.style.maxHeight = "calc(100vh - 40px)";
  root.style.overflow = "auto";
  root.style.zIndex = "2147483647";
  root.style.padding = "18px";
  root.style.borderRadius = "20px";
  root.style.background = "linear-gradient(180deg, #fcfbf7 0%, #f3efe4 100%)";
  root.style.color = "#1f2937";
  root.style.border = "1px solid rgba(180, 157, 104, 0.35)";
  root.style.boxShadow = "0 24px 50px rgba(15, 23, 42, 0.18)";
  root.style.fontFamily = "Georgia, 'Times New Roman', serif";
  root.style.transition = "width 180ms ease, padding 180ms ease";

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "flex-start";
  header.style.justifyContent = "space-between";
  header.style.gap = "12px";
  header.style.marginBottom = "14px";
  header.style.cursor = "grab";
  header.style.touchAction = "none";

  const titleGroup = document.createElement("div");
  titleGroup.style.minWidth = "0";

  const title = document.createElement("h2");
  title.textContent = "Interview Mode";
  title.style.margin = "0 0 4px";
  title.style.fontSize = "28px";
  title.style.lineHeight = "1.1";
  title.style.color = "#111827";
  title.style.fontWeight = "700";
  title.style.textShadow = "0 1px 0 rgba(255, 255, 255, 0.35)";

  const problem = document.createElement("p");
  problem.textContent = options.context.problemTitle;
  problem.style.margin = "0";
  problem.style.color = "#475467";
  problem.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  problem.style.fontSize = "13px";
  problem.style.lineHeight = "1.4";

  titleGroup.append(title, problem);

  const collapseButton = createButton("Collapse", "secondary");
  collapseButton.style.padding = "10px 12px";
  collapseButton.style.flexShrink = "0";
  collapseButton.style.minWidth = "90px";

  header.append(titleGroup, collapseButton);

  const body = document.createElement("div");

  const collapsedSummary = createCard();
  collapsedSummary.style.display = "none";
  collapsedSummary.style.padding = "10px 12px";

  const collapsedMode = createMetaLabel("Mode");
  const collapsedModeValue = document.createElement("p");
  collapsedModeValue.style.margin = "6px 0 0";
  collapsedModeValue.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  collapsedModeValue.style.fontSize = "12px";
  collapsedModeValue.style.fontWeight = "700";

  const collapsedTimer = document.createElement("p");
  collapsedTimer.style.margin = "10px 0 0";
  collapsedTimer.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  collapsedTimer.style.fontSize = "20px";
  collapsedTimer.style.fontWeight = "700";

  const collapsedHints = document.createElement("p");
  collapsedHints.style.margin = "8px 0 0";
  collapsedHints.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  collapsedHints.style.fontSize = "12px";
  collapsedHints.style.lineHeight = "1.4";
  collapsedHints.style.color = "#667085";

  collapsedSummary.append(collapsedMode, collapsedModeValue, collapsedTimer, collapsedHints);

  const modeCard = createCard();
  modeCard.style.marginBottom = "14px";
  const modeLabel = createMetaLabel("Mode");
  const modeValue = document.createElement("p");
  modeValue.textContent = "Off";
  modeValue.style.margin = "6px 0 0";
  modeValue.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  modeValue.style.fontWeight = "700";
  modeValue.style.fontSize = "16px";
  modeCard.append(modeLabel, modeValue);

  const controls = document.createElement("div");
  controls.style.display = "grid";
  controls.style.gridTemplateColumns = "1fr 1fr";
  controls.style.gap = "8px";
  controls.style.marginBottom = "14px";

  const startButton = createButton("Start Interview", "primary");
  const distractionButton = createButton("Hide Distractions", "secondary");
  distractionButton.disabled = true;
  controls.append(startButton, distractionButton);

  const settingsCard = createCard();
  settingsCard.style.marginBottom = "14px";
  const settingsLabel = createMetaLabel("OpenAI Setup");
  const settingsSummary = document.createElement("p");
  settingsSummary.style.margin = "6px 0 0";
  settingsSummary.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  settingsSummary.style.fontSize = "13px";
  settingsSummary.style.lineHeight = "1.5";
  settingsSummary.style.color = "#475467";
  settingsSummary.textContent = "No API key saved yet.";

  const settingsHelper = document.createElement("p");
  settingsHelper.textContent = "Your key stays in this Chrome profile. It is used directly for hint and review requests.";
  settingsHelper.style.margin = "8px 0 0";
  settingsHelper.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  settingsHelper.style.fontSize = "12px";
  settingsHelper.style.lineHeight = "1.5";
  settingsHelper.style.color = "#667085";

  const apiKeyInput = createTextInput("password", "Paste your OpenAI API key");
  apiKeyInput.style.marginTop = "10px";
  apiKeyInput.autocomplete = "off";
  apiKeyInput.spellcheck = false;

  const modelInput = createTextInput("text", "gpt-4.1-mini");
  modelInput.style.marginTop = "8px";

  const settingsButtons = document.createElement("div");
  settingsButtons.style.display = "grid";
  settingsButtons.style.gridTemplateColumns = "1fr 1fr 1fr";
  settingsButtons.style.gap = "8px";
  settingsButtons.style.marginTop = "10px";

  const saveSettingsButton = createButton("Save", "secondary");
  const testSettingsButton = createButton("Test", "secondary");
  const clearSettingsButton = createButton("Clear", "secondary");
  settingsButtons.append(saveSettingsButton, testSettingsButton, clearSettingsButton);

  const settingsStatus = document.createElement("p");
  settingsStatus.textContent = "Save your API key to enable hints and review.";
  settingsStatus.style.margin = "10px 0 0";
  settingsStatus.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  settingsStatus.style.fontSize = "12px";
  settingsStatus.style.lineHeight = "1.5";
  settingsStatus.style.color = "#475467";

  settingsCard.append(
    settingsLabel,
    settingsSummary,
    settingsHelper,
    apiKeyInput,
    modelInput,
    settingsButtons,
    settingsStatus
  );

  const timerCard = createCard();
  timerCard.style.marginBottom = "14px";
  const timerLabel = createMetaLabel("Session Timer");

  const timer = document.createElement("p");
  timer.textContent = "00:00";
  timer.style.margin = "4px 0 0";
  timer.style.fontSize = "30px";
  timer.style.fontWeight = "700";
  timer.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  timerCard.append(timerLabel, timer);

  const hintUsageCard = createCard();
  hintUsageCard.style.marginBottom = "14px";
  const hintUsageLabel = createMetaLabel("Hint Progress");
  const hintUsageValue = document.createElement("p");
  hintUsageValue.style.margin = "4px 0 0";
  hintUsageValue.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  hintUsageValue.style.fontWeight = "600";
  const hintUsageMeta = document.createElement("p");
  hintUsageMeta.style.margin = "8px 0 0";
  hintUsageMeta.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  hintUsageMeta.style.fontSize = "12px";
  hintUsageMeta.style.lineHeight = "1.4";
  hintUsageMeta.style.color = "#667085";
  hintUsageMeta.textContent = "Hints are unlimited. Level 1 nudges, Level 2 patterns, Level 3+ stronger direction.";
  hintUsageCard.append(hintUsageLabel, hintUsageValue, hintUsageMeta);

  const notesLabel = createMetaLabel("Talk Through Your Approach");
  notesLabel.style.marginBottom = "8px";

  const notes = document.createElement("textarea");
  notes.placeholder = "Talk through your approach...";
  notes.rows = 7;
  notes.style.width = "100%";
  notes.style.boxSizing = "border-box";
  notes.style.border = "1px solid #d0d5dd";
  notes.style.borderRadius = "14px";
  notes.style.padding = "12px";
  notes.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  notes.style.fontSize = "14px";
  notes.style.background = "rgba(255, 255, 255, 0.88)";
  notes.style.marginBottom = "14px";
  notes.disabled = true;

  const notesMeta = document.createElement("p");
  notesMeta.textContent = "Notes save automatically for this problem.";
  notesMeta.style.margin = "-6px 0 14px";
  notesMeta.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  notesMeta.style.fontSize = "12px";
  notesMeta.style.color = "#667085";

  const actions = document.createElement("div");
  actions.style.display = "grid";
  actions.style.gridTemplateColumns = "1fr 1fr";
  actions.style.gap = "8px";
  actions.style.marginBottom = "14px";

  const hintButton = createButton(`Get Hint`, "secondary");
  const reviewButton = createButton("Review My Attempt", "secondary");
  hintButton.disabled = true;
  reviewButton.disabled = true;
  actions.append(hintButton, reviewButton);

  const hintCard = createCard();
  hintCard.style.marginBottom = "14px";
  const hintLabel = createMetaLabel("Latest Hint");
  const hintText = document.createElement("p");
  hintText.textContent = "Start the session to unlock hints.";
  hintText.style.margin = "6px 0 0";
  hintText.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  hintText.style.fontSize = "13px";
  hintText.style.lineHeight = "1.5";
  const followUp = document.createElement("p");
  followUp.style.margin = "8px 0 0";
  followUp.style.color = "#667085";
  followUp.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  followUp.style.fontSize = "12px";
  hintCard.append(hintLabel, hintText, followUp);

  const reviewCard = createCard();
  reviewCard.style.marginBottom = "14px";
  const reviewLabel = createMetaLabel("Basic Review");
  const reviewText = document.createElement("p");
  reviewText.textContent = "No review yet.";
  reviewText.style.margin = "6px 0 0";
  reviewText.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  reviewText.style.fontSize = "13px";
  reviewText.style.lineHeight = "1.5";
  reviewCard.append(reviewLabel, reviewText);

  const recentSessionsCard = createCard();
  recentSessionsCard.style.marginBottom = "14px";
  const recentSessionsLabel = createMetaLabel("Recent Sessions");
  const recentSessionsList = document.createElement("div");
  recentSessionsList.style.marginTop = "8px";
  recentSessionsCard.append(recentSessionsLabel, recentSessionsList);

  const lastSessionCard = createCard();
  lastSessionCard.style.marginBottom = "14px";
  const lastSessionLabel = createMetaLabel("Last Saved Session");
  const lastSessionText = document.createElement("p");
  lastSessionText.textContent = "No saved session yet.";
  lastSessionText.style.margin = "6px 0 0";
  lastSessionText.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  lastSessionText.style.fontSize = "13px";
  lastSessionText.style.lineHeight = "1.5";
  lastSessionCard.append(lastSessionLabel, lastSessionText);

  const diagnosticsCard = createCard();
  diagnosticsCard.style.marginBottom = "14px";
  const diagnosticsLabel = createMetaLabel("Detection Status");
  const diagnosticsText = document.createElement("p");
  diagnosticsText.style.margin = "6px 0 0";
  diagnosticsText.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  diagnosticsText.style.fontSize = "12px";
  diagnosticsText.style.lineHeight = "1.5";
  diagnosticsText.style.color = "#475467";
  diagnosticsText.textContent = buildDiagnosticsSummary(options.context, options.getEditorSnapshot());
  diagnosticsCard.append(diagnosticsLabel, diagnosticsText);

  const utilities = document.createElement("div");
  utilities.style.display = "grid";
  utilities.style.gridTemplateColumns = "1fr";
  utilities.style.gap = "8px";
  utilities.style.marginBottom = "14px";

  const resetButton = createButton("Reset Local Data", "secondary");
  utilities.append(resetButton);

  const status = document.createElement("p");
  status.textContent = "Ready to start.";
  status.style.margin = "14px 0 0";
  status.style.color = "#475467";
  status.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  status.style.fontSize = "13px";

  let intervalId: number | null = null;
  let notesSaveTimer: number | null = null;
  let elapsedSeconds = 0;
  let sessionStartMs: number | null = null;
  let hintCount = 0;
  let reviewRequested = false;
  let interviewActive = false;
  let assistantConfigured = false;
  let distractionsHidden = false;
  let lastEditorSnapshot: EditorSnapshot | null = null;
  let collapsed = false;
  let dragPointerId: number | null = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  void hydrate();

  header.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest("button, input, textarea")) {
      return;
    }

    const rect = root.getBoundingClientRect();
    dragPointerId = event.pointerId;
    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;
    root.style.right = "";
    root.style.left = `${rect.left}px`;
    root.style.top = `${rect.top}px`;
    root.style.bottom = "";
    root.style.transition = "none";
    header.style.cursor = "grabbing";
    header.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  header.addEventListener("pointermove", (event) => {
    if (dragPointerId !== event.pointerId) {
      return;
    }

    const width = root.offsetWidth;
    const height = root.offsetHeight;
    const maxLeft = Math.max(0, window.innerWidth - width);
    const maxTop = Math.max(0, window.innerHeight - height);
    const nextLeft = clamp(event.clientX - dragOffsetX, 0, maxLeft);
    const nextTop = clamp(event.clientY - dragOffsetY, 0, maxTop);

    root.style.left = `${nextLeft}px`;
    root.style.top = `${nextTop}px`;
  });

  header.addEventListener("pointerup", (event) => {
    if (dragPointerId !== event.pointerId) {
      return;
    }

    dragPointerId = null;
    header.style.cursor = "grab";
    header.releasePointerCapture(event.pointerId);
    root.style.transition = "width 180ms ease, padding 180ms ease";
  });

  header.addEventListener("pointercancel", (event) => {
    if (dragPointerId !== event.pointerId) {
      return;
    }

    dragPointerId = null;
    header.style.cursor = "grab";
    root.style.transition = "width 180ms ease, padding 180ms ease";
  });

  startButton.addEventListener("click", async () => {
    if (!interviewActive) {
      interviewActive = true;
      reviewRequested = false;
      hintCount = 0;
      elapsedSeconds = 0;
      sessionStartMs = Date.now();
      timer.textContent = "00:00";
      startButton.textContent = "End Session";
      modeValue.textContent = "On";
      distractionButton.disabled = false;
      hintButton.disabled = false;
      updateReviewButton();
      notes.disabled = false;
      hintText.textContent = "Hints will appear here.";
      followUp.textContent = "";
      reviewText.textContent = "No review yet.";
      status.textContent = assistantConfigured
        ? "Interview session started."
        : "Interview session started. Add your OpenAI API key below to enable hints and review.";
      startTimer();
      notes.focus();
      refreshHintProgress();
      renderCollapsedState();
      return;
    }

    await saveCurrentSession();
    endSession("Session ended and saved locally.");
    await refreshLastSession(lastSessionText);
    await refreshRecentSessions(recentSessionsList);
  });

  distractionButton.addEventListener("click", () => {
    if (!interviewActive) {
      status.textContent = "Start the interview before hiding distractions.";
      return;
    }

    const result = options.onDistractionToggle(!distractionsHidden);
    distractionsHidden = result.hidden;
    distractionButton.textContent = distractionsHidden ? "Show Distractions" : "Hide Distractions";
    status.textContent =
      result.count > 0
        ? `${distractionsHidden ? "Hidden" : "Restored"} ${result.count} distraction section${result.count === 1 ? "" : "s"}.`
        : "No known distraction sections found on this page.";
    renderCollapsedState();
  });

  hintButton.addEventListener("click", async () => {
    if (!interviewActive) {
      status.textContent = "Start the interview before requesting a hint.";
      return;
    }

    hintButton.disabled = true;
    status.textContent = "Generating hint...";
    hintText.textContent = "Generating hint...";
    followUp.textContent = "Preparing follow-up question...";

    try {
      const response = await options.onHintRequest({
        userAttempt: notes.value.trim(),
        hintLevel: hintCount + 1,
        onProgress(partialHint) {
          if (!partialHint.trim()) {
            return;
          }

          hintText.textContent = partialHint;
          followUp.textContent = "Preparing follow-up question...";
          status.textContent = "Streaming hint...";
        }
      });

      hintCount += 1;
      renderHint(response, hintText, followUp);
      status.textContent = `Hint ${hintCount} ready.`;
      refreshHintProgress();
      renderCollapsedState();
    } catch (error) {
      followUp.textContent = "";
      status.textContent = formatErrorMessage(error, "Hint request failed.");
      refreshHintProgress();
      renderCollapsedState();
    }
  });

  reviewButton.addEventListener("click", async () => {
    if (!interviewActive) {
      status.textContent = "Start the interview before requesting review.";
      return;
    }

    reviewButton.disabled = true;
    status.textContent = "Generating basic review...";
    try {
      const editorSnapshot = options.getEditorSnapshot();
      lastEditorSnapshot = editorSnapshot;
      const response = await options.onReviewRequest({
        approach: notes.value.trim(),
        code: editorSnapshot?.code ?? ""
      });

      renderReview(response, reviewText, editorSnapshot);
      reviewRequested = true;
      updateReviewButton();
      await saveCurrentSession();
      status.textContent = editorSnapshot
        ? `Basic review saved using ${formatEditorSource(editorSnapshot.source)}.`
        : "Basic review saved using notes only. Editor code was not detected.";
      await refreshLastSession(lastSessionText);
      await refreshRecentSessions(recentSessionsList);
      renderCollapsedState();
    } catch (error) {
      reviewButton.disabled = false;
      reviewText.textContent = formatErrorMessage(error, "Review request failed.");
      status.textContent = formatErrorMessage(error, "Review request failed.");
      renderCollapsedState();
    }
  });

  notes.addEventListener("input", () => {
    if (notesSaveTimer !== null) {
      window.clearTimeout(notesSaveTimer);
    }

    notesSaveTimer = window.setTimeout(() => {
      void options.onNotesChange(notes.value);
    }, 250);
  });

  resetButton.addEventListener("click", async () => {
    stopTimer();
    if (notesSaveTimer !== null) {
      window.clearTimeout(notesSaveTimer);
      notesSaveTimer = null;
    }
    if (distractionsHidden) {
      options.onDistractionToggle(false);
    }
    interviewActive = false;
    sessionStartMs = null;
    elapsedSeconds = 0;
    hintCount = 0;
    reviewRequested = false;
    distractionsHidden = false;

    await options.onResetLocalData();

    notes.value = "";
    timer.textContent = "00:00";
    modeValue.textContent = "Off";
    startButton.textContent = "Start Interview";
    notes.disabled = true;
    hintButton.disabled = true;
    updateReviewButton();
    distractionButton.disabled = true;
    distractionButton.textContent = "Hide Distractions";
    hintText.textContent = "Start the session to unlock hints.";
    followUp.textContent = "";
    reviewText.textContent = "No review yet.";
    lastEditorSnapshot = null;
    status.textContent = "Local extension data cleared.";

    refreshHintProgress();
    await refreshLastSession(lastSessionText);
    await refreshRecentSessions(recentSessionsList);
    diagnosticsText.textContent = buildDiagnosticsSummary(options.context, options.getEditorSnapshot());
    renderCollapsedState();
  });

  saveSettingsButton.addEventListener("click", async () => {
    saveSettingsButton.disabled = true;
    testSettingsButton.disabled = true;
    clearSettingsButton.disabled = true;
    settingsStatus.textContent = "Saving OpenAI settings...";

    try {
      const summary = await options.onSaveAssistantSettings({
        apiKey: apiKeyInput.value,
        model: modelInput.value
      });
      apiKeyInput.value = "";
      applyAssistantSettings(summary, summary.hasApiKey ? "Settings saved." : "Add an API key to enable hints and review.");
      status.textContent = summary.hasApiKey
        ? "OpenAI settings saved. You can now request hints and review."
        : "OpenAI settings updated, but no API key is saved yet.";
    } catch (error) {
      settingsStatus.textContent = formatErrorMessage(error, "Failed to save OpenAI settings.");
    } finally {
      saveSettingsButton.disabled = false;
      testSettingsButton.disabled = false;
      clearSettingsButton.disabled = false;
    }
  });

  testSettingsButton.addEventListener("click", async () => {
    testSettingsButton.disabled = true;
    saveSettingsButton.disabled = true;
    clearSettingsButton.disabled = true;
    settingsStatus.textContent = "Testing OpenAI connection...";

    try {
      const result = await options.onTestAssistantConnection();
      settingsStatus.textContent = result.message;
      modelInput.value = result.model;
      status.textContent = result.ok
        ? `OpenAI ready with ${result.model}.`
        : result.message;
    } catch (error) {
      settingsStatus.textContent = formatErrorMessage(error, "OpenAI connection test failed.");
    } finally {
      testSettingsButton.disabled = false;
      saveSettingsButton.disabled = false;
      clearSettingsButton.disabled = false;
    }
  });

  clearSettingsButton.addEventListener("click", async () => {
    clearSettingsButton.disabled = true;
    saveSettingsButton.disabled = true;
    testSettingsButton.disabled = true;
    settingsStatus.textContent = "Clearing saved API key...";

    try {
      const summary = await options.onClearAssistantSettings();
      apiKeyInput.value = "";
      applyAssistantSettings(summary, "Saved API key cleared.");
      status.textContent = "OpenAI key cleared from this Chrome profile.";
    } catch (error) {
      settingsStatus.textContent = formatErrorMessage(error, "Failed to clear OpenAI settings.");
    } finally {
      clearSettingsButton.disabled = false;
      saveSettingsButton.disabled = false;
      testSettingsButton.disabled = false;
    }
  });

  collapseButton.addEventListener("click", () => {
    collapsed = !collapsed;
    applyCollapsedLayout();
  });

  body.append(
    modeCard,
    controls,
    settingsCard,
    timerCard,
    hintUsageCard,
    notesLabel,
    notes,
    notesMeta,
    actions,
    hintCard,
    reviewCard,
    recentSessionsCard,
    lastSessionCard,
    diagnosticsCard,
    utilities,
    status
  );

  root.append(header, collapsedSummary, body);
  container.append(root);

  return {
    async destroy() {
      if (interviewActive) {
        await saveCurrentSession();
      }

      if (notesSaveTimer !== null) {
        window.clearTimeout(notesSaveTimer);
        notesSaveTimer = null;
      }

      if (distractionsHidden) {
        options.onDistractionToggle(false);
      }

      header.style.cursor = "grab";
      stopTimer();
      root.remove();
    }
  };

  async function hydrate(): Promise<void> {
    const [savedNotes, assistantSettings] = await Promise.all([
      options.loadNotes(),
      options.loadAssistantSettings(),
      refreshLastSession(lastSessionText),
      refreshRecentSessions(recentSessionsList)
    ]);
    notes.value = savedNotes;
    applyAssistantSettings(assistantSettings);
    refreshHintProgress();
    diagnosticsText.textContent = buildDiagnosticsSummary(options.context, options.getEditorSnapshot());
    renderCollapsedState();
    applyCollapsedLayout();
  }

  function applyAssistantSettings(summary: AssistantSettingsSummary, message?: string): void {
    assistantConfigured = summary.hasApiKey;
    modelInput.value = summary.model;
    apiKeyInput.placeholder = summary.hasApiKey
      ? `Saved key: ${summary.apiKeyLabel ?? "Saved"}`
      : "Paste your OpenAI API key";
    settingsSummary.textContent = summary.hasApiKey
      ? `Using ${summary.model} with ${summary.apiKeyLabel ?? "a saved key"}.`
      : "No API key saved yet.";
    settingsStatus.textContent =
      message ??
      (summary.hasApiKey
        ? "Hints and review are ready to use."
        : "Save your API key to enable hints and review.");
    updateHintButton();
    updateReviewButton();
  }

  function refreshHintProgress(): void {
    const nextLevel = hintCount + 1;
    hintUsageValue.textContent =
      hintCount === 0 ? "No hints used yet. Next hint: Level 1." : `${hintCount} used. Next hint: ${formatHintLevel(nextLevel)}.`;
    hintUsageMeta.textContent =
      assistantConfigured
        ? "Hints are unlimited. Level 1 nudges, Level 2 patterns, Level 3+ stronger direction."
        : "Add your OpenAI API key below to unlock unlimited hints and review.";
    updateHintButton();
    renderCollapsedState();
  }

  async function refreshLastSession(target: HTMLElement): Promise<void> {
    const lastSession = await options.loadLastSessionSummary();
    if (!lastSession) {
      target.textContent = "No saved session yet.";
      return;
    }

    target.textContent = formatSessionSummary(lastSession);
  }

  async function refreshRecentSessions(target: HTMLElement): Promise<void> {
    const history = await options.loadSessionHistory();
    target.replaceChildren();

    if (history.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No recent sessions saved yet.";
      empty.style.margin = "0";
      empty.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
      empty.style.fontSize = "13px";
      empty.style.lineHeight = "1.5";
      empty.style.color = "#667085";
      target.append(empty);
      return;
    }

    for (const session of history.slice(0, 4)) {
      const item = document.createElement("p");
      item.textContent = formatSessionSummary(session);
      item.style.margin = "0 0 10px";
      item.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
      item.style.fontSize = "12px";
      item.style.lineHeight = "1.5";
      item.style.color = "#475467";
      target.append(item);
    }
  }

  async function saveCurrentSession(): Promise<void> {
    const summary = buildSessionSummary();
    await options.onSessionComplete(summary);
  }

  function buildSessionSummary(): SessionSummary {
    const startedAt = sessionStartMs ? new Date(sessionStartMs).toISOString() : new Date().toISOString();
    const endedAt = new Date().toISOString();
    const durationSeconds = sessionStartMs
      ? Math.max(0, Math.floor((Date.now() - sessionStartMs) / 1000))
      : elapsedSeconds;

    return {
      problemUrl: options.context.problemUrl,
      problemTitle: options.context.problemTitle,
      difficulty: options.context.difficulty,
      startedAt,
      endedAt,
      durationSeconds,
      modeEnabled: interviewActive,
      hintCount,
      reviewRequested,
      notesPreview: notes.value.trim().slice(0, 140)
    };
  }

  function startTimer(): void {
    stopTimer();
    intervalId = window.setInterval(() => {
      if (!sessionStartMs) {
        return;
      }

      elapsedSeconds = Math.max(0, Math.floor((Date.now() - sessionStartMs) / 1000));
      timer.textContent = formatElapsed(elapsedSeconds);
    }, 1000);
  }

  function stopTimer(): void {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  function endSession(message: string): void {
    interviewActive = false;
    stopTimer();
    sessionStartMs = null;
    startButton.textContent = "Start Interview";
    modeValue.textContent = "Off";
    notes.disabled = true;
    lastEditorSnapshot = null;
    hintButton.disabled = true;
    updateReviewButton();
    distractionButton.disabled = true;
    if (distractionsHidden) {
      options.onDistractionToggle(false);
      distractionsHidden = false;
      distractionButton.textContent = "Hide Distractions";
    }
    status.textContent = message;
    renderCollapsedState();
  }

  function updateHintButton(): void {
    hintButton.textContent = assistantConfigured
      ? `Get ${formatHintLevel(hintCount + 1)} Hint`
      : "Add API Key for Hints";
    hintButton.disabled = !(interviewActive && assistantConfigured);
  }

  function updateReviewButton(): void {
    if (!interviewActive) {
      reviewButton.textContent = "Review My Attempt";
      reviewButton.disabled = true;
      return;
    }

    reviewButton.textContent = assistantConfigured
      ? reviewRequested
        ? "Review My Attempt Again"
        : "Review My Attempt"
      : "Add API Key for Review";
    reviewButton.disabled = !assistantConfigured;
  }

  function applyCollapsedLayout(): void {
    body.style.display = collapsed ? "none" : "";
    collapsedSummary.style.display = collapsed ? "" : "none";
    titleGroup.style.display = collapsed ? "none" : "";
    title.style.fontSize = collapsed ? "18px" : "28px";
    collapseButton.textContent = collapsed ? "Expand" : "Collapse";
    collapseButton.style.minWidth = collapsed ? "72px" : "90px";
    header.style.marginBottom = collapsed ? "10px" : "14px";
    root.style.width = collapsed ? "170px" : "360px";
    root.style.padding = collapsed ? "14px" : "18px";
    renderCollapsedState();
  }

  function renderCollapsedState(): void {
    collapsedModeValue.textContent = interviewActive ? "Interview Active" : "Ready";
    collapsedTimer.textContent = timer.textContent;
    collapsedHints.textContent = interviewActive
      ? `${hintCount} hint${hintCount === 1 ? "" : "s"} used this session${reviewRequested ? " • reviewed" : ""}`
      : reviewRequested
        ? "Last action: review saved"
        : "Panel collapsed";
  }
}

function formatElapsed(totalSeconds: number): string {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatHintLevel(level: number): string {
  if (level <= 1) {
    return "Level 1";
  }

  if (level === 2) {
    return "Level 2";
  }

  return "Level 3+";
}

function createButton(label: string, variant: "primary" | "secondary"): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.style.borderRadius = "999px";
  button.style.padding = "12px 14px";
  button.style.border = variant === "primary" ? "none" : "1px solid #d0d5dd";
  button.style.cursor = "pointer";
  button.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  button.style.fontWeight = "600";
  button.style.fontSize = "13px";
  button.style.background = variant === "primary" ? "#111827" : "rgba(255, 255, 255, 0.9)";
  button.style.color = variant === "primary" ? "#f9fafb" : "#1f2937";
  return button;
}

function createTextInput(type: "text" | "password", placeholder: string): HTMLInputElement {
  const input = document.createElement("input");
  input.type = type;
  input.placeholder = placeholder;
  input.style.width = "100%";
  input.style.boxSizing = "border-box";
  input.style.border = "1px solid #d0d5dd";
  input.style.borderRadius = "12px";
  input.style.padding = "10px 12px";
  input.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  input.style.fontSize = "13px";
  input.style.background = "rgba(255, 255, 255, 0.9)";
  input.style.color = "#1f2937";
  return input;
}

function createCard(): HTMLDivElement {
  const card = document.createElement("div");
  card.style.borderRadius = "16px";
  card.style.padding = "12px 14px";
  card.style.background = "rgba(255, 255, 255, 0.72)";
  card.style.border = "1px solid rgba(208, 213, 221, 0.9)";
  return card;
}

function createMetaLabel(text: string): HTMLParagraphElement {
  const label = document.createElement("p");
  label.textContent = text.toUpperCase();
  label.style.margin = "0";
  label.style.fontSize = "10px";
  label.style.letterSpacing = "0.14em";
  label.style.fontWeight = "700";
  label.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
  label.style.color = "#9a6700";
  return label;
}

function renderHint(response: HintResponse, hintText: HTMLElement, followUp: HTMLElement): void {
  hintText.textContent = response.hint;
  followUp.textContent = response.followUpQuestion;
}

function renderReview(
  response: ReviewResponse,
  reviewText: HTMLElement,
  editorSnapshot: EditorSnapshot | null
): void {
  const reviewSource = editorSnapshot
    ? `Notes plus code from ${escapeHtml(formatEditorSource(editorSnapshot.source))}`
    : "Notes only. Editor code was not detected.";

  reviewText.innerHTML = [
    `<strong>Source:</strong> ${reviewSource}`,
    `<strong>Clarity:</strong> ${escapeHtml(response.clarityFeedback)}`,
    `<strong>Time:</strong> ${escapeHtml(response.timeComplexity)}`,
    `<strong>Space:</strong> ${escapeHtml(response.spaceComplexity)}`,
    `<strong>Improve:</strong> ${escapeHtml(response.improvementSuggestion)}`
  ].join("<br /><br />");
}

function formatSessionSummary(summary: SessionSummary): string {
  const duration = formatElapsed(summary.durationSeconds ?? 0);
  const difficulty = summary.difficulty ? ` • ${summary.difficulty}` : "";
  const reviewState = summary.reviewRequested ? "reviewed" : "not reviewed";
  return `${summary.problemTitle}${difficulty} • ${duration} • ${summary.hintCount} hint${summary.hintCount === 1 ? "" : "s"} • ${reviewState}`;
}

function buildDiagnosticsSummary(context: ProblemContext, editorSnapshot: EditorSnapshot | null): string {
  const difficulty = context.difficulty ?? "Unknown difficulty";
  const url = new URL(context.problemUrl);
  const editorStatus = editorSnapshot
    ? `Editor detected via ${formatEditorSource(editorSnapshot.source)}.`
    : "Editor code not detected yet.";
  return `Detected ${difficulty}. Tracking notes and session data locally for ${url.pathname}. ${editorStatus}`;
}

function formatEditorSource(source: EditorSnapshot["source"]): string {
  switch (source) {
    case "monaco-model":
      return "Monaco model";
    case "textarea":
      return "editor textarea";
    case "code-block":
      return "editor code block";
    case "visible-lines":
      return "visible editor lines";
    default:
      return "editor fallback";
  }
}

function formatErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
