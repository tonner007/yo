import { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export default function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await connect({ connector: injected() });
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect wallet. Make sure MetaMask is installed and unlocked.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  // Format address for display
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="border border-border rounded-full px-5 py-3 text-sm font-bold text-foreground flex items-center">
          {formatAddress(address)}
        </div>
        <button
          onClick={handleDisconnect}
          className="bg-secondary text-foreground font-bold text-sm px-7 py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          DISCONNECT
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-primary text-primary-foreground font-bold text-sm px-6 py-2.5 rounded-full flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      <Wallet className="w-4 h-4" />
      {isConnecting ? 'Connecting...' : 'CONNECT WALLET'}
    </button>
  );
}