export function normalizeConversationResponse(response = {}) {
  return {
    text: typeof response.text === 'string' ? response.text : '',
    payloads: Array.isArray(response.payloads) ? response.payloads : [],
    sessionUpdates: response.sessionUpdates && typeof response.sessionUpdates === 'object' ? response.sessionUpdates : {},
    metadata: response.metadata && typeof response.metadata === 'object' ? response.metadata : {},
    error: response.error ?? null,
  };
}
