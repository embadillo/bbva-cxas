import { useState } from 'react';
import { activateMockCard, createMockMarketplacePurchase, runMockCreditDecision, submitMockApplication } from '../../services/mockBankingService';

const money = (amount) => `ARS ${amount.toLocaleString('es-AR')}`;

export function ProductComparison({ title, products = [], productDetails = [], features = [], onAction }) {
  const comparisonProducts = products.length ? products : productDetails;
  return <section className="comparison-widget" aria-label="Comparación de productos">
    <div className="comparison-widget-heading">
      <span className="widget-eyebrow">Comparación de demostración</span>
      <p>{title || 'Revisá las opciones y elegí la que mejor acompaña tu momento.'}</p>
    </div>
    <div className="comparison-grid">
      {comparisonProducts.map((product, index) => <article key={product.id || product.productId || index} className="comparison-product">
        <div className="comparison-card-art" style={product.imageUris?.[0] ? { backgroundImage: `url(${product.imageUris[0]})` } : { background: `linear-gradient(135deg, ${product.accent || '#072146'}, ${product.accent2 || '#1464a5'})` }}>
          {product.imageUris?.[0] ? <img src={product.imageUris[0]} alt="" /> : <><strong>BBVA</strong><span>{product.tier}</span><b aria-hidden="true">A</b></>}
        </div>
        <div className="comparison-product-copy"><h3>{product.name || product.title}</h3><p>{product.tagline || product.subtitle}</p></div>
        <dl>
          <div><dt>Mantenimiento</dt><dd>{product.annualFee || product.price}</dd></div>
          <div><dt>Viajes</dt><dd>{product.travelBenefit || product.benefit}</dd></div>
          <div><dt>Recompensas</dt><dd>{product.rewards}</dd></div>
          <div><dt>Elegibilidad</dt><dd>{product.eligibility}</dd></div>
        </dl>
        {product.ctaUtterance || product.uri || product.name ? <button className="cs-btn" onClick={() => product.ctaUtterance ? onAction?.(product.ctaUtterance) : product.uri ? window.open(product.uri, '_blank', 'noopener,noreferrer') : onAction?.(`Quiero iniciar una solicitud de demostración para ${product.name}`)}>{product.ctaLabel || 'Elegir esta opción'}</button> : null}
      </article>)}
    </div>
    {features.length > 0 && <div className="comparison-features">{features.map((feature, index) => <div key={feature.label || index}><strong>{feature.label}</strong><span>{feature.productSpecs?.map((spec) => spec.text).filter(Boolean).join(' · ')}</span></div>)}</div>}
  </section>;
}

export function TripEstimate({ payload, onSave }) {
  return <div className="bbva-widget estimate-widget"><div className="widget-eyebrow">Estimación ilustrativa</div><h3>{payload.label}</h3><strong>{money(payload.amount)}</strong><p>No es una cotización ni una póliza real.</p><button className="cs-btn" onClick={onSave}>Guardar en mi plan</button></div>;
}

export function ApplicationSummary({ product, onComplete }) {
  const [busy, setBusy] = useState(false);
  const apply = async () => { setBusy(true); const application = await submitMockApplication(product.id); const decision = await runMockCreditDecision(); setBusy(false); onComplete?.({ ...application, ...decision }); };
  return <div className="bbva-widget application-widget"><div className="widget-eyebrow">Solicitud de demostración</div><h3>{product.name}</h3><p>La aprobación y el correo son simulados. No se crea un producto bancario real.</p><button className="cs-btn" disabled={busy} onClick={apply}>{busy ? 'Procesando...' : 'Simular solicitud'}</button></div>;
}

export function ActivationWidget({ product, onComplete }) {
  const [busy, setBusy] = useState(false);
  const activate = async () => { setBusy(true); const result = await activateMockCard(product.id); setBusy(false); onComplete?.(result); };
  return <div className="bbva-widget activation-widget"><div className="widget-eyebrow">Lista para demo</div><h3>Activación local de {product.name}</h3><p>Esta acción solo actualiza el estado de la demostración.</p><button className="cs-btn" disabled={busy} onClick={activate}>{busy ? 'Actualizando...' : 'Activar en demo'}</button></div>;
}

export function MarketplaceWidget({ items, onPurchase }) {
  const [selected, setSelected] = useState(null);
  return <div className="bbva-widget marketplace-widget"><div className="widget-eyebrow">Marketplace de demostración</div><div className="marketplace-grid">{items.map((item) => <button key={item.id} className={`marketplace-item${selected?.id === item.id ? ' selected' : ''}`} onClick={() => setSelected(item)}><strong>{item.name}</strong><span>{money(item.amount)}</span><small>{item.points.toLocaleString('es-AR')} puntos estimados</small></button>)}</div>{selected && <div className="marketplace-confirm"><p>Elegiste <strong>{selected.name}</strong>. No se realizará ningún cargo real.</p><button className="cs-btn" onClick={() => onPurchase(selected)}>Confirmar compra de demostración</button></div>}</div>;
}
