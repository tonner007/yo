import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'YO App - DeFi Dashboard',
  projectId: '3e0a3b1c4b5a5a5a5a5a5a5a5a5a5a5a', // Public test projectId
  chains: [mainnet, base],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
  },
});