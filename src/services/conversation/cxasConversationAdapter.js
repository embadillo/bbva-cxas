import { normalizeConversationResponse } from './normalizeConversationResponse';
import { runtime } from '../../config/runtime';
import { sendCXASTurn } from './cxasClient';

function outputText(output) {
  if (typeof output === 'string') return output;
  return output?.text || output?.content?.text || output?.message?.text || output?.fulfillmentText || '';
}

function outputPayload(output) {
  if (!output || typeof output !== 'object') return null;
  if (output.payload && typeof output.payload === 'object') return output.payload;
  if (output.type && ['quick_actions', 'product_comparison', 'application_summary', 'activation', 'marketplace', 'trip_estimate'].includes(output.type)) return output;
  return null;
}

export async function sendCXASConversationTurn(text) {
  if (runtime.conversationMode !== 'cxas') {
    return normalizeConversationResponse({ error: 'CXAS mode is not active.' });
  }
  try {
    const result = await sendCXASTurn(String(text || '').trim());
    const outputs = Array.isArray(result?.outputs) ? result.outputs : [];
    const text = outputs.map(outputText).filter(Boolean).join('\n').trim();
    const payloads = outputs.map(outputPayload).filter(Boolean);
    if (!text && !payloads.length) {
      return normalizeConversationResponse({
        error: 'Estoy teniendo un problema para responder en este momento. Probá de nuevo en unos segundos.',
      });
    }
    return normalizeConversationResponse({
      text,
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
