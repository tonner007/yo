import { useState } from "react";
import { Wallet, LogOut, ChevronDown, Check, ExternalLink } from "lucide-react";
import { useWallet } from "../../contexts/WalletContext";

const NETWORKS = [
  { id: "ethereum", label: "Ethereum", icon: "🟡" },
  { id: "base", label: "Base", icon: "🔵" },
  { id: "arbitrum", label: "Arbitrum", icon: "🔴" },
];

export default function WalletConnectButton() {
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  
  const {
    isConnected,
    isConnecting,
    userAddress,
    network,
    shortAddress,
    currentDemoUser,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    error,
  } = useWallet();

  const handleConnect = async () => {
    const result = await connectWallet(network);
    if (result.success) {
      setShowWalletDropdown(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowWalletDropdown(false);
  };

  const handleNetworkSelect = async (networkId) => {
    const result = await switchNetwork(networkId);
    if (result.success) {
      setShowNetworkDropdown(false);
    }
  };

  const currentNetwork = NETWORKS.find(n => n.id === network);

  if (!isConnected) {
    return (
      <div className="relative">
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="border border-border rounded-full px-5 py-3 text-sm font-bold text-foreground flex items-center gap-2 hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </>
          )}
        </button>
        
        {error && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-red-500 text-white text-xs p-2 rounded-lg z-50">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Network Selector */}
      <div className="relative">
        <button
          onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
          className="border border-border rounded-full px-4 py-2 text-sm font-medium text-foreground flex items-center gap-2 hover:bg-secondary transition-colors"
        >
          <span className="text-lg">{currentNetwork?.icon || "🌐"}</span>
          <span>{currentNetwork?.label || network}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showNetworkDropdown ? "rotate-180" : ""}`} />
        </button>

        {showNetworkDropdown && (
          <div className="absolute top-full mt-2 left-0 z-50 bg-card border border-border rounded-xl shadow-xl min-w-[180px] overflow-hidden">
            {NETWORKS.map((net) => (
              <button
                key={net.id}
                onClick={() => handleNetworkSelect(net.id)}
                className="flex items-center justify-between w-full px-4 py-3 hover:bg-secondary transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{net.icon}</span>
                  <span className="text-sm font-medium">{net.label}</span>
                </div>
                {network === net.id && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Wallet Button */}
      <div className="relative">
        <button
          onClick={() => setShowWalletDropdown(!showWalletDropdown)}
          className="border border-border rounded-full px-5 py-3 text-sm font-bold text-foreground flex items-center gap-2 hover:bg-secondary transition-colors"
        >
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>{shortAddress}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showWalletDropdown ? "rotate-180" : ""}`} />
        </button>

        {showWalletDropdown && (
          <div className="absolute top-full mt-2 right-0 z-50 bg-card border border-border rounded-xl shadow-xl min-w-[280px] overflow-hidden">
            {/* Wallet Info */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-foreground">{currentDemoUser?.name || "Demo User"}</div>
                  <div className="text-xs text-muted-foreground">{shortAddress}</div>
                </div>
              </div>
              <div className="mt-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Network:</span>
                  <span className="font-medium flex items-center gap-1">
                    <span className="text-lg">{currentNetwork?.icon}</span>
                    {currentNetwork?.label}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-muted-foreground">Balance:</span>
                  <span className="font-medium">
                    {currentDemoUser?.balance.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }) || "$0.00"} USDC
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <a
                href={`https://etherscan.io/address/${userAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View on Explorer
              </a>
              
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-sm text-red-500 mt-1"
              >
                <LogOut className="w-4 h-4" />
                Disconnect Wallet
              </button>
            </div>

            {/* Demo Note */}
            <div className="p-3 bg-yellow-500/10 border-t border-border">
              <div className="text-xs text-yellow-600">
                <strong>Demo Mode:</strong> Using simulated wallet connection. In production, this would connect to real wallets like MetaMask.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}