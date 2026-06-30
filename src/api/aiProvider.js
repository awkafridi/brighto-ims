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

// ── Unified entry point ──────────────────────────────────────────────────────
// Strips markdown code fences that some models wrap JSON in.
function cleanJsonResponse(text) {
  return text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
}

/**
 * Call the currently active AI provider.
 * @param {string} systemPrompt - instructions for the model
 * @param {string} userText - the user's message/request
 * @param {string|null} imageBase64 - optional base64 image data (OCR only; only Gemini & Claude support vision)
 * @returns {Promise<string>} cleaned text response (JSON string expected by callers)
 */
export async function callAI(systemPrompt, userText, imageBase64 = null) {
  // Claude works for free automatically inside Claude.ai — prefer it if no key is set anywhere
  if (CLAUDE_AVAILABLE && !hasAnyKeyConfigured()) {
    const text = await callClaudeBuiltIn(systemPrompt, userText, imageBase64);
    return cleanJsonResponse(text);
  }

  const providerId = getActiveProvider();
  const apiKey = getApiKey(providerId);

  if (!apiKey) {
    if (CLAUDE_AVAILABLE) {
      const text = await callClaudeBuiltIn(systemPrompt, userText, imageBase64);
      return cleanJsonResponse(text);
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
      text = await callGemini(apiKey, systemPrompt, userText, imageBase64);
      break;
    case 'grok':
      text = await callGrok(apiKey, systemPrompt, userText);
      break;
    case 'deepseek':
      text = await callDeepSeek(apiKey, systemPrompt, userText);
      break;
    case 'openchat':
      text = await callOpenChat(apiKey, systemPrompt, userText);
      break;
    default:
      throw new AIUnavailableError(`Unknown provider: ${providerId}`);
  }
  return cleanJsonResponse(text);
}

export function isAIAvailable() {
  return CLAUDE_AVAILABLE || hasAnyKeyConfigured();
}
