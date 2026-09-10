import { getActionIcon, normalizeAction } from './widgetRegistry';

const defaultIcons = {
  card: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></svg>,
  account: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3" /><path d="M5 20c.8-3.2 3.1-5 7-5s6.2 1.8 7 5" /></svg>,
  lock: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>,
  claim: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6z" /><path d="M15 3v4h4M9 12h6M9 16h5" /></svg>,
  shield: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 19 6v5c0 4.6-2.7 8-7 10-4.3-2-7-5.4-7-10V6z" /><path d="m9 12 2 2 4-4" /></svg>,
  products: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>,
};

export default function AzulMainMenu({ actions = [], copy, fallbackText = '', onAction, disabled = false }) {
  const currentCopy = copy && typeof copy === 'object' ? copy : {};
  const copyValues = [currentCopy.greeting, currentCopy.guidance, currentCopy.question].filter((value) => String(value || '').trim());
  if (!copyValues.length && fallbackText) copyValues.push(String(fallbackText));
  return <nav className="azul-main-menu" aria-label="Opciones principales de Azul">
    {copyValues.length > 0 && <div className="azul-main-menu-copy">
      {copyValues.map((value, index) => <p key={`menu-copy-${index}`} className={index === copyValues.length - 1 ? 'azul-main-menu-copy-question' : ''}>{value}</p>)}
    </div>}
    {actions.map((rawAction, index) => {
      const action = normalizeAction(rawAction);
      const iconName = getActionIcon(action) || ['card', 'account', 'lock', 'claim', 'shield', 'products'][index] || 'products';
      return <button
        type="button"
        className="azul-menu-row"
        key={`${action.utterance}-${index}`}
        disabled={disabled || !action.utterance}
        onClick={() => onAction?.(action.utterance)}
      >
        <span className="azul-menu-icon">{defaultIcons[iconName]}</span>
        <span className="azul-menu-copy"><strong>{action.label}</strong>{action.description && <small>{action.description}</small>}</span>
        <span className="azul-menu-chevron" aria-hidden="true">›</span>
      </button>;
    })}
  </nav>;
}
