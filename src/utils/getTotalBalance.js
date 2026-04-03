import { createYoClient } from '@yo-protocol/core';
import { formatUnits, isAddress } from 'viem';
import { YOUSD_VAULT_ADDRESS, getSupportedApyChainId } from './getSevenDayApy';

export async function getTotalBalance(chainId, vaultAddress, account) {
  try {
    if (!account || !isAddress(account)) {
      return {
        shares: 0n,
        assets: 0n,
        formatted: '$0.00',
      };
    }

    const client = createYoClient({ chainId });
    const shares = await client.getShareBalance(vaultAddress, account);
    const assets = shares > 0n
      ? await client.quotePreviewRedeem(vaultAddress, shares)
      : 0n;

    const assetsNumber = Number(formatUnits(assets, 6));

    return {
      shares,
      assets,
      formatted: `$${assetsNumber.toFixed(2)}`,
      raw: assetsNumber,
    };
  } catch (error) {
    console.error('Failed to fetch Total Balance from YO SDK:', error);
    return {
      shares: 0n,
      assets: 0n,
      formatted: '$0.00',
      raw: 0,
      error,
    };
  }
}

export async function getTotalBalanceForNetwork(network, account) {
  const chainId = getSupportedApyChainId(network);
  return getTotalBalance(chainId, YOUSD_VAULT_ADDRESS, account);
}
