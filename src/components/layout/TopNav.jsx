import { useAuth } from '../../context/AuthContext';
import bbvaLogo from '../../assets/brand/Captura de pantalla 2026-09-09 211354.png';

export default function TopNav({ onOpenChat, onSignIn, onSignOut, onResetChat, chatOpen = false }) {
  const { demoMode, customerName } = useAuth();

  return (
    <nav className="top-nav" role="navigation" aria-label="Navegación principal">
      <div className="nav-logo">
        <img className="nav-logo-mark" src={bbvaLogo} alt="BBVA" />
      </div>

      <div className="nav-links">
        <a className="nav-link-active" href="#hero">Personas</a>
        <a href="#products">Empresas</a>
        <a href="#benefits">Pymes</a>
      </div>

      <div className="nav-actions">
        <button className="nav-btn nav-btn-online nav-welcome" type="button">
          Bienvenido, {customerName || 'Emiliano'}
        </button>

        <button className="nav-icon-btn nav-utility-btn" aria-label="Buscar" title="Buscar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/></svg>
        </button>
        <button className="nav-menu-btn" aria-label="Abrir menú">Menú <span aria-hidden="true">☰</span></button>

        {/* Reset button — only when chat is open */}
        {chatOpen && (
          <button
            className="nav-icon-btn"
            onClick={onResetChat}
            title="Nueva conversación"
            aria-label="Iniciar nueva conversación"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
            </svg>
          </button>
        )}

        {/* Chat toggle */}
        <button
          className={`nav-btn nav-btn-chat${chatOpen ? ' nav-btn-chat--active' : ''}`}
          onClick={onOpenChat}
          aria-label={chatOpen ? 'Cerrar Azul' : 'Hablar con Azul'}
          aria-expanded={chatOpen}
        >
          {chatOpen ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          )}
          {chatOpen ? 'Cerrar Azul' : 'Hablar con Azul'}
        </button>
      </div>
    </nav>
  );
}
