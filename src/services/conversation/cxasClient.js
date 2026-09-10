import { runtime } from '../../config/runtime';
import { createElement } from 'react';

let messenger = null;
let registrationPromise = null;
let interceptorInstalled = false;
let pendingTurn = null;
let sessionGeneration = 0;

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function logDevelopment(...args) {
  if (import.meta.env.DEV) console.warn('[CXAS]', ...args);
}

function getMessenger() {
  return document.querySelector('chat-messenger');
}

function extractOutputs(data) {
  if (Array.isArray(data?.outputs)) return data.outputs;
  if (Array.isArray(data?.messages)) return data.messages;
  return [];
}

function installResponseInterceptor() {
  if (interceptorInstalled || typeof window === 'undefined') return;
  interceptorInstalled = true;
  const originalFetch = window.fetch;
  window.fetch = function cxasFetch(url, options) {
    const request = originalFetch.apply(this, arguments);
    const urlString = typeof url === 'string' ? url : url?.url || '';
    if (urlString.includes('runSession')) {
      request.then((response) => {
        response.clone().json().then((data) => {
          if (!pendingTurn) return;
          const current = pendingTurn;
          pendingTurn = null;
          current.resolve({ outputs: extractOutputs(data), sessionUpdates: data?.sessionInfo || {} });
        }).catch((error) => {
          if (!pendingTurn) return;
          const current = pendingTurn;
          pendingTurn = null;
          current.reject(error);
        });
      }).catch((error) => {
        if (!pendingTurn) return;
        const current = pendingTurn;
        pendingTurn = null;
        current.reject(error);
      });
    }
    return request;
  };
}

async function waitForMessenger(timeoutMs = 6000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const candidate = getMessenger();
    if (candidate && typeof candidate.sendQuery === 'function') return candidate;
    await sleep(50);
  }
  throw new Error('CXAS SDK messenger is not ready.');
}

export async function ensureCXASReady() {
  if (!runtime.cxas.deploymentName) throw new Error('CXAS deployment is not configured.');
  installResponseInterceptor();
  if (registrationPromise) return registrationPromise;
  registrationPromise = (async () => {
    const readyMessenger = await waitForMessenger();
    messenger = readyMessenger;
    if (window.chatSdk?.registerContext) {
      window.chatSdk.registerContext(window.chatSdk.prebuilts.ces.createContext({
        deploymentName: runtime.cxas.deploymentName,
        tokenBroker: { enableTokenBroker: true, enableRecaptcha: false },
      }));
    } else {
      await new Promise((resolve, reject) => {
        const onLoaded = () => {
          try {
            window.chatSdk.registerContext(window.chatSdk.prebuilts.ces.createContext({
              deploymentName: runtime.cxas.deploymentName,
              tokenBroker: { enableTokenBroker: true, enableRecaptcha: false },
            }));
            resolve();
          } catch (error) { reject(error); }
        };
        window.addEventListener('chat-messenger-loaded', onLoaded, { once: true });
        setTimeout(() => reject(new Error('CXAS SDK did not load.')), 6000);
      });
    }
    return messenger;
  })().catch((error) => {
    registrationPromise = null;
    throw error;
  });
  return registrationPromise;
}

export async function sendCXASTurn(text) {
  const currentGeneration = sessionGeneration;
  const readyMessenger = await ensureCXASReady();
  if (pendingTurn) throw new Error('A CXAS turn is already in progress.');
  const response = new Promise((resolve, reject) => {
    pendingTurn = { resolve, reject, generation: currentGeneration };
  });
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('CXAS turn timed out.')), 15000);
  });
  try {
    await readyMessenger.sendQuery(text);
    const result = await Promise.race([response, timeout]);
    return result;
  } catch (error) {
    if (pendingTurn) pendingTurn = null;
    throw error;
  }
}

export function resetCXASSession() {
  sessionGeneration += 1;
  if (pendingTurn) {
    pendingTurn.reject(new Error('CXAS session reset.'));
    pendingTurn = null;
  }
  try { messenger?.resetSession?.(); } catch (error) { logDevelopment('resetSession failed', error); }
  registrationPromise = null;
}

export function CxasSdkHost() {
  if (runtime.conversationMode !== 'cxas') return null;
  return createElement(
    'div',
    { className: 'cxas-sdk-host', 'aria-hidden': 'true' },
    createElement('chat-messenger', {
      id: 'bbva-cxas-messenger',
      'url-allowlist': '*',
      'language-code': 'es',
      'max-query-length': '-1',
    }, createElement('chat-messenger-container', { 'chat-title': 'Azul' },
      createElement('chat-reset-session-button', { slot: 'titlebar-actions', 'title-text': 'Nueva conversación' })
    ))
  );
}
