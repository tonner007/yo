// @ts-nocheck
import { parseUnits } from 'viem';
import { prepareRedeemWithApproval, waitForRedeemReceipt, YO_GATEWAY_ADDRESS } from '@yo-protocol/core';
import { getSupportedChainId, YOUSD_VAULT_ADDRESS } from '../lib/yo';
import { CHAIN_MAP, getPublicClient } from './web3';
import { ensureWalletChain, sendTransactions } from './tx';

export async function executeClaimProfit({ network = 'base', profitUsd, exchangeRateQuote, userAddress, walletClient, switchNetwork }) {
  if (!userAddress) throw new Error('Wallet not connected');
  if (!walletClient) throw new Error('Wallet client unavailable');
  if (!profitUsd || profitUsd <= 0) throw new Error('No profit available to claim');
  if (!exchangeRateQuote || exchangeRateQuote <= 0) throw new Error('Exchange rate unavailable');

  const chainId = getSupportedChainId(network);
  const targetChain = CHAIN_MAP[chainId];
  if (!targetChain) throw new Error(`Unsupported network: ${network}`);

  await ensureWalletChain({
    walletClient,
    switchNetwork,
    network,
    chainId,
    targetChain,
  });

  const publicClient = getPublicClient(chainId);
  const sharesAmount = profitUsd / exchangeRateQuote;
  const sharesUnits = parseUnits(sharesAmount.toFixed(6), 6);

  let prepared;
  try {
    prepared = await prepareRedeemWithApproval(publicClient, {
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

  const txs = Array.isArray(prepared) ? prepared : [prepared];  if (!txs.length || !txs[0]?.to) {
    throw new Error('Claim profit transaction could not be prepared');
  }

  const { hashes: hashList, lastResult: redeemReceipt } = await sendTransactions({
    publicClient,
    walletClient,
    targetChain,
    userAddress,
    txs,
    waitForLastReceipt: (hash) => waitForRedeemReceipt(publicClient, hash),
  });
  if (!redeemReceipt) {
    throw new Error('Claim profit transaction finished without redeem receipt');
  }

  if (!redeemReceipt.instant) {
    throw new Error('Claim profit was not instant. Pending redemption flow is not supported in the app yet.');
  }

  return {
    success: true,
    hashes: hashList,
    gateway: YO_GATEWAY_ADDRESS,
    shares: sharesUnits,
    sharesFormatted: sharesAmount,
    expectedUsdc: profitUsd,
    redeemReceipt,
  };
}
