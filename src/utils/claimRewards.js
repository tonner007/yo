import { getYoClient } from '../lib/yo';
import { CHAIN_MAP, getPublicClient } from './web3';
import { buildTxRequest, ensureWalletChain } from './tx';

export async function executeClaimRewards({ network = 'base', userAddress, walletClient, switchNetwork }) {
  if (!userAddress) throw new Error('Wallet not connected');
  if (!walletClient) throw new Error('Wallet client unavailable');

  // Merkl reward claim is always on Base
  const chainId = 8453;
  const targetChain = CHAIN_MAP[chainId];

  if (walletClient.chain?.id !== chainId) {
    const switched = await switchNetwork?.('base');
    if (!switched?.success) {
      throw new Error(switched?.error || 'Please switch wallet to Base');
    }
  }

  const publicClient = getPublicClient(chainId);
  const yoClient = await getYoClient('base');
  const chainRewards = await yoClient.getClaimableRewards(userAddress);

  if (!chainRewards?.rewards?.length) {
    throw new Error('No claimable rewards');
  }

  const tx = yoClient.prepareClaimMerklRewards(userAddress, chainRewards);
  const request = await buildTxRequest(publicClient, walletClient, targetChain, userAddress, tx);
  const hash = await walletClient.sendTransaction(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  return {
    success: true,
    hash,
    receipt,
    chainId,
    network,
  };
}
