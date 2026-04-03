import { useCallback, useEffect, useState } from 'react';
import { getSevenDayApy, getSupportedApyChainId, YOUSD_VAULT_ADDRESS } from '../utils/getSevenDayApy';

export function useSevenDayApy(network = 'ethereum', refreshKey = 0) {
  const [apy, setApy] = useState('0.00%');
  const [apyRaw, setApyRaw] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshApy = useCallback(async () => {
    const chainId = getSupportedApyChainId(network);
    setIsLoading(true);

    const result = await getSevenDayApy(chainId, YOUSD_VAULT_ADDRESS);
    setApy(result.percentage ?? '0.00%');
    setApyRaw(Number(result.raw ?? 0));
    setIsLoading(false);
  }, [network]);

  useEffect(() => {
    refreshApy();
  }, [refreshApy, refreshKey]);

  useEffect(() => {
    const interval = setInterval(refreshApy, 60000);
    return () => clearInterval(interval);
  }, [refreshApy]);

  return {
    apy,
    apyRaw,
    isLoading,
    refreshApy,
  };
}
