import { demoCustomer } from '../data/mockCustomers';
import { mockCurrentCard, mockMarketplace, mockProducts } from '../data/mockProducts';
import { mockTransactions } from '../data/mockTransactions';

const delay = (value, ms = 180) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
const demoId = (prefix) => `${prefix}_${Date.now().toString(36).toUpperCase()}`;

export const getMockCustomer = () => delay({ ...demoCustomer });
export const getMockCards = () => delay([{ ...mockCurrentCard }]);
export const getMockProducts = () => delay(mockProducts.map((product) => ({ ...product })));
export const getMockProductComparison = () => delay(mockProducts.map((product) => ({ ...product })));
export const getMockActivity = (activity = []) => delay([...mockTransactions, ...activity]);
export const submitMockApplication = (productId) => delay({
  id: demoId('APP_DEMO'), productId, status: 'mock_approved',
  emailStatus: 'mock_sent', cardStatus: 'ready_for_demo_activation',
});
export const runMockCreditDecision = () => delay({ status: 'mock_approved', label: 'Solicitud de demostración aprobada' });
export const activateMockCard = (cardId) => delay({ cardId, status: 'active', label: 'Activación simulada' });
export const createMockMarketplacePurchase = (item) => delay({
  confirmationId: demoId('DEMO'), itemId: item.id, amount: item.amount,
  points: item.points, label: 'Compra de demostración', noCharge: true,
});
export const getMockMarketplace = () => delay(mockMarketplace.map((item) => ({ ...item })));
