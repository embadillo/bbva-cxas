const pending = 'Valor de demostración';

export const mockProducts = [
  {
    id: 'bbva-demo-travel', name: 'BBVA Travel — configuración demo', tier: 'Black+',
    tagline: 'Una propuesta ilustrativa para acompañar tus viajes.', category: 'Viajes',
    annualFee: pending, travelBenefit: 'Beneficio ilustrativo para viajes',
    rewards: '5x puntos ilustrativos en categorías seleccionadas', eligibility: 'Sujeto a configuración comercial',
    accent: '#072146', accent2: '#1464c4',
  },
  {
    id: 'bbva-demo-clasica', name: 'Tarjeta BBVA — configuración demo', tier: 'Clásica',
    tagline: 'Una referencia local para tus compras cotidianas.', category: 'Uso cotidiano',
    annualFee: pending, travelBenefit: 'Asistencia ilustrativa',
    rewards: '2x puntos ilustrativos en compras seleccionadas', eligibility: 'Sujeto a configuración comercial',
    accent: '#1464c4', accent2: '#62a4d8',
  },
];

export const mockMarketplace = [
  { id: 'hotel-demo', name: 'Noche de hotel de demostración', amount: 95000, points: 9500, category: 'Viajes' },
  { id: 'transfer-demo', name: 'Traslado de demostración', amount: 32000, points: 3200, category: 'Viajes' },
  { id: 'experience-demo', name: 'Experiencia gastronómica de demostración', amount: 18000, points: 1800, category: 'Experiencias' },
];

export const mockCurrentCard = {
  id: 'bbva-demo-clasica', name: 'Tarjeta BBVA — configuración demo', status: 'active',
  summary: 'Producto actual de demostración',
};
