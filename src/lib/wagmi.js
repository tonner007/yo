import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'YO App - DeFi Dashboard',
  projectId: 'c26c9023adafab5ea77eb04a0f7d050e', // Your project ID
  chains: [mainnet, base],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
  },
});