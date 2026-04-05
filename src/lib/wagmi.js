import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'YO App - DeFi Dashboard',
  projectId: 'c26c9023adafab5ea77eb04a0f7d050e', // Your project ID
  chains: [mainnet, base],
  transports: {
    // Use public RPC endpoints that have CORS enabled for tonner.my.id
    [mainnet.id]: http('https://rpc.ankr.com/eth'),
    [base.id]: http('https://mainnet.base.org'),
  },
  // Disable ENS resolution to avoid CORS errors with eth.merkle.io
  ssr: true,
  batch: { multicall: true },
  // Explicitly disable ENS resolver
  ensResolver: false,
});