// @ts-nocheck
import { formatUnits, isAddress, createPublicClient, http, fallback } from 'viem';
import { base } from 'viem/chains';
import { getSupportedChainId } from '../lib/yo';

// Cache for claimable rewards (10 minutes)
const rewardsPromiseCache = new Map();
const rewardsResultCache = new Map();
const REWARDS_CACHE_MS = 600000; // 10 minutes

// Multiple RPC endpoints for Base with prioritization
const BASE_RPC_ENDPOINTS = [
  'https://base-rpc.publicnode.com',           // Public node
  'https://base.publicnode.com',               // Alternative public node
  'https://1rpc.io/base',                      // 1RPC
  'https://base.meowrpc.com',                  // MeowRPC
  'https://base.gateway.tenderly.co',          // Tenderly
  'https://mainnet.base.org',                  // Official (often rate limited)
];

function sumClaimableRewards(chainRewards) {
  if (!chainRewards?.rewards?.length) return 0;

  return chainRewards.rewards.reduce((total, reward) => {
    try {
      const amount = BigInt(reward.amount ?? 0);
      const claimed = BigInt(reward.claimed ?? 0);
      const claimable = amount > claimed ? amount - claimed : 0n;
      const decimals = Number(reward.token?.decimals ?? 18);
      return total + Number(formatUnits(claimable, decimals));
    } catch {
      return total;
    }
  }, 0);
}

export async function getClaimableRewardsWithFallback(network, account) {
  try {
    if (!account || !isAddress(account)) {
      return { raw: 0, formatted: '$0.00', canClaim: false };
    }

    const chainId = getSupportedChainId(network);
    const cacheKey = `${chainId}:${account}`;
    const now = Date.now();

    // Check cache
    const cached = rewardsResultCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < REWARDS_CACHE_MS) {
      return cached.value;
    }

    // Check in-flight promise
    const inFlight = rewardsPromiseCache.get(cacheKey);
    if (inFlight) {
      return await inFlight;
    }

    const loadPromise = (async () => {
      // For Base network, use multiple RPC endpoints with exponential backoff
      if (chainId === 8453) {
        let lastError = null;
        
        // Try each RPC endpoint with 1 retry and exponential backoff
        for (let i = 0; i < BASE_RPC_ENDPOINTS.length; i++) {
          const endpoint = BASE_RPC_ENDPOINTS[i];
          try {
            // Create public client with single endpoint (no fallback for individual attempt)
            const publicClient = createPublicClient({
              chain: base,
              transport: http(endpoint),
            });

            // Import YO SDK
            const { createYoClient } = await import('@yo-protocol/core');
            
            // Create YO client with our public client
            const yoClient = createYoClient({ 
              chainId,
              publicClients: { [chainId]: publicClient }
            });

            const chainRewards = await yoClient.getClaimableRewards(account);
            const raw = sumClaimableRewards(chainRewards);
            const safe = Number.isFinite(raw) ? raw : 0;

            const result = {
              raw: safe,
              formatted: `$${safe.toFixed(2)}`,
              canClaim: safe > 0,
              source: chainRewards,
              rpcEndpoint: endpoint,
            };

            // Cache result
            rewardsResultCache.set(cacheKey, { value: result, timestamp: Date.now() });
            return result;
          } catch (error) {
            lastError = error;
            
            // Wait before trying next endpoint (exponential backoff)
            if (i < BASE_RPC_ENDPOINTS.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
          }
        }
        
        // All endpoints failed
        // Fallback to original method
      }

      // Fallback to original method for other networks or if fallback failed
      const { getUserRewardsForNetwork } = await import('../lib/yo');
      const chainRewards = await getUserRewardsForNetwork(network, account);
      const raw = sumClaimableRewards(chainRewards);
      const safe = Number.isFinite(raw) ? raw : 0;

      const result = {
        raw: safe,
        formatted: `$${safe.toFixed(2)}`,
        canClaim: safe > 0,
        source: chainRewards,
      };

      // Cache result
      rewardsResultCache.set(cacheKey, { value: result, timestamp: Date.now() });
      return result;
    })();

    rewardsPromiseCache.set(cacheKey, loadPromise);

    try {
      return await loadPromise;
    } finally {
      rewardsPromiseCache.delete(cacheKey);
    }
  } catch (error) {
    return {
      raw: 0,
      formatted: '$0.00',
      canClaim: false,
      error,
    };
  }
}