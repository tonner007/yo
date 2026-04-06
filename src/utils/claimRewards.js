import { createPublicClient, fallback, http } from 'viem';
import { mainnet, base, arbitrum } from 'viem/chains';
import { getSupportedChainId, getYoClient } from '../lib/yo';

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

function getPublicClient(chainId) {
  return createPublicClient({
    chain: CHAIN_MAP[chainId] ?? mainnet,
    transport: getTransport(chainId),
  });
}

async function buildTxRequest(publicClient, walletClient, targetChain, userAddress, tx) {
  const baseRequest = {
    account: walletClient.account,
    to: tx.to,
    data: tx.data,
    value: tx.value ?? 0n,
    chain: targetChain,
  };

  try {
    const gas = await publicClient.estimateGas({
      account: userAddress,
      to: tx.to,
      data: tx.data,
      value: tx.value ?? 0n,
    });

    const fees = await publicClient.estimateFeesPerGas();

    return {
      ...baseRequest,
      gas: (gas * 120n) / 100n,
      ...(fees.maxFeePerGas ? { maxFeePerGas: fees.maxFeePerGas } : {}),
      ...(fees.maxPriorityFeePerGas ? { maxPriorityFeePerGas: fees.maxPriorityFeePerGas } : {}),
      ...(fees.gasPrice ? { gasPrice: fees.gasPrice } : {}),
    };
  } catch {
    return baseRequest;
  }
}

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
