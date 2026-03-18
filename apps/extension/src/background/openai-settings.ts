import type {
  AssistantSettingsSummary,
  SaveAssistantSettingsInput
} from "@leetcode-interviewer/shared";

const SETTINGS_KEY = "leetcode-interviewer:assistant-settings";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

type StoredAssistantSettings = {
  apiKey: string;
  model: string;
};

export async function loadAssistantSettings(): Promise<StoredAssistantSettings> {
  const result = await chrome.storage?.local?.get?.(SETTINGS_KEY);
  const stored = result?.[SETTINGS_KEY];

  if (!isStoredAssistantSettings(stored)) {
    return {
      apiKey: "",
      model: DEFAULT_OPENAI_MODEL
    };
  }

  return {
    apiKey: stored.apiKey.trim(),
    model: stored.model.trim() || DEFAULT_OPENAI_MODEL
  };
}

export async function loadAssistantSettingsSummary(): Promise<AssistantSettingsSummary> {
  const settings = await loadAssistantSettings();
  return toAssistantSettingsSummary(settings);
}

export async function saveAssistantSettings(
  input: SaveAssistantSettingsInput
): Promise<AssistantSettingsSummary> {
  const current = await loadAssistantSettings();
  const nextSettings: StoredAssistantSettings = {
    apiKey: input.apiKey.trim() || current.apiKey,
    model: input.model.trim() || DEFAULT_OPENAI_MODEL
  };

  await chrome.storage?.local?.set?.({
    [SETTINGS_KEY]: nextSettings
  });

  return toAssistantSettingsSummary(nextSettings);
}

export async function clearAssistantSettings(): Promise<AssistantSettingsSummary> {
  await chrome.storage?.local?.remove?.(SETTINGS_KEY);
  return {
    hasApiKey: false,
    apiKeyLabel: null,
    model: DEFAULT_OPENAI_MODEL
  };
}

function toAssistantSettingsSummary(settings: StoredAssistantSettings): AssistantSettingsSummary {
  return {
    hasApiKey: Boolean(settings.apiKey),
    apiKeyLabel: settings.apiKey ? maskApiKey(settings.apiKey) : null,
    model: settings.model || DEFAULT_OPENAI_MODEL
  };
}

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 10) {
    return "Saved";
  }

  return `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`;
}

function isStoredAssistantSettings(value: unknown): value is StoredAssistantSettings {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.apiKey === "string" && typeof candidate.model === "string";
}
