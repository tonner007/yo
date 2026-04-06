import { createPublicClient, fallback, http } from 'viem';
import { mainnet, base, arbitrum } from 'viem/chains';
import { getShareBalance } from '@yo-protocol/core';
import { getSupportedChainId, YOUSD_VAULT_ADDRESS } from '../lib/yo';
import { getTotalBalanceForNetwork } from './getTotalBalance';

const CHAIN_MAP = {
  1: mainnet,
  8453: base,
  42161: arbitrum,
};

function getTransport(chainId) {
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

export async function getWithdrawExchangeRate(network, userAddress) {
  if (!userAddress) {
    throw new Error('Wallet not connected');
  }

  const chainId = getSupportedChainId(network);
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId] ?? mainnet,
    transport: getTransport(chainId),
  });

  const [balance, shares] = await Promise.all([
    getTotalBalanceForNetwork(network, userAddress),
    getShareBalance(publicClient, YOUSD_VAULT_ADDRESS, userAddress),
  ]);

  const totalBalance = Number(balance?.raw ?? 0);
  const shareCount = Number(shares ?? 0n) / 1_000_000;

  if (!shareCount || shareCount <= 0 || !totalBalance || totalBalance <= 0) {
    throw new Error('Exchange rate unavailable');
  }

  return totalBalance / shareCount;
}
