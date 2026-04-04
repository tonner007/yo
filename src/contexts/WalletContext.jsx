import { createContext, useContext, useMemo } from 'react';

const noopAsync = async () => ({ success: false, error: 'Web3 is not loaded yet.' });

const DEFAULT_WALLET_CONTEXT = {
  isConnected: false,
  isConnecting: false,
  userAddress: null,
  network: 'ethereum',
  chainId: 1,
  walletClient: null,
  error: null,
  connectWallet: noopAsync,
  disconnectWallet: async () => {},
  switchNetwork: noopAsync,
  simulateTransaction: async () => {
    throw new Error('Simulated transactions were removed. Use real wallet flow.');
  },
  shortAddress: null,
  currentDemoUser: null,
  web3Ready: false,
  ensureWeb3Ready: async () => ({ success: false, error: 'Web3 loader is unavailable.' }),
};

const WalletContext = createContext(DEFAULT_WALLET_CONTEXT);

export function WalletProvider({ children, value }) {
  const mergedValue = useMemo(
    () => ({ ...DEFAULT_WALLET_CONTEXT, ...(value ?? {}) }),
    [value]
  );

  return (
    <WalletContext.Provider value={mergedValue}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}

export function useWalletConnection() {
  const { isConnected, userAddress, network } = useWallet();
  return { isConnected, userAddress, network };
}

export { DEFAULT_WALLET_CONTEXT };
