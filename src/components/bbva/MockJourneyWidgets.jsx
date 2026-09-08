import { useState } from 'react';
import { activateMockCard, createMockMarketplacePurchase, runMockCreditDecision, submitMockApplication } from '../../services/mockBankingService';

const money = (amount) => `ARS ${amount.toLocaleString('es-AR')}`;

export function ProductComparison({ products, onAction }) {
  return <section className="comparison-widget" aria-label="Comparación de productos">
    <div className="comparison-widget-heading">
      <span className="widget-eyebrow">Comparación de demostración</span>
      <p>Revisá las opciones y elegí la que mejor acompaña tu momento.</p>
    </div>
    <div className="comparison-grid">
      {products.map((product) => <article key={product.id} className="comparison-product">
        <div className="comparison-card-art" style={{ background: `linear-gradient(135deg, ${product.accent}, ${product.accent2})` }}>
          <strong>BBVA</strong><span>{product.tier}</span><b aria-hidden="true">A</b>
        </div>
        <div className="comparison-product-copy"><h3>{product.name}</h3><p>{product.tagline}</p></div>
        <dl>
          <div><dt>Mantenimiento</dt><dd>{product.annualFee}</dd></div>
          <div><dt>Viajes</dt><dd>{product.travelBenefit}</dd></div>
          <div><dt>Recompensas</dt><dd>{product.rewards}</dd></div>
          <div><dt>Elegibilidad</dt><dd>{product.eligibility}</dd></div>
        </dl>
        <button className="cs-btn" onClick={() => onAction?.(`Quiero iniciar una solicitud de demostración para ${product.name}`)}>Elegir esta opción</button>
      </article>)}
    </div>
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
