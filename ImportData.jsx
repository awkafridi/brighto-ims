// Unified AI provider layer — lets the user pick between free AI APIs in Settings.
// Each provider has a free tier:
//   - Gemini:    Google AI Studio free tier (generous, supports vision for OCR)
//   - Grok:      xAI free tier via console.x.ai
//   - DeepSeek:  platform.deepseek.com free tier (text only, no vision)
//   - OpenChat:  via OpenRouter.ai free models (text only, no vision)
//
// Keys are stored in localStorage only — never sent anywhere except directly
// to each provider's official API from the user's own browser.

export const PROVIDERS = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '✨',
    supportsVision: true,
    keyLabel: 'Gemini API Key',
    keyHelp: 'Get a free key at aistudio.google.com/apikey',
    keyPlaceholder: 'AIzaSy...',
  },
  grok: {
    id: 'grok',
    name: 'xAI Grok',
    icon: '🤖',
    supportsVision: false,
    keyLabel: 'Grok API Key',
    keyHelp: 'Get a free key at console.x.ai',
    keyPlaceholder: 'xai-...',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🔍',
    supportsVision: false,
    keyLabel: 'DeepSeek API Key',
    keyHelp: 'Get a free key at platform.deepseek.com',
    keyPlaceholder: 'sk-...',
  },
  openchat: {
    id: 'openchat',
    name: 'OpenChat (via OpenRouter)',
    icon: '💬',
    supportsVision: false,
    keyLabel: 'OpenRouter API Key',
    keyHelp: 'Get a free key at openrouter.ai/keys (select free OpenChat model)',
    keyPlaceholder: 'sk-or-...',
  },
};

const STORAGE_PREFIX = 'ims_ai_key_';
const ACTIVE_PROVIDER_KEY = 'ims_ai_active_provider';

export function getActiveProvider() {
  return localStorage.getItem(ACTIVE_PROVIDER_KEY) || 'gemini';
}

export function setActiveProvider(id) {
  localStorage.setItem(ACTIVE_PROVIDER_KEY, id);
}

export function getApiKey(providerId) {
  return localStorage.getItem(STORAGE_PREFIX + providerId) || '';
}

export function setApiKey(providerId, key) {
  localStorage.setItem(STORAGE_PREFIX + providerId, key);
}

export function hasAnyKeyConfigured() {
  return Object.keys(PROVIDERS).some(id => getApiKey(id));
}

export class AIUnavailableError extends Error {}

// ── Provider-specific call implementations ─────────────────────────────────────

async function callGemini(apiKey, systemPrompt, userText, imageBase64) {
  const parts = [{ text: userText }];
  if (imageBase64) {
    parts.unshift({ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } });
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts }],
        generationConfig: { temperature: 0.2 },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callGrok(apiKey, systemPrompt, userText) {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-2-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Grok error: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callDeepSeek(apiKey, systemPrompt, userText) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek error: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callOpenChat(apiKey, systemPrompt, userText) {
  // OpenRouter hosts a free OpenChat model — openchat/openchat-7b:free
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'openchat/openchat-7b:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenChat error: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── Claude (works only inside Claude.ai artifacts, free, no key needed) ────────
const CLAUDE_AVAILABLE = typeof window !== 'undefined' && window.location.hostname.includes('claude');

async function callClaudeBuiltIn(systemPrompt, userText, imageBase64) {
  const content = imageBase64
    ? [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } }, { type: 'text', text: userText }]
    : userText;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

// Strips markdown code fences and any stray prose some models add despite instructions,
// then extracts just the {...} JSON object from anywhere in the text.
function cleanJsonResponse(text) {
  if (!text) return '{}';
  let cleaned = text.trim();

  // Remove markdown code fences (```json ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  // If there's still leading/trailing prose, extract from the first { to the last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

// Validates that a string actually parses as JSON, throws a clear error if not —
// callers can catch AIParseError specifically to show "try again" messaging.
export class AIParseError extends Error {
  constructor(rawText) {
    super('AI response was not valid JSON');
    this.rawText = rawText;
  }
}

function parseOrThrow(cleanedText) {
  try {
    return JSON.parse(cleanedText);
  } catch (e) {
    throw new AIParseError(cleanedText);
  }
}

/**
 * Call the currently active AI provider.
 * @param {string} systemPrompt - instructions for the model
 * @param {string} userText - the user's message/request
 * @param {string|null} imageBase64 - optional base64 image data (OCR only; only Gemini & Claude support vision)
 * @returns {Promise<object>} parsed JSON object
 */
export async function callAI(systemPrompt, userText, imageBase64 = null) {
  // Reinforce JSON-only output — appended to every system prompt regardless of provider,
  // since smaller free models (DeepSeek, OpenChat) often ignore a single instruction.
  const strictSystemPrompt = `${systemPrompt}

CRITICAL: Respond with ONLY the raw JSON object. No markdown code fences, no backticks, no explanation before or after, no "Here is the JSON:" preamble. Your entire response must start with { and end with }.`;

  // Claude works for free automatically inside Claude.ai — prefer it if no key is set anywhere
  if (CLAUDE_AVAILABLE && !hasAnyKeyConfigured()) {
    const text = await callClaudeBuiltIn(strictSystemPrompt, userText, imageBase64);
    return parseOrThrow(cleanJsonResponse(text));
  }

  const providerId = getActiveProvider();
  const apiKey = getApiKey(providerId);

  if (!apiKey) {
    if (CLAUDE_AVAILABLE) {
      const text = await callClaudeBuiltIn(strictSystemPrompt, userText, imageBase64);
      return parseOrThrow(cleanJsonResponse(text));
    }
    throw new AIUnavailableError(
      `No API key configured for ${PROVIDERS[providerId]?.name || providerId}. Add a free key in Settings → AI Provider.`
    );
  }

  if (imageBase64 && !PROVIDERS[providerId].supportsVision) {
    throw new AIUnavailableError(
      `${PROVIDERS[providerId].name} doesn't support image scanning (OCR). Switch to Gemini in Settings for invoice scanning, or use ${PROVIDERS[providerId].name} for voice commands only.`
    );
  }

  let text;
  switch (providerId) {
    case 'gemini':
      text = await callGemini(apiKey, strictSystemPrompt, userText, imageBase64);
      break;
    case 'grok':
      text = await callGrok(apiKey, strictSystemPrompt, userText);
      break;
    case 'deepseek':
      text = await callDeepSeek(apiKey, strictSystemPrompt, userText);
      break;
    case 'openchat':
      text = await callOpenChat(apiKey, strictSystemPrompt, userText);
      break;
    default:
      throw new AIUnavailableError(`Unknown provider: ${providerId}`);
  }

  if (!text || !text.trim()) {
    throw new AIUnavailableError(
      `${PROVIDERS[providerId]?.name || providerId} returned an empty response. The free tier may be rate-limited right now — wait a moment and try again, or switch providers in Settings.`
    );
  }

  return parseOrThrow(cleanJsonResponse(text));
}

export function isAIAvailable() {
  return CLAUDE_AVAILABLE || hasAnyKeyConfigured();
}
