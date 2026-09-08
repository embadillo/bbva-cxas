import { useEffect, useRef, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import TopNav from './components/layout/TopNav';
import Dashboard from './components/layout/Dashboard';
import ChatPanel from './components/chat/ChatPanel';
import FloatingChatWidget from './components/chat/FloatingChatWidget';
import { CxasSdkHost } from './services/conversation/cxasClient';

function AppContent() {
  const { signOut } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatIntent, setChatIntent] = useState(null);
  const [floatOpen, setFloatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const sendRef = useRef(null);
  const resetRef = useRef(null);
  const lastFocusRef = useRef(null);

  const openChat = (intent = null) => {
    lastFocusRef.current = document.activeElement;
    setChatOpen(true);
    if (intent) setChatIntent(intent);
  };
  const handleSignOut = () => { signOut(); resetRef.current?.(); setChatOpen(false); };

  useEffect(() => {
    if (!chatOpen) {
      document.body.classList.remove('azul-open');
      lastFocusRef.current?.focus?.();
      return undefined;
    }
    document.body.classList.add('azul-open');
    const shouldLockScroll = window.matchMedia('(max-width: 700px)').matches;
    const previousOverflow = document.body.style.overflow;
    if (shouldLockScroll) document.body.style.overflow = 'hidden';
    const focusClose = window.setTimeout(() => document.querySelector('.chat-panel.open .cp-close-btn')?.focus(), 0);
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setChatOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusClose);
      document.removeEventListener('keydown', onKeyDown);
      if (shouldLockScroll) document.body.style.overflow = previousOverflow;
      document.body.classList.remove('azul-open');
    };
  }, [chatOpen]);

  return <>
    <CxasSdkHost />
    <TopNav onOpenChat={() => setChatOpen((open) => !open)} onSignIn={() => openChat('Quiero conocer el modo demo')} onSignOut={handleSignOut} onResetChat={() => resetRef.current?.()} chatOpen={chatOpen} />
    <Dashboard onOpenChat={openChat} />
    <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} intent={chatIntent} resetSignal={0} onExposeReset={(reset) => { resetRef.current = reset; }} onMessagesChange={setMessages} onExposeSend={(send) => { sendRef.current = send; }} />
    {chatOpen && <div className="chat-backdrop" onClick={() => setChatOpen(false)} aria-hidden="true" />}
    {!chatOpen && <FloatingChatWidget messages={messages} isOpen={false} onOpen={() => openChat()} onClose={() => {}} onSend={(text) => sendRef.current?.(text)} />}
  </>;
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
