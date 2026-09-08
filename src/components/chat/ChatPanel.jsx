import { useCallback, useEffect, useRef, useState } from 'react';
import { sendConversationTurn } from '../../services/conversation/conversationService';
import { createElevenLabsPlayer } from '../../services/tts/elevenLabsTTS';
import { cleanTextForTTS } from '../../services/tts/speechNormalization';
import { createMockMarketplacePurchase } from '../../services/mockBankingService';
import { loadDemoState, resetBBVADemo, saveDemoState } from '../../services/mockJourneyService';
import { resetCXASSession } from '../../services/conversation/cxasClient';
import { mockProducts } from '../../data/mockProducts';
import assistantMark from '../../assets/brand/cropped_circle_image.png';
import { ProductComparison, TripEstimate, ApplicationSummary, ActivationWidget, MarketplaceWidget } from '../bbva/MockJourneyWidgets';

let messageId = 0;
const uid = () => ++messageId;
const stripMarkdown = (text = '') => text.replace(/```[\s\S]*?```/g, '').replace(/^#{1,3}\s+/gm, '').trim();
export default function ChatPanel({ isOpen, onClose, onExposeReset, onMessagesChange, onExposeSend, intent, resetSignal = 0 }) {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(Boolean(import.meta.env.VITE_ELEVENLABS_TTS_ENDPOINT));
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [journey, setJourney] = useState(loadDemoState);
  const messagesRef = useRef(null);
  const queueRef = useRef('');
  const flushRef = useRef(null);
  const playerRef = useRef(null);
  const sendRef = useRef(null);
  const initialIntentRef = useRef(null);
  const recognitionRef = useRef(null);

  const publish = useCallback((next) => {
    setMessages(next);
    onMessagesChange?.(next);
  }, [onMessagesChange]);

  const speak = useCallback((text) => {
    if (!ttsEnabled) return;
    queueRef.current += `${queueRef.current ? ' ' : ''}${cleanTextForTTS(text, { locale: 'es-AR', currency: 'ARS' })}`;
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
    return () => { clearTimeout(flushRef.current); playerRef.current?.stop(); };
  }, []);

  const addBot = useCallback((text) => {
    const display = stripMarkdown(text);
    if (!display) return;
    setMessages((current) => {
      return [...current, { id: uid(), type: 'bot', text: display }];
    });
    speak(text);
  }, [onMessagesChange, speak]);

  const addUser = useCallback((text) => {
    setMessages((current) => {
      return [...current, { id: uid(), type: 'user', text }];
    });
  }, [onMessagesChange]);

  const addPayload = useCallback((payload) => {
    setMessages((current) => {
      return [...current, { id: uid(), type: 'payload', payload }];
    });
  }, [onMessagesChange]);

  const handleResponse = useCallback((response) => {
    if (response.error) { addBot(response.error); return; }
    if (response.text) addBot(response.text);
    response.payloads.forEach(addPayload);
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
  useEffect(() => { onExposeReset?.(() => { setMessages([]); setJourney(resetBBVADemo()); resetCXASSession(); }); }, [onExposeReset]);
  useEffect(() => { if (resetSignal) { setMessages([]); setJourney(resetBBVADemo()); resetCXASSession(); } }, [resetSignal]);
  useEffect(() => {
    if (!isOpen) return;
    if (!messages.length && !intent) {
      addBot('Hola, soy Azul. ¿En qué puedo ayudarte hoy?');
    }
    if (intent && initialIntentRef.current !== intent) {
      initialIntentRef.current = intent;
      sendMessage(intent);
    }
  }, [addBot, intent, isOpen, sendMessage]);
  useEffect(() => { if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight; }, [messages]);

  const updateJourney = (patch) => { const next = saveDemoState({ ...journey, ...patch }); setJourney(next); };
  const handleWidgetAction = (value) => sendMessage(value);
  const renderPayload = (message) => {
    const payload = message.payload;
    if (payload.type === 'quick_actions') return <div className="bbva-widget quick-actions-widget">{payload.actions.map((action, index) => <button key={action.value || `cxas-action-${index}`} className="cp-ai-pill" onClick={() => handleWidgetAction(action.value)}>{action.label}</button>)}</div>;
    if (payload.type === 'product_comparison') return <ProductComparison products={payload.products} onAction={handleWidgetAction} />;
    if (payload.type === 'trip_estimate') return <TripEstimate payload={payload} onSave={() => { updateJourney({ estimate: payload }); addBot('Guardé el estimado ilustrativo en tu plan de viaje.'); }} />;
    if (payload.type === 'application_summary') return <ApplicationSummary product={payload.product} onComplete={(application) => { updateJourney({ application, newCard: { id: payload.product.id, status: 'ready_for_demo_activation' } }); addBot('Solicitud de demostración aprobada. En esta demostración, preparamos el correo de confirmación y el acceso a la activación.'); addPayload({ type: 'activation', product: payload.product }); }} />;
    if (payload.type === 'activation') return <ActivationWidget product={payload.product} onComplete={(result) => { updateJourney({ newCard: result }); addBot('Activación simulada completada.'); }} />;
    if (payload.type === 'marketplace') return <MarketplaceWidget items={payload.items} onPurchase={async (item) => { const purchase = await createMockMarketplacePurchase(item); updateJourney({ marketplace: { points: journey.marketplace.points + purchase.points, budget: journey.marketplace.budget - purchase.amount }, activity: [...journey.activity, purchase] }); addBot(`Compra de demostración confirmada. ID ${purchase.confirmationId}. No se realizó ningún cargo real.`); }} />;
    return null;
  };

  return <aside className={`chat-panel${isOpen ? ' open' : ''}`} aria-label="Azul, asistente BBVA Argentina">
    <div className="cp-panel-header"><img className="cp-assistant-mark" src={assistantMark} alt="" /><div><strong>Azul</strong><span>Disponible</span></div><button className="cp-close-btn" onClick={onClose} aria-label="Cerrar Azul">×</button></div>
    <div className="cp-messages" ref={messagesRef} role="log" aria-live="polite">
      {messages.map((message) => message.type === 'bot' ? <div key={message.id} className="cp-bot-bubble acn-msg-enter">{message.text}</div> : message.type === 'user' ? <div key={message.id} className="cp-user-bubble acn-msg-enter">{message.text}</div> : <div key={message.id} className="acn-msg-enter" data-combo="true">{renderPayload(message)}</div>)}
      {isResponding && <div className="cp-typing" aria-label="Azul está escribiendo"><span /><span /><span /></div>}
    </div>
    <div className="cp-input-bar">
      <button className={`cp-icon-input-btn cp-speaker-btn${ttsEnabled ? ' active' : ''}${ttsPlaying ? ' speaking' : ''}`} onClick={() => { setTtsEnabled((enabled) => !enabled); playerRef.current?.stop(); }} aria-label={ttsEnabled ? 'Silenciar voz' : 'Activar voz'}>{ttsEnabled ? '◖)' : '◖'}</button>
      <button className={`cp-icon-input-btn cp-mic-btn${voiceActive ? ' active' : ''}`} onClick={toggleVoice} disabled={isResponding} aria-label={voiceActive ? 'Detener micrófono' : 'Usar micrófono'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8"/></svg>
      </button>
      <input className="cp-text-input" value={inputVal} onChange={(event) => setInputVal(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && sendMessage()} placeholder="Escribí tu consulta…" disabled={isResponding} />
      <button className="cp-send-btn" onClick={() => sendMessage()} disabled={isResponding} aria-label="Enviar mensaje">→</button>
    </div>
  </aside>;
}
