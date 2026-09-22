import { normalizeAction } from './widgetRegistry';

export default function AzulMainMenu({ actions = [], copy, fallbackText = '', onAction, disabled = false }) {
  const currentCopy = copy && typeof copy === 'object' ? copy : {};
  const copyValues = [currentCopy.greeting, currentCopy.guidance, currentCopy.question].filter((value) => String(value || '').trim());
  if (!copyValues.length && fallbackText) copyValues.push(String(fallbackText));
  return <nav className="azul-main-menu" aria-label="Opciones principales de Azul">
    {copyValues.length > 0 && <div className="azul-main-menu-copy">
      {copyValues.map((value, index) => <p key={`menu-copy-${index}`} className={index === copyValues.length - 1 ? 'azul-main-menu-copy-question' : ''}>{value}</p>)}
    </div>}
    <div className="bbva-widget quick-actions-widget azul-main-menu-actions">
      {actions.map((rawAction, index) => {
      const action = normalizeAction(rawAction);
      return <button
        type="button"
        className="cp-ai-pill"
        key={`${action.utterance}-${index}`}
        disabled={disabled || !action.utterance}
        onClick={() => onAction?.(action.utterance)}
      >
        <strong>{action.label}</strong>
        {action.description && <small>{action.description}</small>}
      </button>;
      })}
    </div>
  </nav>;
}
