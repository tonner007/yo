import { createPublicClient, fallback, http, parseUnits } from 'viem';
import { mainnet, base, arbitrum } from 'viem/chains';
import { maxRedeem, prepareRedeem, prepareRedeemWithApproval, quotePreviewWithdraw, waitForRedeemReceipt } from '@yo-protocol/core';
import { getSupportedChainId, YOUSD_VAULT_ADDRESS } from '../lib/yo';

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
  } catch (estimateError) {
    console.warn('[withdraw] Gas estimation failed, falling back to raw request:', estimateError);
    return baseRequest;
  }
}

async function checkAllowance(publicClient, vaultAddress, gatewayAddress, userAddress, neededShares) {
  try {
    const allowance = await publicClient.readContract({
      address: vaultAddress,
      abi: [{
        type: 'function',
        name: 'allowance',
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
      }],
      functionName: 'allowance',
      args: [userAddress, gatewayAddress],
    });
    return allowance >= neededShares;
  } catch {
    return false;
  }
}

export async function executeWithdraw({ network = 'base', amount, userAddress, walletClient, switchNetwork, skipApproval = false }) {
  if (!userAddress) throw new Error('Wallet not connected');
  if (!walletClient) throw new Error('Wallet client unavailable');

  const chainId = getSupportedChainId(network);
  const targetChain = CHAIN_MAP[chainId];
  if (!targetChain) throw new Error(`Unsupported network: ${network}`);

  if (walletClient.chain?.id !== chainId) {
    const switched = await switchNetwork?.(network);
    if (!switched?.success) {
      throw new Error(switched?.error || `Please switch wallet to ${network}`);
    }
  }

  const publicClient = getPublicClient(chainId);
  const amountUnits = parseUnits(String(amount), 6);

  const estimatedShares = await quotePreviewWithdraw(publicClient, YOUSD_VAULT_ADDRESS, amountUnits);
  const maxShares = await maxRedeem(publicClient, YOUSD_VAULT_ADDRESS, userAddress);

  if (estimatedShares > maxShares) {
    throw new Error('Insufficient YOUSD balance for this withdraw');
  }

  const gatewayAddress = '0xF1EeE0957267b1A474323Ff9CfF7719E964969FA';
  
  // Check if we have enough allowance
  const hasEnoughAllowance = await checkAllowance(
    publicClient,
    YOUSD_VAULT_ADDRESS,
    gatewayAddress,
    userAddress,
    estimatedShares
  );
  
  let txs;
  if (skipApproval || hasEnoughAllowance) {
    // Direct redeem (no approval needed)
    const prepared = await prepareRedeem(publicClient, {
      vault: YOUSD_VAULT_ADDRESS,
      owner: userAddress,
      shares: estimatedShares,
      recipient: userAddress,
    });
    txs = Array.isArray(prepared) ? prepared : [prepared];
  } else {
    // Standard withdraw with approval
    txs = await prepareRedeemWithApproval(publicClient, {
      vault: YOUSD_VAULT_ADDRESS,
      owner: userAddress,
      shares: estimatedShares,
      recipient: userAddress,
    });
  }

  const hashList = [];
  let redeemReceipt = null;

  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    const request = await buildTxRequest(publicClient, walletClient, targetChain, userAddress, tx);
    const hash = await walletClient.sendTransaction(request);
    hashList.push(hash);

    if (i < txs.length - 1) {
      await publicClient.waitForTransactionReceipt({ hash });
    } else {
      redeemReceipt = await waitForRedeemReceipt(publicClient, hash);
    }
  }

  if (!redeemReceipt) {
    throw new Error('Withdraw transaction finished without redeem receipt');
  }

  if (!redeemReceipt.instant) {
    throw new Error('Redeem was not instant. Pending redemption flow is not supported in the app yet.');
  }

  return {
    success: true,
    hashes: hashList,
    gateway: YO_GATEWAY_ADDRESS,
    shares: estimatedShares,
    redeemReceipt,
  };
}
