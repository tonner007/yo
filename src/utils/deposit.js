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

  if (walletClient.chain?.id !== chainId) {
    const switched = await switchNetwork?.(network);
    if (!switched?.success) {
      throw new Error(switched?.error || `Please switch wallet to ${network}`);
    }
  }

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

  const hashList = [];

  if (!allowanceSufficient && txs.length > 1) {
    if (typeof walletClient.request !== 'function') {
      throw new Error('Wallet nepodporuje batch transaction request pro Deposit.');
    }

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
      throw new Error(batchError?.message || 'Wallet nepodporuje požadovaný Transaction request pro Deposit.');
    }
  }

  for (const tx of txs) {
    const baseRequest = {
      account: walletClient.account,
      to: tx.to,
      data: tx.data,
      value: tx.value ?? 0n,
      chain: targetChain,
    };

    let request = baseRequest;

    try {
      const gas = await publicClient.estimateGas({
        account: userAddress,
        to: tx.to,
        data: tx.data,
        value: tx.value ?? 0n,
      });

      const fees = await publicClient.estimateFeesPerGas();

      request = {
        ...baseRequest,
        gas: (gas * 120n) / 100n,
        ...(fees.maxFeePerGas ? { maxFeePerGas: fees.maxFeePerGas } : {}),
        ...(fees.maxPriorityFeePerGas ? { maxPriorityFeePerGas: fees.maxPriorityFeePerGas } : {}),
        ...(fees.gasPrice ? { gasPrice: fees.gasPrice } : {}),
      };
    } catch {
    }

    const hash = await walletClient.sendTransaction(request);
    hashList.push(hash);
    await publicClient.waitForTransactionReceipt({ hash });
  }

  return {
    success: true,
    hashes: hashList,
    gateway: YO_GATEWAY_ADDRESS,
  };
}
