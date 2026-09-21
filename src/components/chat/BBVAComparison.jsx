import { getCardImage } from './cardImageRegistry';

function isHttpUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function renderSpec(spec) {
  if (spec?.text) return <span>{spec.text}</span>;
  if (spec?.anchor?.displayText && isHttpUrl(spec.anchor.target)) {
    const label = /ver producto/i.test(spec.anchor.displayText) ? 'Ver más' : spec.anchor.displayText;
    const isMoreLink = label === 'Ver más';
    return <a className={isMoreLink ? 'bbva-comparison__more-link' : undefined} href={spec.anchor.target} target="_blank" rel="noopener noreferrer">{label}</a>;
  }
  if (spec?.image?.rawUrl && isHttpUrl(spec.image.rawUrl)) {
    return <img src={spec.image.rawUrl} alt={spec.image.altText || ''} />;
  }
  return <span>—</span>;
}

function renderFeatureSpec(spec, featureLabel) {
  if (/pases vip y millas por usd/i.test(String(featureLabel || '')) && spec?.passesText && spec?.milesText) {
    const miles = Number.parseInt(String(spec.milesText), 10) || 0;
    return <span>{spec.passesText} · USD 1 de consumo = <strong>{miles} {miles === 1 ? 'Milla' : 'Millas'} BBVA</strong></span>;
  }
  if (!/mantenimiento/i.test(String(featureLabel || '')) || !spec?.text) {
    return renderSpec(spec);
  }
  const text = String(spec.text).replace(
    /\s+por mes\b/i,
    ' (bonificado los primeros 3 meses)',
  );
  return renderSpec({ ...spec, text });
}

function productIdOf(product) {
  return product?.productId || product?.id || '';
}

function isTravelProduct(product) {
  const identity = `${productIdOf(product)} ${product?.title || ''}`.toLowerCase();
  return identity.includes('travel');
}

function featureLabelOf(feature) {
  const label = String(feature?.label || '—');
  if (/tarjetas incluidas/i.test(label)) return 'Tarjetas';
  if (/bonificaci[oó]n con tu perfil/i.test(label)) return 'Tu paquete 100% bonificado';
  return label;
}

function visibleFeatures(features) {
  const source = Array.isArray(features) ? features : [];
  const miles = source.find((feature) => /millas por usd/i.test(String(feature?.label || '')));
  return source
    .filter((feature) => !/mercado libre|millas por usd|fast pass/i.test(String(feature?.label || '')))
    .map((feature) => {
      if (!/pases vip/i.test(String(feature?.label || '')) || !miles) return feature;
      return {
        ...feature,
        label: 'Pases VIP y Millas por USD',
        productSpecs: feature.productSpecs.map((spec, index) => {
          const milesSpec = miles.productSpecs?.[index];
          if (!milesSpec?.text) return spec;
          return {
            ...spec,
            passesText: spec?.text || '',
            milesText: milesSpec.text,
          };
        }),
      };
    });
}

export default function BBVAComparison({ title, productDetails = [], features = [], onAction, disabled = false }) {
  const products = Array.isArray(productDetails) ? productDetails : [];
  const comparisonFeatures = visibleFeatures(features);
  const gridStyle = { '--bbva-comparison-products': products.length || 1 };

  return <section className="bbva-comparison" aria-label="Comparación de productos BBVA">
    <div className="bbva-comparison__scroll" role="region" aria-label="Detalle comparativo" tabIndex="0">
      <div className="bbva-comparison__grid" style={gridStyle}>
        <header className="bbva-comparison__corner bbva-comparison__header">
          <span className="bbva-comparison__eyebrow">Comparación de productos</span>
          <h3>{title || 'Compará tus productos'}</h3>
        </header>
        {products.map((product, index) => {
          const image = getCardImage(productIdOf(product), product?.imageUris);
          const isRecommended = isTravelProduct(product);
          return <article key={`${productIdOf(product)}-${index}`} className={`bbva-comparison__product${isRecommended ? ' bbva-comparison__product--recommended' : ''}`}>
            <div className="bbva-comparison__image-stage">
              {image ? <img src={image} alt={product?.title || ''} /> : <span className="bbva-comparison__image-placeholder" aria-hidden="true">BBVA</span>}
            </div>
            <h4>{product?.title || 'Producto'}</h4>
            {product?.subtitle && <p className="bbva-comparison__subtitle">{product.subtitle}</p>}
            {product?.ctaLabel && product?.ctaUtterance && <button type="button" className="bbva-comparison__cta" disabled={disabled} onClick={() => onAction?.(product.ctaUtterance)}>{product.ctaLabel}</button>}
          </article>;
        })}

        {comparisonFeatures.map((feature, featureIndex) => <div className="bbva-comparison__feature-row" key={feature?.label || featureIndex}>
          <strong className="bbva-comparison__feature-label">{featureLabelOf(feature)}</strong>
          {products.map((_product, productIndex) => <div className="bbva-comparison__cell" key={`${featureIndex}-${productIndex}`}>{renderFeatureSpec(feature?.productSpecs?.[productIndex], feature?.label)}</div>)}
        </div>)}
      </div>
    </div>
  </section>;
}
