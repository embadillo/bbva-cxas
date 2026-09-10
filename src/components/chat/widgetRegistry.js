const widgetAliases = {
  quick_actions: 'quick_actions',
  product_comparison: 'bbva_comparison',
  bbva_comparison: 'bbva_comparison',
  'bbva-comparison': 'bbva_comparison',
  trip_estimate: 'trip_estimate',
  application_summary: 'application_summary',
  activation: 'activation',
  marketplace: 'marketplace',
};

const menuIcons = {
  card: 'card',
  cards: 'card',
  account: 'account',
  accounts: 'account',
  lock: 'lock',
  claim: 'claim',
  document: 'claim',
  shield: 'shield',
  products: 'products',
  grid: 'products',
};

const wrapperKeys = ['payload', 'customPayload', 'data', 'json'];

function parseJson(value) {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return null; }
}

export function normalizeAction(action = {}) {
  return {
    label: String(action.content ?? action.label ?? ''),
    description: String(action.description ?? ''),
    utterance: String(action.utterance ?? action.value ?? action.content ?? action.label ?? ''),
    icon: action.icon ?? null,
  };
}

export function resolveWidgetType(payload, metadata = {}) {
  const candidateType = metadata.functionName || metadata.toolName || metadata.name || payload?.type || payload?.name;
  return widgetAliases[String(candidateType || '').toLowerCase()] || null;
}

export function normalizeWidgetPayload(rawOutput, metadata = {}) {
  if (!rawOutput || typeof rawOutput !== 'object') return null;
  let candidate = rawOutput;
  for (const key of wrapperKeys) {
    const parsed = parseJson(candidate?.[key]);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      candidate = parsed;
      break;
    }
  }

  if (candidate.type === 'custom_template' && candidate.payload && typeof candidate.payload === 'object' && !Array.isArray(candidate.payload)) {
    candidate = {
      ...candidate.payload,
      copy: candidate.payload.copy,
      summary: candidate.summary,
      turnIndex: candidate.turnIndex,
    };
  }

  const merged = { ...candidate };
  if (rawOutput.summary && !merged.summary) merged.summary = rawOutput.summary;
  if (rawOutput.turnIndex !== undefined && merged.turnIndex === undefined) merged.turnIndex = rawOutput.turnIndex;
  const resolvedType = resolveWidgetType(merged, {
    ...metadata,
    functionName: rawOutput.functionName || rawOutput.function?.name || rawOutput.toolName || metadata.functionName,
  });
  if (!resolvedType) return null;
  return { ...merged, copy: merged.copy, type: resolvedType };
}

export function getActionIcon(action) {
  const value = String(action?.icon || '').toLowerCase();
  return menuIcons[value] || null;
}

export function isKnownWidgetPayload(payload) {
  return Boolean(resolveWidgetType(payload));
}

export const canonicalWidgetTypes = [...new Set(Object.values(widgetAliases))];
