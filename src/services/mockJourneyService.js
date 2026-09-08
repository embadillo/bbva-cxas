import { initialJourney } from '../data/mockJourney';

const STORAGE_KEY = 'bbvaDemoStateV1';

export function loadDemoState() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? { ...initialJourney, ...JSON.parse(stored) } : structuredClone(initialJourney);
  } catch {
    return structuredClone(initialJourney);
  }
}

export function saveDemoState(state) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* demo continuity is optional */ }
  return state;
}

export function resetBBVADemo() {
  const state = structuredClone(initialJourney);
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* optional */ }
  return state;
}

export function updateDemoState(state, patch) {
  return saveDemoState({ ...state, ...patch });
}
