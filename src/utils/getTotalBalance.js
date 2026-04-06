import { formatUnits, isAddress, createPublicClient, http, fallback } from 'viem';
import { mainnet, base, arbitrum } from 'viem/chains';
import { getSupportedChainId, getYoClient, getSafeAddress, YOUSD_VAULT_ADDRESS } from '../lib/yo';

const balancePromiseCache = new Map();
const balanceResultCache = new Map();
const BALANCE_CACHE_MS = 600000; // 10 minutes

export async function getTotalBalance(chainId, vaultAddress, account) {
  try {
    if (!account || !isAddress(account)) {
      return {
        shares: 0n,
        assets: 0n,
        formatted: '$0.00',
        raw: 0,
      };
    }

    const network = Object.entries({ ethereum: 1, base: 8453, arbitrum: 42161 }).find(([, id]) => id === chainId)?.[0] ?? 'ethereum';
    const safeVaultAddress = getSafeAddress(vaultAddress);
    const cacheKey = `${chainId}:${safeVaultAddress}:${account}`;
    const now = Date.now();

    const cached = balanceResultCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < BALANCE_CACHE_MS) {
      return cached.value;
    }

    const inFlight = balancePromiseCache.get(cacheKey);
    if (inFlight) {
      return await inFlight;
    }
    
    // Create public client for the chain with fallback RPCs
    const chainMap = { 1: mainnet, 8453: base, 42161: arbitrum };
    const chain = chainMap[chainId] || mainnet;
    
    // Use multiple RPC endpoints for reliability
    const getTransport = () => {
      if (chainId === 8453) { // Base
        const endpoints = [
          'https://base.publicnode.com',
          'https://base.gateway.tenderly.co',
          'https://mainnet.base.org',
        ];
        const transports = endpoints.map(url => http(url));
        return fallback(transports);
      }
      
      return http();
    };
    
    const publicClient = createPublicClient({
      chain,
      transport: getTransport(),
    });
    
    const loadPromise = (async () => {
      // Import getShareBalance from YO SDK
      const { getShareBalance } = await import('@yo-protocol/core');
      
      // Get shares (with single retry and exponential backoff)
      let shares;
      let lastError;
      
      for (let i = 0; i < 2; i++) {
        try {
          shares = await getShareBalance(publicClient, safeVaultAddress, account);
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
          if (i === 0) {
            // First attempt failed, wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      if (lastError) {
        // Failed to get shares after retries
        shares = 0n;
      }
      
      if (shares === 0n) {
        return {
          shares: 0n,
          assets: 0n,
          formatted: '$0.00',
          raw: 0,
        };
      }
      
      const yoClient = await getYoClient(network);
      
      // Try to get market value (what YO app shows)
      let marketValueUSD = 0;
      try {
        // Get user performance for unrealized profit
        const performance = await yoClient.getUserPerformance(safeVaultAddress, account);
        if (performance && performance.unrealized) {
          // Calculate market value: shares * pricePerShare (implied from unrealized + net deposits)
          // For now, use a simple approach: get net deposits from history
          const history = await yoClient.getUserHistory(safeVaultAddress, account, 100);
          const netDeposits = sumNetDepositsFromHistory(history);
          
          // Market value = net deposits + unrealized profit
          marketValueUSD = netDeposits + Number(performance.unrealized.formatted || 0);
        }
      } catch (error) {
        console.warn('Failed to get market value, falling back to redeem value:', error);
      }
      
      // Fallback to redeem value if market value not available
      let assets;
      try {
        assets = shares > 0n
          ? await yoClient.quotePreviewRedeem(safeVaultAddress, shares)
          : 0n;
      } catch (error) {
        assets = shares;
      }

      const redeemValueUSD = Number(formatUnits(assets, 6));
      
      // Get maxWithdraw for the user
      const maxWithdraw = await publicClient.readContract({
        address: safeVaultAddress,
        abi: [{
          type: 'function',
          name: 'maxWithdraw',
          inputs: [{ name: 'owner', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view',
        }],
        functionName: 'maxWithdraw',
        args: [account],
      });
      
      const maxWithdrawUSD = Number(formatUnits(maxWithdraw, 6));
      const finalValueUSD = maxWithdrawUSD; // Use maxWithdraw as Total Balance
      
      const result = {
        shares,
        assets,
        formatted: `$${finalValueUSD.toFixed(4)}`,
        raw: finalValueUSD,
        source: 'maxWithdraw',
        redeemValue: redeemValueUSD,
        maxWithdrawValue: maxWithdrawUSD,
        marketValue: null,
      };

      balanceResultCache.set(cacheKey, { value: result, timestamp: Date.now() });
      return result;
    })();

    balancePromiseCache.set(cacheKey, loadPromise);

    try {
      return await loadPromise;
    } finally {
      balancePromiseCache.delete(cacheKey);
    }
  } catch (error) {
    console.error('Failed to fetch Total Balance from YO SDK:', error);
    
    // Don't show error to user, just return zero
    return {
      shares: 0n,
      assets: 0n,
      formatted: '$0.00',
      raw: 0,
      error: error.message,
    };
  }
}

// Helper to sum net deposits from history (similar to getProfit.js)
function sumNetDepositsFromHistory(history = []) {
  let deposits = 0;
  let withdrawals = 0;

  for (const item of history) {
    const type = String(item?.type ?? '').toLowerCase();
    const amount = item?.assets?.formatted ? Number(item.assets.formatted) : 0;

    if (type.includes('deposit')) deposits += amount;
    if (type.includes('withdraw') || type.includes('redeem')) withdrawals += amount;
  }

  return deposits - withdrawals;
}

export async function getTotalBalanceForNetwork(network, account) {
  const chainId = getSupportedChainId(network);
  return getTotalBalance(chainId, YOUSD_VAULT_ADDRESS, account);
}
