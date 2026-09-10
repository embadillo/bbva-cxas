import { useCallback, useEffect, useRef, useState } from 'react';
import { sendConversationTurn } from '../../services/conversation/conversationService';
import { createElevenLabsPlayer } from '../../services/tts/elevenLabsTTS';
import { normalizeForTTS } from '../../services/tts/speechNormalization';
import { createMockMarketplacePurchase } from '../../services/mockBankingService';
import { loadDemoState, resetBBVADemo, saveDemoState } from '../../services/mockJourneyService';
import { resetCXASSession, subscribeCXASWelcome } from '../../services/conversation/cxasClient';
import { normalizeCXASResponseOutputs, resetCXASResponseGuard } from '../../services/conversation/cxasConversationAdapter';
import { mockProducts } from '../../data/mockProducts';
import assistantMark from '../../assets/brand/cropped_circle_image.png';
import AzulMainMenu from './AzulMainMenu';
import BBVAComparison from './BBVAComparison';
import { normalizeAction, normalizeWidgetPayload, resolveWidgetType } from './widgetRegistry';
import { ProductComparison, TripEstimate, ApplicationSummary, ActivationWidget, MarketplaceWidget } from '../bbva/MockJourneyWidgets';

let messageId = 0;
const uid = () => ++messageId;
const stripMarkdown = (text = '') => text.replace(/```[\s\S]*?```/g, '').replace(/^#{1,3}\s+/gm, '').replace(/\\([\\`*_{}[\]()#+.!$|>~-])/g, '$1').trim();
const renderInlineMarkdown = (text = '') => {
  const parts = String(text).split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={`bold-${index}`}>{part.slice(2, -2)}</strong>;
    if (/^__[^_]+__$/.test(part)) return <strong key={`bold-${index}`}>{part.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(part)) return <em key={`italic-${index}`}>{part.slice(1, -1)}</em>;
    return <span key={`text-${index}`}>{part}</span>;
  });
};
const parseMarkdownTableRow = (line = '') => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
const isMarkdownTableSeparator = (line = '') => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
const renderBotMarkdown = (text = '') => {
  const lines = String(text).split(/\r?\n/);
  const blocks = [];
  let listItems = [];
  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(<ul key={`list-${blocks.length}`}>{listItems}</ul>);
    listItems = [];
  };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.includes('|') && isMarkdownTableSeparator(lines[index + 1] || '')) {
      flushList();
      const headers = parseMarkdownTableRow(line);
      const rows = [];
      index += 2;
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(parseMarkdownTableRow(lines[index]));
        index += 1;
      }
      index -= 1;
      blocks.push(<table key={`table-${index}`}><thead><tr>{headers.map((header, cellIndex) => <th key={`header-${cellIndex}`}>{renderInlineMarkdown(header)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={`row-${rowIndex}`}>{headers.map((_header, cellIndex) => <td key={`cell-${rowIndex}-${cellIndex}`}>{renderInlineMarkdown(row[cellIndex] || '—')}</td>)}</tr>)}</tbody></table>);
      continue;
    }
    const listMatch = line.match(/^\s*[-*]\s+(.+)$/);
    if (listMatch) {
      listItems.push(<li key={`item-${index}`}>{renderInlineMarkdown(listMatch[1])}</li>);
      continue;
    }
    flushList();
    if (line.trim()) blocks.push(<p key={`paragraph-${index}`}>{renderInlineMarkdown(line)}</p>);
  }
  flushList();
  return blocks;
};
const defaultMenuActions = [
  { label: 'Tarjetas', utterance: 'Quiero consultar mis tarjetas', icon: 'card' },
  { label: 'Cuentas', utterance: 'Quiero consultar mis cuentas', icon: 'account' },
  { label: 'Claves', utterance: 'Necesito ayuda con mis claves', icon: 'lock' },
  { label: 'Reclamos', utterance: 'Quiero hacer un reclamo', icon: 'claim' },
  { label: 'Fraudes', utterance: 'Quiero reportar un fraude', icon: 'shield' },
  { label: 'Más productos', utterance: 'Quiero conocer más productos', icon: 'products' },
];
const isMainMenuPayload = (payload) => payload?.type === 'quick_actions' && payload?.variant === 'main_menu';
export default function ChatPanel({ isOpen, onClose, onExposeReset, onMessagesChange, onExposeSend, intent, resetSignal = 0 }) {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(Boolean(import.meta.env.VITE_ELEVENLABS_TTS_ENDPOINT));
  const [ttsPlaying, setTtsPlaying] = useState(false);
    useEffect(() => {
      document.body.classList.toggle('azul-expanded', isOpen && isExpanded);
      return () => document.body.classList.remove('azul-expanded');
    }, [isExpanded, isOpen]);
  const [journey, setJourney] = useState(loadDemoState);
  const messagesRef = useRef(null);
  const queueRef = useRef('');
  const flushRef = useRef(null);
  const playerRef = useRef(null);
  const sendRef = useRef(null);
  const initialIntentRef = useRef(null);
  const recognitionRef = useRef(null);

  const speak = useCallback((text) => {
    if (!ttsEnabled) return;
    const finalText = normalizeForTTS(text).replace(/\bBBVA\b/gi, 'B B uve A');
    if (!finalText) return;
    queueRef.current += `${queueRef.current ? ' ' : ''}${finalText}`;
    clearTimeout(flushRef.current);
    flushRef.current = setTimeout(() => {
      const queued = queueRef.current;
      queueRef.current = '';
      playerRef.current?.play(queued);
    }, 350);
  }, [ttsEnabled]);

  const toggleVoice = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (voiceActive) {
      recognitionRef.current?.stop();
      setVoiceActive(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-AR';
    recognition.interimResults = false;
    recognition.onresult = (event) => setInputVal(event.results[0][0].transcript);
    recognition.onend = () => setVoiceActive(false);
    recognition.onerror = () => setVoiceActive(false);
    recognitionRef.current = recognition;
    recognition.start();
    setVoiceActive(true);
  }, [voiceActive]);

  useEffect(() => {
    playerRef.current = createElevenLabsPlayer({ onPlaying: setTtsPlaying, onFinished: () => setTtsPlaying(false) });
    return () => { queueRef.current = ''; clearTimeout(flushRef.current); playerRef.current?.stop(); };
  }, []);

  const addBot = useCallback((text) => {
    const display = stripMarkdown(text);
    if (!display) return;
    setMessages((current) => {
      return [...current, { id: uid(), type: 'bot', text: display }];
    });
    speak(display);
  }, [onMessagesChange, speak]);

  const addUser = useCallback((text) => {
    setMessages((current) => {
      return [...current, { id: uid(), type: 'user', text }];
    });
  }, [onMessagesChange]);

  const addPayload = useCallback((payload, fallbackText = '') => {
    const normalized = normalizeWidgetPayload(payload);
    if (!normalized) {
      if (import.meta.env.DEV) console.warn('[BBVA] Unrecognized payload ignored', payload);
      return;
    }
    setMessages((current) => {
      return [...current, { id: uid(), type: 'payload', payload: normalized, fallbackText }];
    });
  }, [onMessagesChange]);

  const handleResponse = useCallback((response) => {
    if (response.error) { addBot(response.error); return; }
    const payloads = response.payloads || [];
    const mainMenu = payloads.find(isMainMenuPayload);
    if (response.text && !mainMenu) addBot(response.text);
    payloads.forEach((payload) => addPayload(payload, isMainMenuPayload(payload) ? response.text : ''));
    if (response.metadata?.reset) setJourney(resetBBVADemo());
  }, [addBot, addPayload]);

  const sendMessage = useCallback(async (rawText) => {
    const text = String(rawText ?? inputVal).trim();
    if (!text || isResponding) return;
    setInputVal(''); setIsResponding(true); addUser(text);
    try { handleResponse(await sendConversationTurn(text, { journey })); }
    catch { addBot('La demostración tuvo un problema local. Podés intentar nuevamente.'); }
    finally { setIsResponding(false); }
  }, [addBot, addUser, handleResponse, inputVal, isResponding, journey]);

  sendRef.current = sendMessage;
  useEffect(() => { onMessagesChange?.(messages); }, [messages, onMessagesChange]);
  useEffect(() => { onExposeSend?.((text) => sendRef.current?.(text)); }, [onExposeSend]);
  const resetChat = useCallback(() => {
    queueRef.current = '';
    clearTimeout(flushRef.current);
    playerRef.current?.stop();
    setMessages([]);
    setJourney(resetBBVADemo());
    resetCXASSession();
    resetCXASResponseGuard();
  }, []);
  useEffect(() => { onExposeReset?.(resetChat); }, [onExposeReset, resetChat]);
  useEffect(() => { if (resetSignal) resetChat(); }, [resetChat, resetSignal]);
  const showHomeMenu = isOpen && !intent && messages.length === 0;
  useEffect(() => {
    return subscribeCXASWelcome(({ outputs }) => {
      const response = normalizeCXASResponseOutputs(outputs);
      const mainMenu = response.payloads.find(isMainMenuPayload);
      if (response.text && !mainMenu) addBot(response.text);
      response.payloads.forEach((payload) => addPayload(payload, isMainMenuPayload(payload) ? response.text : ''));
    });
  }, [addBot, addPayload]);
  useEffect(() => {
    if (!isOpen) return;
    if (intent && initialIntentRef.current !== intent) {
      initialIntentRef.current = intent;
      sendMessage(intent);
    }
  }, [addBot, intent, isOpen, sendMessage]);
  useEffect(() => { if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight; }, [messages]);

  const updateJourney = (patch) => { const next = saveDemoState({ ...journey, ...patch }); setJourney(next); };
  const handleWidgetAction = (value) => sendMessage(value);
  const renderPayload = (message) => {
    const payload = normalizeWidgetPayload(message.payload);
    const widgetType = resolveWidgetType(payload);
    if (!payload || !widgetType) return null;
    if (widgetType === 'quick_actions') {
      const actions = payload.actions || [];
      if (payload.variant === 'main_menu') return <AzulMainMenu copy={payload.copy} fallbackText={message.fallbackText} actions={actions} onAction={handleWidgetAction} disabled={isResponding} />;
      return <div className="bbva-widget quick-actions-widget">{actions.map((rawAction, index) => {
        const action = normalizeAction(rawAction);
        return <button key={action.utterance || `cxas-action-${index}`} className="cp-ai-pill" disabled={isResponding || !action.utterance} onClick={() => handleWidgetAction(action.utterance)}><strong>{action.label}</strong>{action.description && <small>{action.description}</small>}</button>;
      })}</div>;
    }
    if (widgetType === 'bbva_comparison') {
      if (Array.isArray(payload.productDetails)) return <BBVAComparison title={payload.title} productDetails={payload.productDetails} features={payload.features} onAction={handleWidgetAction} disabled={isResponding} />;
      return <ProductComparison title={payload.title} products={payload.products} productDetails={payload.productDetails} features={payload.features} onAction={handleWidgetAction} />;
    }
    if (payload.type === 'trip_estimate') return <TripEstimate payload={payload} onSave={() => { updateJourney({ estimate: payload }); addBot('Guardé el estimado ilustrativo en tu plan de viaje.'); }} />;
    if (payload.type === 'application_summary') return <ApplicationSummary product={payload.product} onComplete={(application) => { updateJourney({ application, newCard: { id: payload.product.id, status: 'ready_for_demo_activation' } }); addBot('Solicitud de demostración aprobada. En esta demostración, preparamos el correo de confirmación y el acceso a la activación.'); addPayload({ type: 'activation', product: payload.product }); }} />;
    if (payload.type === 'activation') return <ActivationWidget product={payload.product} onComplete={(result) => { updateJourney({ newCard: result }); addBot('Activación simulada completada.'); }} />;
    if (payload.type === 'marketplace') return <MarketplaceWidget items={payload.items} onPurchase={async (item) => { const purchase = await createMockMarketplacePurchase(item); updateJourney({ marketplace: { points: journey.marketplace.points + purchase.points, budget: journey.marketplace.budget - purchase.amount }, activity: [...journey.activity, purchase] }); addBot(`Compra de demostración confirmada. ID ${purchase.confirmationId}. No se realizó ningún cargo real.`); }} />;
    return null;
  };

  return <aside className={`chat-panel${isOpen ? ' open' : ''}${isExpanded ? ' expanded' : ''}`} aria-label="Azul, asistente BBVA Argentina">
    <div className="cp-panel-header"><img className="cp-assistant-mark" src={assistantMark} alt="" /><div className="cp-header-identity"><strong>Azul</strong><span><i className="cp-availability-dot" aria-hidden="true" />Disponible</span></div><div className="cp-header-actions"><button className="cp-reset-btn" onClick={resetChat} aria-label="Reiniciar conversación" title="Reiniciar conversación"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0 2 5.3" /><path d="M20 4v7h-7" /></svg></button><button className="cp-expand-btn" onClick={() => setIsExpanded((expanded) => !expanded)} aria-label={isExpanded ? 'Contraer Azul' : 'Expandir Azul'} title={isExpanded ? 'Contraer' : 'Expandir'}>{isExpanded ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 15H5v4M5 15l5 5M15 9h4V5M19 9l-5-5" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M3 3l6 6M16 21h5v-5M21 21l-6-6" /></svg>}</button><button className="cp-close-btn" onClick={onClose} aria-label="Cerrar Azul">×</button></div></div>
    <div className="cp-messages" ref={messagesRef} role="log" aria-live="polite">
      {showHomeMenu && <div className="azul-home"><AzulMainMenu actions={defaultMenuActions} onAction={handleWidgetAction} disabled={isResponding} /></div>}
      {messages.map((message) => message.type === 'bot' ? <div key={message.id} className="cp-bot-bubble acn-msg-enter">{renderBotMarkdown(message.text)}</div> : message.type === 'user' ? <div key={message.id} className="cp-user-bubble acn-msg-enter">{message.text}</div> : <div key={message.id} className="acn-msg-enter" data-combo="true">{renderPayload(message)}</div>)}
      {isResponding && <div className="cp-typing" aria-label="Azul está escribiendo"><span /><span /><span /></div>}
    </div>
    <div className="cp-input-bar">
      <button className={`cp-icon-input-btn cp-speaker-btn${ttsEnabled ? ' active' : ''}${ttsPlaying ? ' speaking' : ''}`} onClick={() => { setTtsEnabled((enabled) => !enabled); queueRef.current = ''; clearTimeout(flushRef.current); playerRef.current?.stop(); }} aria-label={ttsEnabled ? 'Silenciar voz' : 'Activar voz'}>{ttsEnabled ? '◖)' : '◖'}</button>
      <button className={`cp-icon-input-btn cp-mic-btn${voiceActive ? ' active' : ''}`} onClick={toggleVoice} disabled={isResponding} aria-label={voiceActive ? 'Detener micrófono' : 'Usar micrófono'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8"/></svg>
      </button>
      <input className="cp-text-input" value={inputVal} onChange={(event) => setInputVal(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && sendMessage()} placeholder="Escribí tu consulta…" disabled={isResponding} />
      <button className="cp-send-btn" onClick={() => sendMessage()} disabled={isResponding} aria-label="Enviar mensaje">→</button>
    </div>
  </aside>;
}
