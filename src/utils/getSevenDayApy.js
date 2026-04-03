import { createYoClient } from '@yo-protocol/core';

export const YOUSD_VAULT_ADDRESS = '0x0000000f2eb9f69274678c76222b35eec7588a65';

const CHAIN_IDS = {
  ethereum: 1,
  base: 8453,
};

export function getSupportedApyChainId(network = 'ethereum') {
  return CHAIN_IDS[network] ?? 1;
}

export async function getSevenDayApy(chainId, vaultAddress = YOUSD_VAULT_ADDRESS) {
  try {
    const client = createYoClient({ chainId });
    const snapshot = await client.getVaultSnapshot(vaultAddress);
    const apy = Number(
      snapshot?.apy ?? snapshot?.stats?.yield?.['7d'] ?? 0
    );

    return {
      raw: Number.isFinite(apy) ? apy : 0,
      formatted: `${Number.isFinite(apy) ? apy : 0}`,
      percentage: `${(Number.isFinite(apy) ? apy : 0).toFixed(2)}%`,
      source: snapshot,
    };
  } catch (error) {
    console.error('Failed to fetch 7D APY from YO SDK:', error);
    return {
      raw: 0,
      formatted: '0',
      percentage: '0.00%',
      source: null,
      error,
    };
  }
}
