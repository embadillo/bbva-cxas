import { useEffect, useRef, useState } from 'react';
import blackVideoUrl from '../../assets/video/black_video.mp4';

const STATIC_CARD_VARIANTS = ['SAVE', 'ALL', 'TRAVEL'];

function StaticHeroVisual() {
  return <div className="hero-card-composition" aria-hidden="true">
    {STATIC_CARD_VARIANTS.map((variant) => (
      <div className={`hero-card hero-card-${variant.toLowerCase()}`} key={variant}>
        <div className="hero-card-top"><span>BBVA</span><small>CRÉDITO {variant}</small></div>
        <div className="hero-card-mark">A</div>
        <div className="hero-card-bottom"><span>VISA</span><i /></div>
      </div>
    ))}
    <span className="hero-visual-caption">Experiencias de demostración</span>
  </div>;
}

export default function Dashboard({ onOpenChat }) {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);
    updateMotionPreference();
    mediaQuery.addEventListener?.('change', updateMotionPreference);
    return () => mediaQuery.removeEventListener?.('change', updateMotionPreference);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (reducedMotion) {
      video?.pause();
      setVideoReady(false);
      return;
    }
    if (videoReady) video?.play().catch(() => {});
  }, [reducedMotion, videoReady]);

  const handleVideoReady = () => { if (!reducedMotion) setVideoReady(true); };

  return (
    <main className="dashboard">

      {/* Auth/guest status is shown in the top nav — no separate banner needed */}

      {/* ── Hero ── */}
      <section className="hero" id="hero">
        <div className="hero-inner">

          {/* Left: copy */}
          <div className="hero-left">
            <h1>
              Cuando querés elegir,<br />
              la respuesta es<br />
              <span className="hero-accent">Black+.</span>
            </h1>

            <p>
              Conocé opciones pensadas para tu forma de vivir, compará con
              claridad y avanzá acompañado por BBVA Argentina.
            </p>

            <div className="hero-ctas">
              <button className="btn-hero" onClick={() => onOpenChat()}>
                Contratar paquetes
              </button>
              <button
                className="btn-hero-ghost"
                onClick={() => onOpenChat('Estoy planificando un viaje')}
              >
                Hablar con Azul
              </button>
            </div>

          </div>

          {/* Right: animated credit card */}
          <div className={`hero-right${videoReady ? ' has-video' : ''}`}>
            {!videoReady && <StaticHeroVisual />}
            <video
              ref={videoRef}
              className="hero-video"
              src={blackVideoUrl}
              autoPlay={!reducedMotion}
              muted
              loop
              playsInline
              preload="metadata"
              onLoadedMetadata={handleVideoReady}
              onCanPlay={handleVideoReady}
              onError={() => setVideoReady(false)}
              aria-label="Video de la campaña Black+"
            />
          </div>
        </div>
      </section>

      <section className="benefits-band" id="benefits">
        <div className="benefits-copy">
          <p className="section-label">Una decisión acompañada</p>
          <h2>Todo lo que necesitás saber, en un solo lugar.</h2>
          <p>El asistente puede ayudarte a entender beneficios, comparar opciones y avanzar cuando tengas la información necesaria.</p>
        </div>
        <div className="benefit-list">
          <div><strong>Beneficios</strong><span>Conocé qué incluye cada propuesta.</span></div>
          <div><strong>Viajes</strong><span>Revisá la información relevante para usarla en el exterior.</span></div>
          <div><strong>Claridad</strong><span>Los datos sin aprobar aparecen como pendientes.</span></div>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <p className="section-label">Preguntas frecuentes</p>
        <h2>Antes de elegir</h2>
        <details><summary>¿Puedo comparar las tarjetas?</summary><p>Sí. Usá la tabla para revisar beneficios, mantenimiento, recompensas y condiciones de elegibilidad disponibles.</p></details>
        <details><summary>¿Dónde veo los importes y requisitos?</summary><p>Los valores comerciales que todavía no cuentan con aprobación se identifican como “Dato pendiente de aprobación”.</p></details>
        <details><summary>¿El asistente puede ayudarme a solicitar un producto?</summary><p>Puede orientarte y acompañar el inicio del proceso. La confirmación final depende de las validaciones correspondientes.</p></details>
      </section>

      <section className="legal-section">
        <p><strong>Información importante.</strong> La información comercial de esta experiencia es configurable y puede estar pendiente de aprobación. No constituye una oferta ni reemplaza los términos y condiciones vigentes de BBVA Argentina.</p>
      </section>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <span>© 2026 BBVA Argentina · Información orientativa</span>
        <button className="footer-chat-link" onClick={() => onOpenChat()}>Hablar con Azul ↗</button>
      </footer>

    </main>
  );
}
