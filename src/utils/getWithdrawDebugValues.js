import { createYoClient, getShareBalance } from '@yo-protocol/core';
import { createPublicClient, formatUnits, http, isAddress, fallback } from 'viem';
import { base, mainnet } from 'viem/chains';
import { getSupportedChainId, YOUSD_VAULT_ADDRESS, getUserHistoryForNetwork } from '../lib/yo';

const ERC4626_ABI = [
  {
    type: 'function',
    name: 'maxWithdraw',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalAssets',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

function formatUsdFrom6(value, decimals = 2) {
  const amount = Number(formatUnits(value ?? 0n, 6));
  return {
    raw: amount,
    formatted: `$${amount.toFixed(decimals)}`,
  };
}

function formatTokenFrom6(value) {
  const amount = Number(formatUnits(value ?? 0n, 6));
  return amount.toFixed(6);
}

function getHistoryAmount(item) {
  const formatted = item?.assets?.formatted;
  const value = Number(formatted ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function sumHistory(history = []) {
  let totalDeposited = 0;
  let totalWithdrawn = 0;

  for (const item of history) {
    const type = String(item?.type ?? '').toLowerCase();
    const amount = getHistoryAmount(item);

    if (type.includes('deposit')) totalDeposited += amount;
    if (type.includes('withdraw') || type.includes('redeem')) totalWithdrawn += amount;
  }

  return {
    totalDeposited,
    totalWithdrawn,
    netDeposits: totalDeposited - totalWithdrawn,
  };
}

export async function getWithdrawDebugValues({ chainId, vaultAddress, userAddress }) {
  if (!userAddress || !isAddress(userAddress)) {
    return {
      shares: 0n,
      totalBalanceDebug: 0n,
      maxWithdrawableDebug: 0n,
      vaultTotalAssets: 0n,
      totalBalanceDebugFormatted: '$0.00',
      maxWithdrawableDebugFormatted: '$0.00',
      vaultTotalAssetsFormatted: '$0.00',
      sharesFormatted: '0.000000',
      differenceFormatted: '$0.00',
      estimatedFeeFormatted: '$0.00',
      estimatedFeePercentFormatted: '0.000000%',
      estimatedFeePercentVsMaxFormatted: '0.000000%',
      totalDepositedFormatted: '$0.00',
      totalWithdrawnFormatted: '$0.00',
      netDepositsFormatted: '$0.00',
      grossProfitFormatted: '$0.0000',
      exchangeRateMaxFormatted: '0.000000',
      exchangeRateQuoteFormatted: '0.000000',
      exchangeRateMaxRaw: 0,
      exchangeRateQuoteRaw: 0,
      grossProfitInSharesFormatted: '0.000000',
    };
  }

  const chain = chainId === 1 ? mainnet : base;
  const transport = chainId === 8453
    ? fallback([
        http('https://base.publicnode.com'),
        http('https://base-rpc.publicnode.com'),
        http('https://base.gateway.tenderly.co'),
        http('https://mainnet.base.org'),
      ])
    : http();

  const client = createYoClient({ chainId });
  const publicClient = createPublicClient({
    chain,
    transport,
  });

  const shares = await getShareBalance(publicClient, vaultAddress, userAddress);

  const totalBalanceDebug =
    shares > 0n ? await client.quotePreviewRedeem(vaultAddress, shares) : 0n;

  const network = chainId === 1 ? 'ethereum' : 'base';

  const [maxWithdrawableDebug, vaultTotalAssets, history] = await Promise.all([
    publicClient.readContract({
      address: vaultAddress,
      abi: ERC4626_ABI,
      functionName: 'maxWithdraw',
      args: [userAddress],
    }),
    publicClient.readContract({
      address: vaultAddress,
      abi: ERC4626_ABI,
      functionName: 'totalAssets',
    }),
    getUserHistoryForNetwork(network, userAddress, vaultAddress, 100),
  ]);

  const totalBalanceDebugValue = formatUsdFrom6(totalBalanceDebug).raw;
  const maxWithdrawableDebugValue = formatUsdFrom6(maxWithdrawableDebug).raw;
  const difference = Math.abs(totalBalanceDebugValue - maxWithdrawableDebugValue);
  const estimatedFee = difference;
  const historySummary = sumHistory(history);
  const grossProfit = maxWithdrawableDebugValue - historySummary.netDeposits;
  const sharesNumber = Number(formatUnits(shares ?? 0n, 6));
  const exchangeRateMax = sharesNumber > 0 ? maxWithdrawableDebugValue / sharesNumber : 0;
  const exchangeRateQuote = sharesNumber > 0 ? totalBalanceDebugValue / sharesNumber : 0;
  const grossProfitInShares = exchangeRateMax > 0 ? grossProfit / exchangeRateMax : 0;
  const estimatedFeePercent = totalBalanceDebugValue > 0
    ? (estimatedFee / totalBalanceDebugValue) * 100
    : 0;
  const estimatedFeePercentVsMax = maxWithdrawableDebugValue > 0
    ? (estimatedFee / maxWithdrawableDebugValue) * 100
    : 0;

  return {
    shares,
    totalBalanceDebug,
    maxWithdrawableDebug,
    vaultTotalAssets,
    totalBalanceDebugFormatted: formatUsdFrom6(totalBalanceDebug, 4).formatted,
    maxWithdrawableDebugFormatted: formatUsdFrom6(maxWithdrawableDebug, 4).formatted,
    vaultTotalAssetsFormatted: formatUsdFrom6(vaultTotalAssets).formatted,
    sharesFormatted: formatTokenFrom6(shares),
    differenceFormatted: `$${difference.toFixed(2)}`,
    estimatedFeeFormatted: `$${estimatedFee.toFixed(4)}`,
    estimatedFeePercentFormatted: `${estimatedFeePercent.toFixed(6)}%`,
    estimatedFeePercentVsMaxFormatted: `${estimatedFeePercentVsMax.toFixed(6)}%`,
    totalDepositedFormatted: `$${historySummary.totalDeposited.toFixed(4)}`,
    totalWithdrawnFormatted: `$${historySummary.totalWithdrawn.toFixed(4)}`,
    netDepositsFormatted: `$${historySummary.netDeposits.toFixed(4)}`,
    grossProfitFormatted: `$${grossProfit.toFixed(4)}`,
    exchangeRateMaxFormatted: `${exchangeRateMax.toFixed(6)}`,
    exchangeRateQuoteFormatted: `${exchangeRateQuote.toFixed(6)}`,
    exchangeRateMaxRaw: exchangeRateMax,
    exchangeRateQuoteRaw: exchangeRateQuote,
    grossProfitInSharesFormatted: `${grossProfitInShares.toFixed(6)}`,
  };
}

export async function getWithdrawDebugValuesForNetwork(network, userAddress) {
  const chainId = getSupportedChainId(network);
  return getWithdrawDebugValues({
    chainId,
    vaultAddress: YOUSD_VAULT_ADDRESS,
    userAddress,
  });
}
