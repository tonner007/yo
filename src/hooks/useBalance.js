// Real USDC balance hook using Viem
import { useState, useEffect, useCallback } from 'react';
import { createPublicClient, http, formatUnits } from 'viem';
import { mainnet, base, arbitrum } from 'viem/chains';

// USDC contract addresses for each network
const USDC_ADDRESSES = {
  ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
};

// USDC ABI (minimal for balanceOf)
const USDC_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
];

// Chain configurations
const CHAINS = {
  ethereum: mainnet,
  base: base,
  arbitrum: arbitrum,
};

/**
 * Real USDC balance hook - fetches actual on-chain balance
 */
export function useBalance(userAddress, network = 'ethereum') {
  const [state, setState] = useState({
    value: 0,
    formatted: '$0.00',
    isLoading: false,
    error: null,
  });

  const fetchBalance = useCallback(async (signal) => {
    if (!userAddress || !userAddress.startsWith('0x')) {
      setState({
        value: 0,
        formatted: '$0.00',
        isLoading: false,
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    // Check if we're in browser and viem is available
    if (typeof window === 'undefined') {
      setState({
        value: 0,
        formatted: '$0.00',
        isLoading: false,
        error: 'Not in browser',
      });
      return;
    }

    try {
      const chain = CHAINS[network] || mainnet;
      const usdcAddress = USDC_ADDRESSES[network];
      
      if (!usdcAddress) {
        throw new Error(`USDC not supported on ${network}`);
      }

      // Create public client
      const publicClient = createPublicClient({
        chain,
        transport: http(),
      });

      // Get USDC balance with abort signal support
      const [balance, decimals] = await Promise.all([
        publicClient.readContract({
          address: usdcAddress,
          abi: USDC_ABI,
          functionName: 'balanceOf',
          args: [userAddress],
        }),
        publicClient.readContract({
          address: usdcAddress,
          abi: USDC_ABI,
          functionName: 'decimals',
        }),
      ]);

      // Check if request was aborted
      if (signal?.aborted) {
        return;
      }

      // Convert from wei to USDC
      const value = Number(formatUnits(balance, decimals));
      
      setState({
        value,
        formatted: value.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        isLoading: false,
        error: null,
      });

    } catch (error) {
      // Don't log aborted requests
      if (error.name === 'AbortError' || signal?.aborted) {
        return;
      }
      
      console.error('Failed to fetch USDC balance:', error);
      
      // Check if viem/web3 is not loaded yet (lazy loading)
      if (error.message?.includes('viem') || error.message?.includes('createPublicClient')) {
        // Viem not loaded yet, will retry later
        // Don't show error, just show loading/0
        setState({
          value: 0,
          formatted: '$0.00',
          isLoading: false,
          error: null,
        });
      } else {
        // Real error
        setState({
          value: 0,
          formatted: '$0.00',
          isLoading: false,
          error: error.message,
        });
      }
    }
  }, [userAddress, network]);

  useEffect(() => {
    const abortController = new AbortController();
    
    fetchBalance(abortController.signal);
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchBalance(abortController.signal);
    }, 30000);
    
    return () => {
      abortController.abort();
      clearInterval(interval);
    };
  }, [fetchBalance]);

  return {
    // Main values
    balance: state.value,
    formattedBalance: state.formatted,
    isLoading: state.isLoading,
    error: state.error,
    
    // Derived values
    isConnected: !!userAddress,
    hasBalance: state.value > 0,
    isZeroBalance: state.value === 0,
    displayValue: state.isLoading ? 'Loading...' : state.formatted,
    
    // For compatibility with old code
    availableToDeposit: state.formatted,
    availableToDepositRaw: state.value,
    refreshBalance: fetchBalance,
  };
}