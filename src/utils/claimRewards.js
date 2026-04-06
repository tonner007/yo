import { getYoClient } from '../lib/yo';
import { CHAIN_MAP, getPublicClient } from './web3';
import { ensureWalletChain, sendTransactions } from './tx';

export async function executeClaimRewards({ network = 'base', userAddress, walletClient, switchNetwork }) {
  if (!userAddress) throw new Error('Wallet not connected');
  if (!walletClient) throw new Error('Wallet client unavailable');

  const chainId = 8453; // Merkl reward claim is always on Base
  const targetChain = CHAIN_MAP[chainId];

  await ensureWalletChain({
    walletClient,
    switchNetwork,
    network: 'base',
    chainId,
    targetChain,
    fallbackMessage: 'Please switch wallet to Base',
  });

  const publicClient = getPublicClient(chainId);
  const yoClient = await getYoClient('base');
  const chainRewards = await yoClient.getClaimableRewards(userAddress);

  if (!chainRewards?.rewards?.length) {
    throw new Error('No claimable rewards');
  }

  const tx = yoClient.prepareClaimMerklRewards(userAddress, chainRewards);
  const { hashes, lastResult: receipt } = await sendTransactions({
    publicClient,
    walletClient,
    targetChain,
    userAddress,
    txs: [tx],
  });

  return {
    success: true,
    hash: hashes[0],
    receipt,
    chainId,
    network,
  };
}
