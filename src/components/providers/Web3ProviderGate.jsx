import { lazy, Suspense, useCallback, useMemo, useState, useEffect } from 'react';
import { WalletProvider } from '@/contexts/WalletContext';

let web3ReadyPromise = null;
let resolveWeb3ReadyPromise = null;

function createWeb3ReadyPromise() {
  if (!web3ReadyPromise) {
    web3ReadyPromise = new Promise((resolve) => {
      resolveWeb3ReadyPromise = resolve;
    });
  }
  return web3ReadyPromise;
}

function markWeb3Ready() {
  if (resolveWeb3ReadyPromise) {
    resolveWeb3ReadyPromise();
    resolveWeb3ReadyPromise = null;
  }
}

// Prefetch web3 chunks after page load
const prefetchWeb3 = () => {
  // Start loading web3 chunks in background
  import('./WagmiProvider');
  import('@/contexts/WalletContext.web3');
};

const LazyWagmiProvider = lazy(() => import('./WagmiProvider'));
const LazyWalletWeb3Provider = lazy(() => import('@/contexts/WalletContext.web3').then((module) => ({ default: module.WalletWeb3Provider })));

function Web3Providers({ children, ensureWeb3Ready, fallback }) {
  useEffect(() => {
    markWeb3Ready();
  }, []);

  return (
    <Suspense fallback={fallback}>
      <LazyWagmiProvider>
        <LazyWalletWeb3Provider ensureWeb3Ready={ensureWeb3Ready}>
          {children}
        </LazyWalletWeb3Provider>
      </LazyWagmiProvider>
    </Suspense>
  );
}

export function Web3ProviderGate({ children }) {
  const [web3Enabled, setWeb3Enabled] = useState(false);
  
  // Prefetch web3 chunks after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[Web3ProviderGate] Prefetching web3 chunks...');
      prefetchWeb3();
    }, 500); // Wait 500ms after page load
    
    return () => clearTimeout(timer);
  }, []);

  const ensureWeb3Ready = useCallback(async () => {
    createWeb3ReadyPromise();
    setWeb3Enabled(true);
    await web3ReadyPromise;
    return { success: true };
  }, []);

  const fallbackValue = useMemo(() => ({
    web3Ready: web3Enabled,
    ensureWeb3Ready,
    connectWallet: ensureWeb3Ready,
  }), [web3Enabled, ensureWeb3Ready]);

  const content = <WalletProvider value={fallbackValue}>{children}</WalletProvider>;

  if (!web3Enabled) {
    return content;
  }

  return (
    <Web3Providers ensureWeb3Ready={ensureWeb3Ready} fallback={content}>
      {children}
    </Web3Providers>
  );
}
