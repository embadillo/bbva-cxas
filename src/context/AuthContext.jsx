import { createContext, useContext, useMemo, useState } from 'react';
import { demoCustomer } from '../data/mockCustomers';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => ({ ...demoCustomer }));
  const value = useMemo(() => ({
    customer,
    customerId: customer.customerId,
    customerName: customer.firstName,
    authState: customer.authenticated ? 'authenticated' : 'guest',
    isAuthenticated: customer.authenticated,
    demoMode: true,
    signIn: async () => ({ success: true, customer }),
    signOut: () => setCustomer({ ...demoCustomer, authenticated: false }),
    selectDemoProfile: () => setCustomer({ ...demoCustomer }),
  }), [customer]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
