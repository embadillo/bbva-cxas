import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import assistantMark from '../../assets/brand/cropped_circle_image.png';

// ── Quick-action suggestions (mirrors ChatPanel) ───────────────────────────────
const GUEST_SUGGESTIONS = [
  { label: 'Comparar tarjetas', utterance: 'Compará mis tarjetas para viajar' },
  { label: 'Planificar un viaje', utterance: 'Estoy planificando un viaje' },
  { label: 'Ver Marketplace', utterance: 'Quiero conocer el Marketplace' },
  { label: 'Solicitar demo', utterance: 'Quiero iniciar una solicitud de demostración' },
];

const CUSTOMER_SUGGESTIONS = [
  { label: 'Comparar tarjetas', utterance: 'Compará mis tarjetas para viajar' },
  { label: 'Ver mi plan', utterance: 'Quiero conocer el Marketplace' },
  { label: 'Solicitar demo', utterance: 'Quiero iniciar una solicitud de demostración' },
];

// ── BotText — renders **bold** as <strong> ────────────────────────────────────
function FcBotText({ text }) {
  function parseBold(str) {
    const parts = str.split(/(\*\*[^*\n]+\*\*)/g);
    if (parts.length === 1) return str;
    return parts.map((part, i) => {
      const m = part.match(/^\*\*([^*\n]+)\*\*$/);
      return m ? <strong key={i}>{m[1]}</strong> : part;
    });
  }
  const lines = text.split('\n').filter(Boolean);
  if (lines.length <= 1) return <>{parseBold(text)}</>;
  return (
    <>
      {lines.map((line, i) => (
        <span key={i} style={{ display: 'block', marginBottom: i < lines.length - 1 ? '4px' : 0 }}>
          {parseBold(line)}
        </span>
      ))}
    </>
  );
}

// ── FloatingChatWidget ─────────────────────────────────────────────────────────

export default function FloatingChatWidget({
  messages = [],
  isOpen,
  onOpen,
  onClose,
  onSend,
  onRequestSignIn,
}) {
  const { isAuthenticated } = useAuth();
  const AI_SUGGESTIONS = isAuthenticated ? CUSTOMER_SUGGESTIONS : GUEST_SUGGESTIONS;

  const [inputVal,        setInputVal]        = useState('');
  const [unread,          setUnread]          = useState(0);
  const [voiceActive,     setVoiceActive]     = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const msgsRef         = useRef(null);
  const prevCountRef    = useRef(messages.length);
  const recognitionRef  = useRef(null);
  const galleryInputRef = useRef(null);
  const suggestionsRef  = useRef(null);

  const isResponding = messages.some((m) => m.type === 'typing');
  const hasContent   = messages.some((m) => m.type === 'bot' || m.type === 'user' || m.type === 'combo');

  // ── Scroll + unread badge ──────────────────────────────────────────────────
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;

    if (!isOpen && messages.length > prevCountRef.current) {
      const newOnes = messages.slice(prevCountRef.current);
      const newBot  = newOnes.filter((m) => m.type === 'bot' || m.type === 'combo').length;
      if (newBot > 0) setUnread((u) => u + newBot);
    }
    prevCountRef.current = messages.length;
  }, [messages, isOpen]);

  useEffect(() => { if (isOpen) setUnread(0); }, [isOpen]);

  // Close suggestions when clicking outside
  useEffect(() => {
    if (!showSuggestions) return;
    const handler = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSuggestions]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleSend = (text) => {
    const msg = (text ?? inputVal).trim();
    if (!msg) return;
    setInputVal('');
    setShowSuggestions(false);
    onSend?.(msg);
  };

  const handleSuggestion = (s) => {
    setShowSuggestions(false);
    onSend?.(s.utterance);
  };

  // ── Voice (mic) ────────────────────────────────────────────────────────────
  const toggleVoice = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser.');
      return;
    }
    if (voiceActive) {
      recognitionRef.current?.stop();
      setVoiceActive(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-CA';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onSend?.(transcript);
    };
    rec.onend = () => setVoiceActive(false);
    rec.onerror = () => setVoiceActive(false);
    rec.start();
    recognitionRef.current = rec;
    setVoiceActive(true);
  }, [voiceActive, onSend]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fc-widget">
      {isOpen && (
        <div className="fc-panel">

          {/* ── Header ── */}
          <div className="fc-header">
            <img className="fc-avatar" src={assistantMark} alt="" />
            <div className="fc-info">
              <div className="fc-title">Azul</div>
              <div className="fc-status">
                <span className="fc-status-dot" />
                {isResponding ? 'Azul está escribiendo' : 'Disponible'}
              </div>
            </div>
            <button className="fc-close" onClick={onClose} aria-label="Cerrar Azul">✕</button>
          </div>

          {/* ── Messages ── */}
          <div className="fc-messages" ref={msgsRef}>
            {!hasContent && !isResponding && (
              <div className="fc-empty">
                <img className="fc-empty-avatar" src={assistantMark} alt="" />
                <strong>Hola, soy Azul.</strong>
                <p>Contame qué querés resolver y lo vemos juntos.</p>
              </div>
            )}

            {messages.map((msg) => {
              if (msg.type === 'bot') return (
                <div key={msg.id} className="fc-bot-bubble">
                  <FcBotText text={msg.text} />
                </div>
              );

              if (msg.type === 'user') return (
                <div key={msg.id} className="fc-user-bubble">{msg.text}</div>
              );

              if (msg.type === 'typing') return (
                <div key={msg.id} className="fc-typing">
                  <span /><span /><span />
                </div>
              );

              // Combo card — show heading + actual action pill buttons (resized)
              if (msg.type === 'combo' && msg.heading) return (
                <div key={msg.id} className="fc-bot-bubble">
                  <FcBotText text={msg.heading} />
                  {msg.actions?.length > 0 && (
                    <div className="fc-combo-actions">
                      {msg.actions.map((action, i) => {
                        const label = action.content || action.utterance || '';
                        return (
                          <button
                            key={i}
                            className="fc-action-pill"
                            onClick={() => handleSend(action.utterance || action.content)}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );

              if (msg.type === 'receipt') return (
                <div key={msg.id} className="fc-bot-bubble">
                  ✓ {msg.payload?.title || 'Done'}
                </div>
              );

              return null;
            })}
          </div>

          {/* ── AI suggestions popover ── */}
          {showSuggestions && (
            <div className="fc-suggestions-tray" ref={suggestionsRef}>
              {AI_SUGGESTIONS.map((s) => (
                <button
                  key={s.utterance}
                  className="fc-suggestion-pill"
                  onClick={() => handleSuggestion(s)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Input bar ── */}
          <div className="fc-input-bar">
            {/* Icon buttons */}
            <div className="fc-icon-btns">
              {/* Gallery / image */}
              <button
                className="fc-icon-btn"
                onClick={() => galleryInputRef.current?.click()}
                title="Adjuntar imagen"
                aria-label="Adjuntar imagen"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </button>
              {/* Hidden file input */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    onSend?.(`[Image: ${e.target.files[0].name}]`);
                    e.target.value = '';
                  }
                }}
              />

              {/* @ alias */}
              <button
                className="fc-icon-btn"
                onClick={() => setInputVal((v) => v + '@')}
                title="Mención o alias"
                aria-label="Mención o alias"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
                </svg>
              </button>

              {/* AI suggestions / sparkle */}
              <button
                className={`fc-icon-btn${showSuggestions ? ' active' : ''}`}
                onClick={() => setShowSuggestions((v) => !v)}
                title="Sugerencias rápidas"
                aria-label="Sugerencias rápidas"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </button>
            </div>

            {/* Text input */}
            <input
              className="fc-input"
              type="text"
                placeholder="Escribí tu consulta"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isResponding}
              autoComplete="off"
              aria-label="Message input"
            />

            {/* Mic button */}
            <button
              className={`fc-icon-btn fc-mic-btn${voiceActive ? ' listening' : ''}`}
              onClick={toggleVoice}
              disabled={isResponding}
                title={voiceActive ? 'Dejar de escuchar' : 'Entrada por voz'}
                aria-label={voiceActive ? 'Dejar de escuchar' : 'Entrada por voz'}
            >
              {voiceActive ? (
                /* Stop / square icon when listening */
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <rect x="4" y="4" width="16" height="16" rx="2"/>
                </svg>
              ) : (
                /* Mic icon */
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              )}
            </button>

            {/* Send button */}
            <button
              className="fc-send"
              onClick={() => handleSend()}
              disabled={isResponding || !inputVal.trim()}
                aria-label="Enviar mensaje"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff"
                   strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── FAB ── */}
      <button
        className="fc-fab"
        onClick={isOpen ? onClose : onOpen}
        title={isOpen ? 'Cerrar Azul' : 'Abrir Azul'}
        aria-label={isOpen ? 'Cerrar Azul' : 'Abrir Azul'}
      >
        {unread > 0 && !isOpen && (
          <span className="fc-badge">{unread > 9 ? '9+' : unread}</span>
        )}
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff"
               strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        ) : <img className="fc-fab-avatar" src={assistantMark} alt="" />}
      </button>
    </div>
  );
}
