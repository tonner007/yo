import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { WalletProvider } from '@/contexts/WalletContext';

const LazyWagmiProvider = lazy(() => import('./WagmiProvider'));
const LazyWalletWeb3Provider = lazy(() => import('@/contexts/WalletContext.web3').then((module) => ({ default: module.WalletWeb3Provider })));

function Web3Providers({ children, ensureWeb3Ready, fallback }) {
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

  const ensureWeb3Ready = useCallback(async () => {
    setWeb3Enabled(true);
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
