import { useCallback, useEffect, useState, useRef } from 'react';
import { getTotalBalanceForNetwork } from '../utils/getTotalBalance';

// Hook-level cache to reduce rerenders (data cache is also in getTotalBalance.js)
const balanceCache = new Map();
const CACHE_DURATION = 60000; // 60 seconds

export function useTotalBalance(userAddress, network = 'ethereum', refreshKey = 0) {
  const [totalBalance, setTotalBalance] = useState('$0.00');
  const [totalBalanceRaw, setTotalBalanceRaw] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const lastFetchTime = useRef(0);

  const refreshTotalBalance = useCallback(async () => {
    if (!userAddress) {
      setTotalBalance('$0.00');
      setTotalBalanceRaw(0);
      setIsLoading(false);
      return;
    }

    // Check cache
    const cacheKey = `${userAddress}:${network}`;
    const now = Date.now();
    const cached = balanceCache.get(cacheKey);
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      // Using cached balance
      setTotalBalance(cached.formatted);
      setTotalBalanceRaw(cached.raw);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await getTotalBalanceForNetwork(network, userAddress);
      
      // Update cache
      balanceCache.set(cacheKey, {
        formatted: result.formatted ?? '$0.00',
        raw: Number(result.raw ?? 0),
        timestamp: now,
      });
      
      setTotalBalance(result.formatted ?? '$0.00');
      setTotalBalanceRaw(Number(result.raw ?? 0));
    } catch (error) {
      console.error('[useTotalBalance] Error:', error);
      // Keep previous value on error
    } finally {
      setIsLoading(false);
      lastFetchTime.current = now;
    }
  }, [network, userAddress]);

  useEffect(() => {
    refreshTotalBalance();
  }, [refreshTotalBalance, refreshKey]);

  // Less frequent polling (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(refreshTotalBalance, 300000);
    return () => clearInterval(interval);
  }, [refreshTotalBalance]);

  return {
    totalBalance,
    totalBalanceRaw,
    isLoading,
    refreshTotalBalance,
  };
}
