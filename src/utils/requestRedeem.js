import { createPublicClient, fallback, http, parseUnits } from 'viem';
import { mainnet, base, arbitrum } from 'viem/chains';
import { getSupportedChainId, YOUSD_VAULT_ADDRESS } from '../lib/yo';

const CHAIN_MAP = {
  1: mainnet,
  8453: base,
  42161: arbitrum,
};

// Use YOUSD vault contract directly (same as original YO app)
const VAULT_ADDRESS = '0x0000000f2eb9f69274678c76222b35eec7588a65';

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

/**
 * requestRedeem - Mimics the original YO app's redeem flow
 * Uses the same contract and parameters as the original app
 */
export async function requestRedeem({ network = 'base', profitUsd, exchangeRateQuote, userAddress, walletClient, switchNetwork }) {
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

  // Calculate shares from profit amount (same as before)
  const sharesAmount = profitUsd / exchangeRateQuote;
  const sharesUnits = parseUnits(sharesAmount.toFixed(6), 6);

  // Prepare requestRedeem transaction data (same as original YO app)
  // Function signature: requestRedeem(uint256 shares, address receiver, address owner)
  // Signature: 0x7d41c86e
  const data = `0x7d41c86e${sharesUnits.toString(16).padStart(64, '0')}${userAddress.slice(2).padStart(64, '0')}${userAddress.slice(2).padStart(64, '0')}`;

  // Build transaction request with parameters identical to original YO app
  const request = {
    account: walletClient.account,
    to: VAULT_ADDRESS, // Direct to vault, not gateway
    data,
    value: 0n,
    chain: targetChain,
    gas: 250000n, // Known gas limit for YO redeem
  };

  try {
    // Try to estimate fees (EIP-1559)
    const fees = await publicClient.estimateFeesPerGas();
    
    const finalRequest = {
      ...request,
      ...(fees.maxFeePerGas ? { maxFeePerGas: fees.maxFeePerGas } : {}),
      ...(fees.maxPriorityFeePerGas ? { maxPriorityFeePerGas: fees.maxPriorityFeePerGas } : {}),
    };

    console.log('RequestRedeem sending tx:', {
      to: finalRequest.to,
      gas: finalRequest.gas.toString(),
      maxFeePerGas: finalRequest.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: finalRequest.maxPriorityFeePerGas?.toString(),
    });

    const hash = await walletClient.sendTransaction(finalRequest);
    
    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    // Check if it was a redeem event
    const isRedeem = receipt.logs?.some(log => 
      log.address.toLowerCase() === YOUSD_VAULT_ADDRESS.toLowerCase() &&
      log.topics[0] === '0x5e1c2a5a8e6b8c0e3b8a8e6b8c0e3b8a8e6b8c0e3b8a8e6b8c0e3b8a8e6b8c0e3' // Placeholder for redeem event
    );

    return {
      success: true,
      hash,
      shares: sharesUnits,
      sharesFormatted: sharesAmount.toFixed(6),
      expectedUsdc: profitUsd,
      receipt,
      isRedeem,
    };
  } catch (error) {
    if (String(error?.message || '').includes('429') || String(error?.details || '').includes('429')) {
      throw new Error('Base RPC je dočasně přetížené (429). Zkus Claim profit za pár sekund znovu.');
    }
    throw error;
  }
}