import { YOUSD_VAULT_ADDRESS } from './getSevenDayApy';

const NETWORK_TO_CHAIN = {
  ethereum: 'ethereum',
  base: 'base',
};

function pickRewardValue(data) {
  if (!data) return 0;

  const candidates = [
    data.claimableRewards,
    data.pendingRewards,
    data.rewards,
    data.rewardBalance,
    data.claimable,
    data.data?.claimableRewards,
    data.data?.pendingRewards,
    data.data?.rewards,
    data.data?.rewardBalance,
    data.data?.claimable,
    data.data?.unrealized?.formatted,
    data.data?.unrealized?.raw,
  ];

  for (const candidate of candidates) {
    if (candidate == null) continue;
    if (typeof candidate === 'number') return candidate;
    if (typeof candidate === 'string') {
      const n = Number(candidate);
      if (Number.isFinite(n)) return n;
    }
    if (typeof candidate === 'object') {
      const nested = Number(candidate.formatted ?? candidate.raw ?? candidate.amount ?? candidate.value);
      if (Number.isFinite(nested)) return nested;
    }
  }

  return 0;
}

export async function getClaimableRewards(network, account) {
  try {
    if (!account) {
      return { raw: 0, formatted: '$0.00', canClaim: false };
    }

    const networkName = NETWORK_TO_CHAIN[network] ?? 'ethereum';
    const url = `https://api.yo.xyz/api/v1/performance/user/${networkName}/${YOUSD_VAULT_ADDRESS}/${account}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Rewards API failed: ${response.status}`);
    }

    const data = await response.json();
    const raw = Number(pickRewardValue(data) ?? 0);
    const safe = Number.isFinite(raw) ? raw : 0;

    return {
      raw: safe,
      formatted: `$${safe.toFixed(2)}`,
      canClaim: safe > 0,
      source: data,
    };
  } catch (error) {
    console.error('Failed to fetch claimable rewards:', error);
    return {
      raw: 0,
      formatted: '$0.00',
      canClaim: false,
      error,
    };
  }
}
