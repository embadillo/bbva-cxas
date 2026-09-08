import { mockMarketplace, mockProducts } from '../../data/mockProducts';
import { normalizeConversationResponse } from './normalizeConversationResponse';

const response = (text, payloads = [], metadata = {}) => normalizeConversationResponse({ text, payloads, metadata });

export async function sendMockConversationTurn(text, context = {}) {
  const input = String(text || '').trim();
  const lower = input.toLocaleLowerCase('es-AR');
  const selected = mockProducts[0];

  if (!input) return response('Contame qué viaje estás planeando y te ayudo a orientarte.');
  if (lower.includes('reiniciar') || lower.includes('reset')) return response('Reinicié la demostración. Podemos empezar de nuevo cuando quieras.', [], { reset: true });
  if (lower.includes('compar') || lower.includes('tarjeta') || lower.includes('travel')) {
    return response('Encontré dos opciones de demostración para comparar. Los beneficios y valores son ilustrativos.', [{ type: 'product_comparison', products: mockProducts }], { intent: 'comparison' });
  }
  if (lower.includes('prote') || lower.includes('estim')) {
    return response('Preparé un estimado ilustrativo para tu plan de viaje. No es una cotización ni una póliza real.', [{ type: 'trip_estimate', amount: 12500, currency: 'ARS', label: 'Protección de viaje de demostración' }], { intent: 'estimate' });
  }
  if (lower.includes('solic') || lower.includes('aplicar') || lower.includes('avanz')) {
    return response(`Podés iniciar una solicitud de demostración para ${selected.name}. La aprobación siguiente es simulada y no crea un producto real.`, [{ type: 'application_summary', product: selected }], { intent: 'application' });
  }
  if (lower.includes('activ')) {
    return response('La tarjeta está lista para una activación simulada dentro de esta demo.', [{ type: 'activation', product: selected }], { intent: 'activation' });
  }
  if (lower.includes('market') || lower.includes('recomp') || lower.includes('punto')) {
    return response('Este es el Marketplace local de demostración. Elegí una experiencia para ver cómo se actualizaría tu plan.', [{ type: 'marketplace', items: mockMarketplace }], { intent: 'marketplace' });
  }
  if (lower.includes('viaj') || lower.includes('trip') || lower.includes('argentin')) {
    return response('Entiendo: estás planificando un viaje. Puedo revisar tu tarjeta actual, comparar una opción Travel, estimar una protección ilustrativa y acompañarte en el recorrido.', [{ type: 'quick_actions', actions: [
      { label: 'Comparar tarjetas', value: 'Compará mis tarjetas para viajar' },
      { label: 'Ver estimado', value: 'Mostrame un estimado de protección' },
      { label: 'Ver Marketplace', value: 'Quiero conocer el Marketplace' },
    ] }], { intent: 'trip' });
  }
  return response('Puedo ayudarte a planificar un viaje, comparar tarjetas, guardar un estimado ilustrativo, iniciar una solicitud de demostración o explorar el Marketplace.');
}
