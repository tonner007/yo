import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { useState } from 'react';
import { WagmiProvider as WagmiProviderBase } from 'wagmi';
import { wagmiConfig } from '../../lib/wagmi';

export default function WagmiProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProviderBase config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#bef264',
            accentColorForeground: '#050505',
            borderRadius: 'large',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProviderBase>
  );
}
