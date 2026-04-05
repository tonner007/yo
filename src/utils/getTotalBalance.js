import { formatUnits, isAddress, createPublicClient, http, fallback } from 'viem';
import { mainnet, base, arbitrum } from 'viem/chains';
import { getSupportedChainId, getYoClient, getSafeAddress, YOUSD_VAULT_ADDRESS } from '../lib/yo';

const balancePromiseCache = new Map();
const balanceResultCache = new Map();
const BALANCE_CACHE_MS = 60000;

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
      
      // Get shares (with simple retry)
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
            // First attempt failed, retrying in 1s...
            await new Promise(resolve => setTimeout(resolve, 1000));
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
      let assets;
      
      try {
        assets = shares > 0n
          ? await yoClient.quotePreviewRedeem(safeVaultAddress, shares)
          : 0n;
      } catch (error) {
        // Failed to get quotePreviewRedeem
        assets = shares;
      }

      const assetsNumber = Number(formatUnits(assets, 6));
      const result = {
        shares,
        assets,
        formatted: `$${assetsNumber.toFixed(2)}`,
        raw: assetsNumber,
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

export async function getTotalBalanceForNetwork(network, account) {
  const chainId = getSupportedChainId(network);
  return getTotalBalance(chainId, YOUSD_VAULT_ADDRESS, account);
}
