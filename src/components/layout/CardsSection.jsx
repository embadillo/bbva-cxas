import { useState } from 'react';
import { mockProducts } from '../../data/mockProducts';

const experiences = [
  { source: mockProducts[1] || mockProducts[0], name: 'Black+ Save', eyebrow: 'PARA AHORRAR SIEMPRE', tagline: 'Una referencia para tus decisiones de todos los días.' },
  { source: mockProducts[0], name: 'Black+ Travel', eyebrow: 'PARA EL VIAJERO FRECUENTE', tagline: 'Una experiencia ilustrativa para acompañar tus viajes.' },
  { source: mockProducts[0], name: 'Black+ All', eyebrow: 'LA OPCIÓN MÁS COMPLETA', tagline: 'Una sola propuesta para explorar distintos beneficios.' },
];

const comparisonCategories = [
  { label: 'Tarjetas', features: [{ label: 'Producto', getValue: () => 'Producto de demostración' }] },
  { label: 'Viajar', features: [{ label: 'Beneficio de viaje', getValue: (source) => source.travelBenefit }] },
  { label: 'Comprar', features: [{ label: 'Recompensas', getValue: (source) => source.rewards }] },
  { label: 'Mantenimiento', features: [{ label: 'Valor ilustrativo', getValue: (source) => source.annualFee }] },
];

function ProductHeader({ experience, index }) {
  const { source, name, eyebrow, tagline } = experience;
  return <article className={`comparison-product-header${index === 2 ? ' is-recommended' : ''}`}>
    <span className="comparison-positioning">{eyebrow}</span>
    <div className="comparison-header-art" style={{ background: `linear-gradient(135deg, ${source.accent}, ${source.accent2})` }} aria-hidden="true">
      <span>BBVA</span><small>{name.replace('Black+ ', '')}</small><b>A</b>
    </div>
    <h4>{name}</h4>
    <p>{tagline}</p>
  </article>;
}

function ComparisonCategory({ category }) {
  return <section className="comparison-category">
    <div className="comparison-category-info">
      <h4>{category.label}</h4>
      <div>{category.features.map((feature) => <span key={feature.label}>{feature.label}</span>)}</div>
    </div>
    <div className="comparison-category-values">
      {experiences.map(({ source, name }, index) => <div className={`comparison-value-column${index === 2 ? ' is-recommended' : ''}`} key={name}>
        {category.features.map((feature) => <p key={feature.label}>{feature.getValue(source)}</p>)}
      </div>)}
    </div>
  </section>;
}

export default function CardsSection({ onOpenChat }) {
  return <section className="cards-section" id="cards">
    <p className="section-label">Encontrá tu experiencia</p>
    <div className="cs-head"><h2 className="cs-title">Compará nuestras experiencias</h2><p className="cs-sub">Una lectura simple de los beneficios disponibles en esta experiencia local de demostración.</p></div>
    <div className="comparison-matrix" aria-label="Comparación de productos de demostración">
      <div className="comparison-intro"><span className="section-label">Elegí con claridad</span><h3>Todo lo que necesitás, en un solo lugar.</h3><p>Revisá las diferencias entre cada experiencia.</p></div>
      <div className="comparison-product-headers">{experiences.map((experience, index) => <ProductHeader key={experience.name} experience={experience} index={index} />)}</div>
      <div className="comparison-categories">{comparisonCategories.map((category) => <ComparisonCategory key={category.label} category={category} />)}</div>
    </div>
    <div className="cs-footnote"><button className="cs-compare-all" onClick={() => onOpenChat('Compará mis tarjetas para viajar')}>Comparar en el asistente</button><span>Experiencia completamente local de demostración.</span></div>
  </section>;
}
