import { useCallback, useEffect, useState } from 'react';
import { getClaimableRewards } from '../utils/getClaimableRewards';

export function useClaimableRewards(userAddress, network = 'ethereum', refreshKey = 0) {
  const [claimableRewards, setClaimableRewards] = useState('$0.00');
  const [claimableRewardsRaw, setClaimableRewardsRaw] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshClaimableRewards = useCallback(async () => {
    setIsLoading(true);
    const result = await getClaimableRewards(network, userAddress);
    setClaimableRewards(result.formatted ?? '$0.00');
    setClaimableRewardsRaw(Number(result.raw ?? 0));
    setCanClaim(Boolean(result.canClaim));
    setIsLoading(false);
  }, [network, userAddress]);

  useEffect(() => {
    refreshClaimableRewards();
  }, [refreshClaimableRewards, refreshKey]);

  useEffect(() => {
    const interval = setInterval(refreshClaimableRewards, 60000);
    return () => clearInterval(interval);
  }, [refreshClaimableRewards]);

  return {
    claimableRewards,
    claimableRewardsRaw,
    canClaim,
    isLoading,
    refreshClaimableRewards,
  };
}
