import { useEffect, useState } from "react";
import { Wallet, LogOut, ChevronDown, ExternalLink } from "lucide-react";
import { useWallet } from "../../contexts/WalletContext";

const NETWORKS = [
  { id: "ethereum", label: "Ethereum", icon: "🟡" },
  { id: "base", label: "Base", icon: "🔵" },
];

export default function WalletConnectButton() {
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [connectRequested, setConnectRequested] = useState(false);
  const {
    isConnected,
    isConnecting,
    userAddress,
    network,
    shortAddress,
    disconnectWallet,
    connectWallet,
    error,
    ensureWeb3Ready,
    web3Ready,
  } = useWallet();

  const handleConnect = async () => {
    setConnectRequested(true);
    try {
      await connectWallet?.();
    } catch (err) {
      setConnectRequested(false);
    }
  };

  useEffect(() => {
    if (!connectRequested) return;
    if (!web3Ready) return;
    if (isConnected) {
      setConnectRequested(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        await connectWallet?.();
      } finally {
        setConnectRequested(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [connectRequested, web3Ready, isConnected, connectWallet]);

  const handleDisconnect = () => {
    disconnectWallet();
    setShowWalletDropdown(false);
  };

  const currentNetwork = NETWORKS.find(n => n.id === network);
  const isPreparingWeb3 = !web3Ready && (isConnecting || connectRequested);

  if (!isConnected) {
    return (
      <div className="relative">
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="border border-border rounded-full px-5 py-3 text-sm font-bold text-foreground flex items-center gap-2 hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting || isPreparingWeb3 ? (
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
    <div className="flex items-center">
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
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-foreground">Connected Wallet</div>
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
              </div>
            </div>

            <div className="p-2">
              <a
                href={`${network === 'base' ? 'https://basescan.org' : 'https://etherscan.io'}/address/${userAddress}`}
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

          </div>
        )}
      </div>
    </div>
  );
}
