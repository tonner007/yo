import { parseUnits } from 'viem';
import { getSupportedChainId, YOUSD_VAULT_ADDRESS } from '../lib/yo';
import { CHAIN_MAP, getPublicClient } from './web3';
import { ensureWalletChain } from './tx';

// Use YOUSD vault contract directly (same as original YO app)
const VAULT_ADDRESS = '0x0000000f2eb9f69274678c76222b35eec7588a65';


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

  await ensureWalletChain({
    walletClient,
    switchNetwork,
    network,
    chainId,
    targetChain,
    fallbackMessage: `Please switch wallet to ${network}`,
  });

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