import { useCallback, useEffect, useState } from 'react';
import { getTotalBalanceForNetwork } from '../utils/getTotalBalance';

export function useTotalBalance(userAddress, network = 'ethereum', refreshKey = 0) {
  const [totalBalance, setTotalBalance] = useState('$0.00');
  const [totalBalanceRaw, setTotalBalanceRaw] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTotalBalance = useCallback(async () => {
    setIsLoading(true);
    const result = await getTotalBalanceForNetwork(network, userAddress);
    setTotalBalance(result.formatted ?? '$0.00');
    setTotalBalanceRaw(Number(result.raw ?? 0));
    setIsLoading(false);
  }, [network, userAddress]);

  useEffect(() => {
    refreshTotalBalance();
  }, [refreshTotalBalance, refreshKey]);

  useEffect(() => {
    const interval = setInterval(refreshTotalBalance, 60000);
    return () => clearInterval(interval);
  }, [refreshTotalBalance]);

  return {
    totalBalance,
    totalBalanceRaw,
    isLoading,
    refreshTotalBalance,
  };
}
