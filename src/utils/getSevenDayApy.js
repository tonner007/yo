import { getSupportedChainId, getVaultSnapshotForNetwork, parseFormattedValue, YOUSD_VAULT_ADDRESS } from '../lib/yo';

export { YOUSD_VAULT_ADDRESS };

export function getSupportedApyChainId(network = 'ethereum') {
  return getSupportedChainId(network);
}

export async function getSevenDayApy(chainIdOrNetwork, vaultAddress = YOUSD_VAULT_ADDRESS) {
  const network = typeof chainIdOrNetwork === 'number'
    ? Object.entries({ ethereum: 1, base: 8453, arbitrum: 42161 }).find(([, id]) => id === chainIdOrNetwork)?.[0] ?? 'ethereum'
    : chainIdOrNetwork;

  try {
    const snapshot = await getVaultSnapshotForNetwork(network, vaultAddress);
    const apy = parseFormattedValue(snapshot?.stats?.yield?.['7d']);

    return {
      raw: apy,
      formatted: `${apy}`,
      percentage: `${apy.toFixed(2)}%`,
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
