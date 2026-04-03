import { createYoClient } from "@yo-protocol/core";

// Adresa yoUSD vaultu (stejná na Ethereum i Base)
const YOUSD_VAULT_ADDRESS = "0x0000000f2eb9f69274678c76222b35eec7588a65";

/**
 * Formátování USD (např. 69030000 → $69.03M)
 */
function formatUsd(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Načte TVL pro jednu síť
 */
async function getTvlForChain(
  chainId: number,
  vaultAddress: string
): Promise<number> {
  const client = createYoClient({ chainId });
  const snapshot = await client.getVaultSnapshot(vaultAddress);
  return Number(snapshot.tvl || 0);
}

/**
 * Načte TOTAL TVL (Ethereum + Base) pro yoUSD vault
 */
export async function getTotalTvl() {
  const [ethTvl, baseTvl] = await Promise.all([
    getTvlForChain(1, YOUSD_VAULT_ADDRESS), // Ethereum
    getTvlForChain(8453, YOUSD_VAULT_ADDRESS), // Base
  ]);

  const total = ethTvl + baseTvl;

  return {
    ethTvl,
    baseTvl,
    total,
    formatted: formatUsd(total),
  };
}

/**
 * Načte TVL pro konkrétní síť
 */
export async function getTvlForNetwork(params: {
  chainId: number;
  vaultAddress?: string;
}) {
  const { chainId, vaultAddress = YOUSD_VAULT_ADDRESS } = params;
  const tvl = await getTvlForChain(chainId, vaultAddress);
  
  return {
    tvl,
    formatted: formatUsd(tvl),
  };
}

/**
 * Vrátí adresu yoUSD vaultu
 */
export function getYoUsdVaultAddress(): string {
  return YOUSD_VAULT_ADDRESS;
}