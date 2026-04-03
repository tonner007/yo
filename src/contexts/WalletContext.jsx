import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { simulateWalletConnection } from '../utils/getUsdcBalance';

const WalletContext = createContext();

// Demo uživatelé pro různé sítě
const DEMO_USERS = {
  ethereum: {
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
    name: 'Demo User (Ethereum)',
    balance: 1250.75, // Simulovaný USDC balance
  },
  base: {
    address: '0x4bb7da7c06d0b9da7aa5d4def0c5d8f50dd7f7e8',
    name: 'Demo User (Base)',
    balance: 850.50,
  },
  arbitrum: {
    address: '0x742d35Cc6634C0532925a3b844Bc9e0F3B5f2b8A',
    name: 'Demo User (Arbitrum)',
    balance: 320.25,
  },
};

export function WalletProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState(null);
  const [network, setNetwork] = useState('ethereum');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Inicializace - zkontrolovat localStorage pro uložené připojení
  useEffect(() => {
    const savedConnection = localStorage.getItem('wallet_connection');
    if (savedConnection) {
      try {
        const { address, network: savedNetwork } = JSON.parse(savedConnection);
        setUserAddress(address);
        setNetwork(savedNetwork || 'ethereum');
        setIsConnected(true);
      } catch (err) {
        console.error('Error loading saved wallet connection:', err);
        localStorage.removeItem('wallet_connection');
      }
    }
  }, []);

  // Uložení připojení do localStorage
  useEffect(() => {
    if (isConnected && userAddress) {
      localStorage.setItem('wallet_connection', JSON.stringify({
        address: userAddress,
        network,
        timestamp: Date.now(),
      }));
    } else {
      localStorage.removeItem('wallet_connection');
    }
  }, [isConnected, userAddress, network]);

  // Připojení peněženky
  const connectWallet = useCallback(async (targetNetwork = 'ethereum') => {
    setIsConnecting(true);
    setError(null);

    try {
      // Simulace připojení k peněžence (v reálné aplikaci bychom použili wagmi/rainbowkit)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulace zpoždění
      
      const demoUser = DEMO_USERS[targetNetwork];
      if (!demoUser) {
        throw new Error(`Unsupported network: ${targetNetwork}`);
      }

      setUserAddress(demoUser.address);
      setNetwork(targetNetwork);
      setIsConnected(true);
      setIsConnecting(false);

      return {
        success: true,
        address: demoUser.address,
        network: targetNetwork,
      };
    } catch (err) {
      setError(err.message);
      setIsConnecting(false);
      return {
        success: false,
        error: err.message,
      };
    }
  }, []);

  // Odpojení peněženky
  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setUserAddress(null);
    setError(null);
    localStorage.removeItem('wallet_connection');
  }, []);

  // Změna sítě
  const switchNetwork = useCallback(async (newNetwork) => {
    if (!isConnected) {
      setNetwork(newNetwork);
      return { success: true };
    }

    // Pokud jsme připojeni, přepojíme se na novou síť
    const result = await connectWallet(newNetwork);
    if (result.success) {
      setNetwork(newNetwork);
    }
    return result;
  }, [isConnected, connectWallet]);

  // Simulace transakce (deposit/withdraw)
  const simulateTransaction = useCallback(async (type, amount, token = 'USDC') => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    // Simulace zpoždění transakce
    await new Promise(resolve => setTimeout(resolve, 2000));

    // V reálné aplikaci bychom zde volali smart contract
    console.log(`Simulating ${type} transaction:`, {
      type,
      amount,
      token,
      network,
      userAddress,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      hash: `0x${Math.random().toString(16).substring(2)}${Date.now().toString(16)}`,
      type,
      amount,
      network,
      timestamp: Date.now(),
    };
  }, [isConnected, network, userAddress]);

  const value = {
    // Stav
    isConnected,
    isConnecting,
    userAddress,
    network,
    error,
    
    // Demo data
    demoUsers: DEMO_USERS,
    
    // Akce
    connectWallet,
    disconnectWallet,
    switchNetwork,
    simulateTransaction,
    
    // Helper funkce
    shortAddress: userAddress 
      ? `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`
      : null,
    
    currentDemoUser: isConnected ? DEMO_USERS[network] : null,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}

// Zjednodušený hook pro rychlý přístup
export function useWalletConnection() {
  const { isConnected, userAddress, network } = useWallet();
  return { isConnected, userAddress, network };
}