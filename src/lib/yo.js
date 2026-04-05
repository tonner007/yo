import { isAddress } from 'viem';

// Lazy load YO SDK to reduce initial bundle
const yoSDKPromise = import('@yo-protocol/core').then((module) => ({
  VAULTS: module.VAULTS,
  createYoClient: module.createYoClient,
  formatUsd: module.formatUsd,
}));

async function getYoSDK() {
  return yoSDKPromise;
}

export let YOUSD_VAULT_ADDRESS = '0x0000000f2eb9f69274678c76222b35eec7588a65'; // Real YO USD vault address

async function ensureVaultAddress() {
  if (YOUSD_VAULT_ADDRESS.startsWith('0x123')) {
    const { VAULTS } = await getYoSDK();
    YOUSD_VAULT_ADDRESS = VAULTS.yoUSD.address;
  }
}

export const NETWORK_TO_CHAIN_ID = {
  ethereum: 1,
  base: 8453,
  arbitrum: 42161,
};

export const SUPPORTED_NETWORKS = Object.keys(NETWORK_TO_CHAIN_ID);

export function getSupportedChainId(network = 'ethereum') {
  return NETWORK_TO_CHAIN_ID[network] ?? 1;
}

export async function getYoClient(network = 'ethereum') {
  const { createYoClient } = await getYoSDK();
  return createYoClient({ chainId: getSupportedChainId(network) });
}

export function getSafeAddress(address, fallback = YOUSD_VAULT_ADDRESS) {
  return isAddress(address) ? address : fallback;
}

export async function formatCompactUsd(value) {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  if (safe >= 1_000_000_000) return `$${(safe / 1_000_000_000).toFixed(2)}B`;
  if (safe >= 1_000_000) return `$${(safe / 1_000_000).toFixed(2)}M`;
  if (safe >= 1_000) return `$${(safe / 1_000).toFixed(2)}K`;
  const { formatUsd } = await getYoSDK();
  return formatUsd(safe);
}

export function parseFormattedValue(value) {
  if (value == null) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,%\s,]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'object') {
    return parseFormattedValue(value.raw ?? value.formatted ?? value.value ?? value.amount);
  }
  return 0;
}

export async function getVaultSnapshotForNetwork(network = 'ethereum', vaultAddress = YOUSD_VAULT_ADDRESS) {
  try {
    await ensureVaultAddress();
    const client = await getYoClient(network);
    const safeVaultAddress = getSafeAddress(vaultAddress);
    
    // Debug log
    console.log('[YO SDK] Fetching vault snapshot for:', safeVaultAddress);
    
    return client.getVaultSnapshot(/** @type {`0x${string}`} */ (safeVaultAddress));
  } catch (error) {
    console.error('[YO SDK] Failed to get vault snapshot:', error);
    throw error;
  }
}

export async function getUserHistoryForNetwork(network = 'ethereum', account, vaultAddress = YOUSD_VAULT_ADDRESS, limit) {
  if (!account || !isAddress(account)) return [];
  await ensureVaultAddress();
  const client = await getYoClient(network);
  return client.getUserHistory(getSafeAddress(vaultAddress), account, limit);
}

export async function getUserPerformanceForNetwork(network = 'ethereum', account, vaultAddress = YOUSD_VAULT_ADDRESS) {
  if (!account || !isAddress(account)) return null;
  await ensureVaultAddress();
  const client = await getYoClient(network);
  return client.getUserPerformance(getSafeAddress(vaultAddress), account);
}

export async function getUserRewardsForNetwork(network = 'ethereum', account) {
  if (!account || !isAddress(account)) return null;
  const client = await getYoClient(network);
  return client.getClaimableRewards(account);
}
