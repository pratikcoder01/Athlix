import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import RootLayout from './layouts/RootLayout';
import AppRoutes from './routes/AppRoutes';

// Initialize TanStack query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <RootLayout>
            <AppRoutes />
          </RootLayout>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
