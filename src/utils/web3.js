import { createPublicClient, fallback, http } from 'viem';
import { mainnet, base, arbitrum } from 'viem/chains';

export const CHAIN_MAP = {
  1: mainnet,
  8453: base,
  42161: arbitrum,
};

export function getTransport(chainId) {
  if (chainId === 8453) {
    return fallback([
      http('https://base.publicnode.com'),
      http('https://base-rpc.publicnode.com'),
      http('https://base.gateway.tenderly.co'),
      http('https://1rpc.io/base'),
      http('https://mainnet.base.org'),
    ]);
  }

  return http();
}

export function getPublicClient(chainId) {
  return createPublicClient({
    chain: CHAIN_MAP[chainId] ?? mainnet,
    transport: getTransport(chainId),
  });
}
