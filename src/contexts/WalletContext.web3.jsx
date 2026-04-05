import { useCallback, useMemo, useEffect, useRef } from 'react';
import { useAccount, useChainId, useDisconnect, useSwitchChain, useWalletClient } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { mainnet, base } from 'wagmi/chains';
import { WalletProvider as BaseWalletProvider } from './WalletContext';

const NETWORK_BY_CHAIN_ID = {
  [mainnet.id]: 'ethereum',
  [base.id]: 'base',
};

const CHAIN_ID_BY_NETWORK = {
  ethereum: mainnet.id,
  base: base.id,
};

export function WalletWeb3Provider({ children, ensureWeb3Ready }) {
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const { openConnectModal } = useConnectModal();
  const pendingOpenRef = useRef(false);

  useEffect(() => {
    if (pendingOpenRef.current && openConnectModal) {
      console.log('[WalletContext] auto-opening connect modal after mount');
      pendingOpenRef.current = false;
      openConnectModal();
    }
  }, [openConnectModal]);

  const network = NETWORK_BY_CHAIN_ID[chainId] ?? 'ethereum';
  const error = !isConnected
    ? null
    : NETWORK_BY_CHAIN_ID[chainId]
      ? null
      : 'Unsupported network. Please switch to Ethereum or Base.';

  const connectWallet = useCallback(async () => {
    console.log('[WalletContext] connectWallet called');

    await ensureWeb3Ready?.();
    console.log('[WalletContext] web3 ready');

    if (openConnectModal && typeof openConnectModal === 'function') {
      console.log('[WalletContext] openConnectModal found immediately. Opening modal...');
      openConnectModal();
      return { success: true };
    }

    console.log('[WalletContext] modal not ready yet, scheduling auto-open');
    pendingOpenRef.current = true;

    return { success: true, pending: true };
  }, [ensureWeb3Ready, openConnectModal]);

  const disconnectWallet = useCallback(async () => {
    await disconnectAsync();
  }, [disconnectAsync]);

  const switchNetwork = useCallback(async (newNetwork) => {
    try {
      const targetChainId = CHAIN_ID_BY_NETWORK[newNetwork];
      if (!targetChainId) {
        throw new Error(`Unsupported network: ${newNetwork}`);
      }

      if (!isConnected) {
        return { success: false, error: 'Wallet not connected' };
      }

      await switchChainAsync({ chainId: targetChainId });
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.message || 'Failed to switch network' };
    }
  }, [isConnected, switchChainAsync]);

  const simulateTransaction = useCallback(async () => {
    throw new Error('Simulated transactions were removed. Use real wallet flow.');
  }, []);

  const value = useMemo(() => ({
    isConnected,
    isConnecting,
    userAddress: address ?? null,
    network,
    chainId,
    walletClient: walletClient ?? null,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    simulateTransaction,
    shortAddress: address
      ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
      : null,
    currentDemoUser: null,
    web3Ready: true,
    ensureWeb3Ready,
  }), [
    isConnected,
    isConnecting,
    address,
    network,
    chainId,
    walletClient,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    simulateTransaction,
    ensureWeb3Ready,
  ]);

  return <BaseWalletProvider value={value}>{children}</BaseWalletProvider>;
}
