import { createPublicClient, fallback, http, parseUnits, maxUint256 } from 'viem';
import { mainnet, base, arbitrum } from 'viem/chains';
import { prepareRedeem, waitForRedeemReceipt } from '@yo-protocol/core';
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
  // Known gas limit for YO gateway redeem transactions
  // Based on historical data from YO app
  const KNOWN_GAS_LIMIT = 250000n;
  
  const baseRequest = {
    account: walletClient.account,
    to: tx.to,
    data: tx.data,
    value: tx.value ?? 0n,
    chain: targetChain,
    gas: KNOWN_GAS_LIMIT, // Fixed known gas limit
  };

  try {
    const fees = await publicClient.estimateFeesPerGas();
    
    return {
      ...baseRequest,
      ...(fees.maxFeePerGas ? { maxFeePerGas: fees.maxFeePerGas } : {}),
      ...(fees.maxPriorityFeePerGas ? { maxPriorityFeePerGas: fees.maxPriorityFeePerGas } : {}),
      ...(fees.gasPrice ? { gasPrice: fees.gasPrice } : {}),
    };
  } catch {
    return baseRequest;
  }
}

// NO APPROVAL - direct redeem only
// We accept the risk of 'likely to fail' warning to avoid approval dialog

export async function executeDirectRedeem({ network = 'base', profitUsd, exchangeRateQuote, userAddress, walletClient, switchNetwork }) {
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
  const gatewayAddress = '0xF1EeE0957267b1A474323Ff9CfF7719E964969FA';

  // Calculate shares from profit amount
  const sharesAmount = profitUsd / exchangeRateQuote;
  const sharesUnits = parseUnits(sharesAmount.toFixed(6), 6);

  // NO APPROVAL - we skip it completely
  const approvalHash = null;

  let prepared;
  try {
    prepared = await prepareRedeem(publicClient, {
      vault: YOUSD_VAULT_ADDRESS,
      owner: userAddress,
      shares: sharesUnits,
      recipient: userAddress,
    });
  } catch (error) {
    if (String(error?.message || '').includes('429') || String(error?.details || '').includes('429')) {
      throw new Error('Base RPC je dočasně přetížené (429). Zkus Claim profit za pár sekund znovu.');
    }
    throw error;
  }

  const txs = Array.isArray(prepared) ? prepared : [prepared];
  if (!txs.length || !txs[0]?.to) {
    throw new Error('Claim profit transaction could not be prepared');
  }

  const hashList = [];
  if (approvalHash) {
    hashList.push(approvalHash);
  }
  
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
    throw new Error('Claim profit transaction finished without redeem receipt');
  }

  if (!redeemReceipt.instant) {
    throw new Error('Claim profit was not instant. Pending redemption flow is not supported in the app yet.');
  }

  return {
    success: true,
    hashes: hashList,
    gateway: gatewayAddress,
    shares: sharesUnits,
    sharesFormatted: sharesAmount.toFixed(6),
    expectedUsdc: profitUsd,
    redeemReceipt,
    hadApproval: !!approvalHash,
  };
}