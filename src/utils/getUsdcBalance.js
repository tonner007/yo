import { createPublicClient, http, formatUnits } from 'viem';
import { mainnet, base } from 'viem/chains';

// USDC contract addresses for different networks
const USDC_ADDRESSES = {
  ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
};

// USDC ABI - minimal pro balanceOf
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
const CHAIN_CONFIGS = {
  ethereum: {
    chain: mainnet,
    rpcUrl: 'https://eth.llamarpc.com', // Public RPC endpoint
  },
  base: {
    chain: base,
    rpcUrl: 'https://mainnet.base.org',
  },
  arbitrum: {
    chain: {
      id: 42161,
      name: 'Arbitrum One',
      network: 'arbitrum',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: ['https://arb1.arbitrum.io/rpc'] },
      },
    },
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
  },
};

/**
 * Získá USDC balance uživatele na dané síti
 * @param {string} userAddress - Ethereum adresa uživatele
 * @param {string} network - 'ethereum', 'base', nebo 'arbitrum'
 * @returns {Promise<{balance: number, formatted: string, raw: string}>}
 */
export async function getUsdcBalance(userAddress, network = 'ethereum') {
  try {
    if (!userAddress || !userAddress.startsWith('0x')) {
      throw new Error('Invalid user address');
    }

    const config = CHAIN_CONFIGS[network];
    if (!config) {
      throw new Error(`Unsupported network: ${network}`);
    }

    const usdcAddress = USDC_ADDRESSES[network];
    if (!usdcAddress) {
      throw new Error(`No USDC address for network: ${network}`);
    }

    // Vytvoření public client pro čtení z blockchainu
    const client = createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrl),
    });

    // Paralelní získání balance a decimals
    const [balanceResult, decimalsResult] = await Promise.all([
      client.readContract({
        address: usdcAddress,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      }),
      client.readContract({
        address: usdcAddress,
        abi: USDC_ABI,
        functionName: 'decimals',
      }),
    ]);

    // Převod z raw hodnoty na čitelné číslo
    const rawBalance = balanceResult.toString();
    const decimals = Number(decimalsResult);
    const balance = parseFloat(formatUnits(BigInt(rawBalance), decimals));

    // Formátování na 2 desetinná místa
    const formatted = balance.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return {
      balance,
      formatted,
      raw: rawBalance,
      network,
      address: userAddress,
      success: true,
    };

  } catch (error) {
    console.error(`Error fetching USDC balance for ${network}:`, error);
    
    return {
      balance: 0,
      formatted: '$0.00',
      raw: '0',
      network,
      address: userAddress,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Získá USDC balance pro všechny podporované sítě
 * @param {string} userAddress - Ethereum adresa uživatele
 * @returns {Promise<Array>}
 */
export async function getMultiNetworkUsdcBalance(userAddress) {
  if (!userAddress || !userAddress.startsWith('0x')) {
    return Object.keys(USDC_ADDRESSES).map(network => ({
      network,
      balance: 0,
      formatted: '$0.00',
      success: false,
      error: 'Invalid address',
    }));
  }

  const networks = Object.keys(USDC_ADDRESSES);
  const promises = networks.map(network => 
    getUsdcBalance(userAddress, network)
  );

  return Promise.all(promises);
}

/**
 * Simuluje připojenou peněženku (pro demo účely)
 * V reálné aplikaci bychom použili wagmi/rainbowkit
 */
export function simulateWalletConnection() {
  // Demo adresa s nějakým USDC balance
  const demoAddresses = {
    ethereum: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
    base: '0x4bb7dA7c06d0B9dA7aA5D4def0C5d8F50dD7F7E8', // Random Base address
  };

  return {
    isConnected: true,
    address: demoAddresses.ethereum,
    chainId: 1,
    network: 'ethereum',
  };
}