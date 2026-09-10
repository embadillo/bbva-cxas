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
    return <a href={spec.anchor.target} target="_blank" rel="noopener noreferrer">{spec.anchor.displayText}</a>;
  }
  if (spec?.image?.rawUrl && isHttpUrl(spec.image.rawUrl)) {
    return <img src={spec.image.rawUrl} alt={spec.image.altText || ''} />;
  }
  return <span>—</span>;
}

function productIdOf(product) {
  return product?.productId || product?.id || '';
}

export default function BBVAComparison({ title, productDetails = [], features = [], onAction, disabled = false }) {
  const products = Array.isArray(productDetails) ? productDetails : [];
  const gridStyle = { '--bbva-comparison-products': products.length || 1 };

  return <section className="bbva-comparison" aria-label="Comparación de productos BBVA">
    <header className="bbva-comparison__header">
      <span className="bbva-comparison__eyebrow">Comparación de productos</span>
      <h3>{title || 'Compará tus productos'}</h3>
    </header>

    <div className="bbva-comparison__scroll" role="region" aria-label="Detalle comparativo" tabIndex="0">
      <div className="bbva-comparison__grid" style={gridStyle}>
        <div className="bbva-comparison__corner" aria-hidden="true" />
        {products.map((product, index) => {
          const image = getCardImage(productIdOf(product), product?.imageUris);
          const isRecommended = /recomendad/i.test(product?.subtitle || '') || Boolean(product?.ctaLabel && product?.ctaUtterance && index > 0);
          return <article key={`${productIdOf(product)}-${index}`} className={`bbva-comparison__product${isRecommended ? ' bbva-comparison__product--recommended' : ''}`}>
            <div className="bbva-comparison__image-stage">
              {image ? <img src={image} alt={product?.title || ''} /> : <span className="bbva-comparison__image-placeholder" aria-hidden="true">BBVA</span>}
            </div>
            <h4>{product?.title || 'Producto'}</h4>
            {product?.subtitle && <p className="bbva-comparison__subtitle">{product.subtitle}</p>}
            {isRecommended && <span className="bbva-comparison__badge">Recomendado</span>}
            {product?.price && <p className="bbva-comparison__price">{product.price}</p>}
            {product?.ctaLabel && product?.ctaUtterance && <button type="button" className="bbva-comparison__cta" disabled={disabled} onClick={() => onAction?.(product.ctaUtterance)}>{product.ctaLabel}</button>}
          </article>;
        })}

        {features.map((feature, featureIndex) => <div className="bbva-comparison__feature-row" key={feature?.label || featureIndex}>
          <strong className="bbva-comparison__feature-label">{feature?.label || '—'}</strong>
          {products.map((_product, productIndex) => <div className="bbva-comparison__cell" key={`${featureIndex}-${productIndex}`}>{renderSpec(feature?.productSpecs?.[productIndex])}</div>)}
        </div>)}
      </div>
    </div>
  </section>;
}
