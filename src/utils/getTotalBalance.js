import { formatUnits, isAddress } from 'viem';
import { getSupportedChainId, getYoClient, getSafeAddress, YOUSD_VAULT_ADDRESS } from '../lib/yo';

export async function getTotalBalance(chainId, vaultAddress, account) {
  try {
    if (!account || !isAddress(account)) {
      return {
        shares: 0n,
        assets: 0n,
        formatted: '$0.00',
        raw: 0,
      };
    }

    const network = Object.entries({ ethereum: 1, base: 8453, arbitrum: 42161 }).find(([, id]) => id === chainId)?.[0] ?? 'ethereum';
    const client = getYoClient(network);
    const safeVaultAddress = getSafeAddress(vaultAddress);

    const shares = await client.getShareBalance(safeVaultAddress, account);
    const assets = shares > 0n
      ? await client.quotePreviewRedeem(safeVaultAddress, shares)
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
  const chainId = getSupportedChainId(network);
  return getTotalBalance(chainId, YOUSD_VAULT_ADDRESS, account);
}
