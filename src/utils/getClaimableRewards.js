import { formatUnits, isAddress } from 'viem';
import { getUserRewardsForNetwork } from '../lib/yo';

function sumClaimableRewards(chainRewards) {
  if (!chainRewards?.rewards?.length) return 0;

  return chainRewards.rewards.reduce((total, reward) => {
    try {
      const amount = BigInt(reward.amount ?? 0);
      const claimed = BigInt(reward.claimed ?? 0);
      const claimable = amount > claimed ? amount - claimed : 0n;
      const decimals = Number(reward.token?.decimals ?? 18);
      return total + Number(formatUnits(claimable, decimals));
    } catch {
      return total;
    }
  }, 0);
}

export async function getClaimableRewards(network, account) {
  try {
    if (!account || !isAddress(account)) {
      return { raw: 0, formatted: '$0.00', canClaim: false };
    }

    const chainRewards = await getUserRewardsForNetwork(network, account);
    const raw = sumClaimableRewards(chainRewards);
    const safe = Number.isFinite(raw) ? raw : 0;

    return {
      raw: safe,
      formatted: `$${safe.toFixed(2)}`,
      canClaim: safe > 0,
      source: chainRewards,
    };
  } catch (error) {
    return {
      raw: 0,
      formatted: '$0.00',
      canClaim: false,
      error,
    };
  }
}
