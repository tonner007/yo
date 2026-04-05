import { formatUnits, isAddress, createPublicClient, http, fallback } from 'viem';
import { mainnet, base, arbitrum } from 'viem/chains';
import { getSupportedChainId, getYoClient, getSafeAddress, YOUSD_VAULT_ADDRESS } from '../lib/yo';

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
    
    // Create public client for the chain with fallback RPCs
    const chainMap = { 1: mainnet, 8453: base, 42161: arbitrum };
    const chain = chainMap[chainId] || mainnet;
    
    // Use multiple RPC endpoints for reliability
    const getTransport = () => {
      if (chainId === 8453) { // Base
        // Multiple Base RPC endpoints
        const endpoints = [
          'https://mainnet.base.org',
          'https://base.publicnode.com',
          'https://base.gateway.tenderly.co',
        ];
        
        // Try each endpoint
        const transports = endpoints.map(url => http(url));
        return fallback(transports);
      }
      
      return http();
    };
    
    const publicClient = createPublicClient({
      chain,
      transport: getTransport(),
    });
    
    // Import getShareBalance from YO SDK
    const { getShareBalance } = await import('@yo-protocol/core');
    
    // Get shares (with simple retry)
    let shares;
    let lastError;
    
    for (let i = 0; i < 2; i++) { // Try twice
      try {
        shares = await getShareBalance(publicClient, safeVaultAddress, account);
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        if (i === 0) {
          console.log('First attempt failed, retrying in 1s...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    if (lastError) {
      console.warn('Failed to get shares after retries:', lastError.message);
      shares = 0n;
    }
    
    // If no shares, return zero
    if (shares === 0n) {
      return {
        shares: 0n,
        assets: 0n,
        formatted: '$0.00',
        raw: 0,
      };
    }
    
    // Get YoClient for quotePreviewRedeem
    const yoClient = await getYoClient(network);
    let assets;
    
    try {
      assets = shares > 0n
        ? await yoClient.quotePreviewRedeem(safeVaultAddress, shares)
        : 0n;
    } catch (error) {
      console.warn('Failed to get quotePreviewRedeem:', error.message);
      // Fallback: assume 1:1 conversion
      assets = shares;
    }

    const assetsNumber = Number(formatUnits(assets, 6));

    return {
      shares,
      assets,
      formatted: `$${assetsNumber.toFixed(2)}`,
      raw: assetsNumber,
    };
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
