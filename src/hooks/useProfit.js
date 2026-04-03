import { useCallback, useEffect, useState } from 'react';
import { getProfit } from '../utils/getProfit';

export function useProfit(userAddress, network = 'ethereum', refreshKey = 0) {
  const [profit, setProfit] = useState('$0.00');
  const [profitRaw, setProfitRaw] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfit = useCallback(async () => {
    setIsLoading(true);
    const result = await getProfit(network, userAddress);
    setProfit(result.profitFormatted ?? '$0.00');
    setProfitRaw(Number(result.profitRaw ?? 0));
    setIsLoading(false);
  }, [network, userAddress]);

  useEffect(() => {
    refreshProfit();
  }, [refreshProfit, refreshKey]);

  useEffect(() => {
    const interval = setInterval(refreshProfit, 60000);
    return () => clearInterval(interval);
  }, [refreshProfit]);

  return {
    profit,
    profitRaw,
    isLoading,
    refreshProfit,
  };
}
