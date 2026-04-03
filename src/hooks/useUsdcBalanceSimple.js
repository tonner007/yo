// Simplified version of useUsdcBalance to fix React hook errors
import { useState, useEffect } from 'react';

/**
 * Simplified hook for USDC balance - avoids complex dependencies
 */
export function useUsdcBalanceSimple(userAddress, network = 'ethereum') {
  const [balance, setBalance] = useState({
    value: 0,
    formatted: '$0.00',
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const loadBalance = async () => {
      if (!userAddress) {
        setBalance({
          value: 0,
          formatted: '$0.00',
          isLoading: false,
          error: null,
        });
        return;
      }

      setBalance(prev => ({ ...prev, isLoading: true }));

      try {
        // Demo balances for different networks
        const demoBalances = {
          ethereum: 1250.75,
          base: 850.50,
          arbitrum: 320.25,
        };

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const balanceValue = demoBalances[network] || 0;
        
        setBalance({
          value: balanceValue,
          formatted: balanceValue.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          isLoading: false,
          error: null,
        });

      } catch (error) {
        setBalance({
          value: 0,
          formatted: '$0.00',
          isLoading: false,
          error: error.message,
        });
      }
    };

    loadBalance();
  }, [userAddress, network]);

  return {
    balance: balance.value,
    formattedBalance: balance.formatted,
    isLoading: balance.isLoading,
    error: balance.error,
    isConnected: !!userAddress,
    hasBalance: balance.value > 0,
    displayValue: balance.isLoading ? 'Loading...' : balance.formatted,
  };
}