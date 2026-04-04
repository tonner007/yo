import { getVaultSnapshotForNetwork, formatCompactUsd, parseFormattedValue, YOUSD_VAULT_ADDRESS } from '../lib/yo';

async function getNetworkTvlValue(network: 'ethereum' | 'base'): Promise<number> {
  const snapshot = await getVaultSnapshotForNetwork(network, YOUSD_VAULT_ADDRESS);
  return parseFormattedValue(snapshot?.stats?.tvl);
}

export async function getTotalTvl() {
  const [ethTvl, baseTvl] = await Promise.all([
    getNetworkTvlValue('ethereum'),
    getNetworkTvlValue('base'),
  ]);

  const total = ethTvl + baseTvl;

  return {
    ethTvl,
    baseTvl,
    total,
    formatted: await formatCompactUsd(total),
  };
}

export async function getTvlForNetwork(params: {
  chainId: number;
  vaultAddress?: `0x${string}`;
}) {
  const network = params.chainId === 8453 ? 'base' : 'ethereum';
  const snapshot = await getVaultSnapshotForNetwork(
    network,
    /** @type {`0x${string}`} */ (params.vaultAddress ?? YOUSD_VAULT_ADDRESS)
  );
  const tvl = parseFormattedValue(snapshot?.stats?.tvl);

  return {
    tvl,
    formatted: await formatCompactUsd(tvl),
  };
}

export function getYoUsdVaultAddress(): string {
  return YOUSD_VAULT_ADDRESS;
}
