// @ts-nocheck
import { parseUnits } from 'viem';
import { prepareDeposit, prepareDepositWithApproval, YO_GATEWAY_ADDRESS } from '@yo-protocol/core';
import { getSupportedChainId, YOUSD_VAULT_ADDRESS } from '../lib/yo';
import { CHAIN_MAP, getPublicClient } from './web3';
import { ensureWalletChain, sendTransactions, buildTxRequest } from './tx';

const USDC_BY_CHAIN_ID = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
};


export async function executeDeposit({ network = 'base', amount, userAddress, walletClient, switchNetwork }) {
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
  const amountUnits = parseUnits(String(amount), 6);
  const token = USDC_BY_CHAIN_ID[chainId];

  let txs;
  let allowanceSufficient = false;

  try {
    const allowance = await publicClient.readContract({
      address: token,
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
      args: [userAddress, YO_GATEWAY_ADDRESS],
    });

    allowanceSufficient = allowance >= amountUnits;

    if (allowanceSufficient) {
      const prepared = await prepareDeposit(publicClient, {
        token,
        owner: userAddress,
        vault: YOUSD_VAULT_ADDRESS,
        amount: amountUnits,
        recipient: userAddress,
      });
      txs = Array.isArray(prepared) ? prepared : [prepared];
    } else {
      txs = await prepareDepositWithApproval(publicClient, {
        token,
        owner: userAddress,
        vault: YOUSD_VAULT_ADDRESS,
        amount: amountUnits,
        recipient: userAddress,
      });
    }
  } catch (error) {
    txs = await prepareDepositWithApproval(publicClient, {
      token,
      owner: userAddress,
      vault: YOUSD_VAULT_ADDRESS,
      amount: amountUnits,
      recipient: userAddress,
    });
  }

  // If we need approval and have multiple txs, try wallet_sendCalls for batch Transaction request
  if (!allowanceSufficient && txs.length > 1 && typeof walletClient.request === 'function') {
    try {
      const response = await walletClient.request({
        method: 'wallet_sendCalls',
        params: [{
          version: '2.0.0',
          chainId: `0x${chainId.toString(16)}`,
          from: userAddress,
          atomicRequired: true,
          calls: txs.map((tx) => ({
            to: tx.to,
            data: tx.data,
            value: tx.value ? `0x${tx.value.toString(16)}` : undefined,
          })),
        }],
      });

      return {
        success: true,
        hashes: [],
        gateway: YO_GATEWAY_ADDRESS,
        batchResponse: response,
      };
    } catch (batchError) {
      // If user rejects batch request, fail immediately without fallback to Spending cap request
      throw batchError;
    }
  }

  const { hashes: hashList } = await sendTransactions({
    publicClient,
    walletClient,
    targetChain,
    userAddress,
    txs,
  });

  return {
    success: true,
    hashes: hashList,
    gateway: YO_GATEWAY_ADDRESS,
  };
}
