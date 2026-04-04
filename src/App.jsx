import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Web3ProviderGate } from '@/components/providers/Web3ProviderGate';
import { queryClientInstance } from '@/lib/query-client';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

const Dashboard = lazy(() => import('./pages/Dashboard'));

function AuthenticatedApp() {
  const { isLoadingAuth, authError, navigateToLogin } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <div className="text-2xl font-bold text-red-600 mb-4">Authentication Error</div>
          <div className="text-slate-600 mb-6">{authError.message}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={(
        <div className="fixed inset-0 flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        </div>
      )}
    >
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Web3ProviderGate>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </Web3ProviderGate>
      </QueryClientProvider>
    </AuthProvider>
  );
}
