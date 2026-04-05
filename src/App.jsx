import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Web3ProviderGate } from '@/components/providers/Web3ProviderGate';
import { queryClientInstance } from '@/lib/query-client';
import PageNotFound from './lib/PageNotFound';

const Dashboard = lazy(() => import('./pages/Dashboard'));

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Web3ProviderGate>
        <Router>
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
        </Router>
        <Toaster />
      </Web3ProviderGate>
    </QueryClientProvider>
  );
}
