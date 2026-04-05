import WagmiProvider from './WagmiProvider';
import { WalletWeb3Provider } from '@/contexts/WalletContext.web3';

export function Web3ProviderGate({ children }) {
  return (
    <WagmiProvider>
      <WalletWeb3Provider ensureWeb3Ready={async () => ({ success: true })}>
        {children}
      </WalletWeb3Provider>
    </WagmiProvider>
  );
}
