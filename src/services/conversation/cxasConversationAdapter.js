import { normalizeConversationResponse } from './normalizeConversationResponse';
import { runtime } from '../../config/runtime';
import { sendCXASTurn } from './cxasClient';
import { normalizeWidgetPayload, resolveWidgetType } from '../../components/chat/widgetRegistry';

let lastResponse = { signature: '', time: 0 };

function parseJson(value) {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return null; }
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce((result, key) => {
    result[key] = stableValue(value[key]);
    return result;
  }, {});
}

function stableSignature(value) {
  return JSON.stringify(stableValue(value));
}

function extractText(output) {
  if (typeof output === 'string') return output;
  return output?.text || output?.content?.text || output?.message?.text || output?.fulfillmentText || '';
}

function isControlOnly(output, text, payload) {
  if (text.trim() || payload) return false;
  return output?.turnCompleted === true || output?.type === 'turnCompleted' || output?.type === 'turn_completed';
}

function normalizeOutputs(outputs) {
  const seen = new Set();
  return outputs.map((rawOutput) => {
    const output = parseJson(rawOutput);
    if (!output || (typeof output !== 'object' && typeof output !== 'string')) return null;
    const text = String(extractText(output) || '').trim();
    const payload = normalizeWidgetPayload(output, {
      functionName: output.functionName || output.function?.name || output.toolName || output.name,
    });
    if (isControlOnly(output, text, payload)) return null;
    if (!text && !payload && import.meta.env.DEV && (output.payload || output.customPayload || output.data || output.json || output.functionName || output.toolName)) {
      console.warn('[BBVA] Unrecognized CXAS structured output ignored', output);
    }
    if (!text && !payload) return null;
    const turnIndex = output.turnIndex ?? payload?.turnIndex ?? 'unknown';
    const widgetType = payload ? resolveWidgetType(payload) : null;
    const signature = payload
      ? `${turnIndex}:${widgetType}:${stableSignature(payload)}`
      : `${turnIndex}:text:${text.replace(/\s+/g, ' ')}`;
    if (seen.has(signature)) return null;
    seen.add(signature);
    return { text, payload };
  }).filter(Boolean);
}

export async function sendCXASConversationTurn(text) {
  if (runtime.conversationMode !== 'cxas') {
    return normalizeConversationResponse({ error: 'CXAS mode is not active.' });
  }
  try {
    const result = await sendCXASTurn(String(text || '').trim());
    const outputs = Array.isArray(result?.outputs) ? result.outputs : [];
    const responseSignature = stableSignature(outputs);
    const now = Date.now();
    if (responseSignature && responseSignature === lastResponse.signature && now - lastResponse.time < 800) {
      return normalizeConversationResponse({ sessionUpdates: result?.sessionUpdates || {}, metadata: { source: 'cxas', duplicate: true } });
    }
    lastResponse = { signature: responseSignature, time: now };
    const normalized = normalizeOutputs(outputs);
    const responseText = normalized.map((output) => output.text).filter(Boolean).join('\n').trim();
    const payloads = normalized.map((output) => output.payload).filter(Boolean);
    if (!responseText && !payloads.length) return normalizeConversationResponse({ sessionUpdates: result?.sessionUpdates || {}, metadata: { source: 'cxas', controlOnly: true } });
    return normalizeConversationResponse({
      text: responseText,
      payloads,
      sessionUpdates: result?.sessionUpdates || {},
      metadata: { source: 'cxas' },
    });
  } catch (error) {
    if (import.meta.env.DEV) console.error('[CXAS] conversation turn failed', error);
    return normalizeConversationResponse({
      error: 'Estoy teniendo un problema para responder en este momento. Probá de nuevo en unos segundos.',
    });
  }
}

export function resetCXASResponseGuard() {
  lastResponse = { signature: '', time: 0 };
}
