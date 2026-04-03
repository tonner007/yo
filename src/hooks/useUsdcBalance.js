// DEPRECATED - use useBalance.js instead
// This file is kept for compatibility but exports dummy functions

import { useBalance } from './useBalance';

/**
 * @deprecated Use useBalance instead
 */
export function useUsdcBalance(options = {}) {
  console.warn('useUsdcBalance is deprecated, use useBalance instead');
  
  const { userAddress, network = 'ethereum' } = options;
  const balance = useBalance(userAddress, network);
  
  return {
    balance: balance.balance,
    formattedBalance: balance.formattedBalance,
    isLoading: balance.isLoading,
    error: balance.error,
    isConnected: balance.isConnected,
    lastUpdated: new Date().toISOString(),
    network,
    refresh: balance.refreshBalance,
    hasBalance: balance.hasBalance,
    isZeroBalance: balance.isZeroBalance,
    displayValue: balance.displayValue,
  };
}

/**
 * @deprecated Use useBalance instead
 */
export function useAvailableToDeposit(userAddress, network = 'ethereum') {
  console.warn('useAvailableToDeposit is deprecated, use useBalance instead');
  
  const balance = useBalance(userAddress, network);
  
  return {
    availableToDeposit: balance.availableToDeposit,
    isLoading: balance.isLoading,
    isConnected: balance.isConnected,
    refreshBalance: balance.refreshBalance,
    shouldShowZero: !balance.isConnected || balance.formattedBalance === '$0.00',
  };
}