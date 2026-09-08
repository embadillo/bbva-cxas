// BBVA Argentina product catalogue. Commercial values remain configurable so
// unapproved conditions are never presented as current offers.
const PENDING = 'Dato pendiente de aprobación';

export const CARD_CATEGORIES = {
  premium_travel: { label: 'Viajes', blurb: 'Opciones para quienes viajan con frecuencia.' },
  everyday:       { label: 'Uso cotidiano', blurb: 'Beneficios para tus compras de todos los días.' },
  starter:        { label: 'Primeras tarjetas', blurb: 'Información para comenzar a elegir.' },
};

export const CARD_CATALOG = [
  {
    card_id: 'bbva-black-plus-travel', card_name: 'Black+ Travel', network: 'Visa', tier: 'Black+',
    category: 'premium_travel', tagline: 'Una propuesta pensada para acompañar tus viajes.',
    annual_fee: null, annual_fee_display: PENDING, apr_purchase: PENDING, apr_cash_advance: PENDING,
    foreign_tx_fee: PENDING, min_income: null, min_credit_score: null, recommended_limit: null,
    welcome_offer: PENDING, top_rewards: 'Beneficios y recompensas: dato pendiente de aprobación', credits: PENDING,
    rewards: [PENDING], perks: ['Beneficios para viajes: dato pendiente de aprobación', 'Asistencias asociadas: dato pendiente de aprobación'],
    best_for: ['Viajes', 'Experiencias', 'Uso internacional'], fit_score_base: 0,
    accent: '#062e6f', accent_2: '#1464c4',
  },
  {
    card_id: 'bbva-classic', card_name: 'Tarjeta BBVA', network: 'Visa', tier: 'Clásica',
    category: 'everyday', tagline: 'Una opción para resolver tus compras cotidianas.',
    annual_fee: null, annual_fee_display: PENDING, apr_purchase: PENDING, apr_cash_advance: PENDING,
    foreign_tx_fee: PENDING, min_income: null, min_credit_score: null, recommended_limit: null,
    welcome_offer: PENDING, top_rewards: 'Beneficios y recompensas: dato pendiente de aprobación', credits: PENDING,
    rewards: [PENDING], perks: ['Beneficios cotidianos: dato pendiente de aprobación'],
    best_for: ['Compras diarias', 'Practicidad'], fit_score_base: 0,
    accent: '#0a438f', accent_2: '#3b82c4',
  },
  {
    card_id: 'bbva-starter', card_name: 'Tarjeta BBVA Inicial', network: 'Visa', tier: 'Inicial',
    category: 'starter', tagline: 'Información para dar tus primeros pasos.',
    annual_fee: null, annual_fee_display: PENDING, apr_purchase: PENDING, apr_cash_advance: PENDING,
    foreign_tx_fee: PENDING, min_income: null, min_credit_score: null, recommended_limit: null,
    welcome_offer: PENDING, top_rewards: 'Beneficios y recompensas: dato pendiente de aprobación', credits: PENDING,
    rewards: [PENDING], perks: ['Condiciones de acceso: dato pendiente de aprobación'],
    best_for: ['Primer producto', 'Uso cotidiano'], fit_score_base: 0,
    accent: '#174a7e', accent_2: '#5b9acb',
  },
];

export const findCard = (id) => CARD_CATALOG.find((card) => card.card_id === id) ?? null;
export const cardsByCategory = (category) => CARD_CATALOG.filter((card) => card.category === category);
