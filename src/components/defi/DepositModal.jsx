import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { useWallet } from "../../contexts/WalletContext";

const USDC_ADDRESSES = {
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
};

const NETWORKS = [
  { id: "base", label: "Base" },
  { id: "ethereum", label: "Ethereum" },
  { id: "arbitrum", label: "Arbitrum One" },
];

function NetworkDropdown({ selectedNetwork, onSelect, disabled = false, tooltip }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = NETWORKS.find((n) => n.id === selectedNetwork);

  return (
    <div className="relative flex-1" ref={ref}>
      <div
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`flex items-center gap-4 bg-secondary border border-border rounded-xl px-4 py-3 select-none h-full ${
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:border-muted-foreground transition-colors'
        }`}
        title={tooltip}
      >
        <img
          src="/icons/usdc.png"
          alt="USDC"
          className="w-9 h-9 rounded-full object-contain"
        />
        <div className="flex-1">
          <div className="text-foreground font-bold text-sm">USDC</div>
          <div className="text-muted-foreground text-xs">{current.label}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-card border border-border rounded-xl shadow-xl min-w-[200px] overflow-hidden">
          {NETWORKS.map((network) => (
            <div
              key={network.id}
              onClick={() => { onSelect(network.id); setOpen(false); }}
              className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-secondary transition-colors"
            >
              <img
                src="/icons/usdc.png"
                alt="USDC"
                className="w-8 h-8 rounded-full object-contain"
              />
              <div className="flex-1">
                <div className="text-foreground font-bold text-sm">USDC</div>
                <div className="text-muted-foreground text-xs">{network.label}</div>
              </div>
              {selectedNetwork === network.id && <Check className="w-4 h-4 text-primary" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DepositModal({ isOpen, onClose, defaultTab = "deposit", onTransactionComplete }) {
  const { userAddress, isConnected } = useWallet();
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [selectedNetwork, setSelectedNetwork] = useState("base");
  const [depositAmount, setDepositAmount] = useState("");

  // Reset amount and update tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setDepositAmount("");
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  const amount = parseFloat(depositAmount);
  const isValid = !isNaN(amount) && amount > 0;

  const handleDeposit = async () => {
    if (!isValid) return;
    
    // Check if wallet is connected
    if (!userAddress) {
      alert("Please connect your wallet first");
      return;
    }
    
    // Prepared for blockchain integration
    console.log("Deposit:", {
      token: "USDC",
      network: selectedNetwork,
      address: USDC_ADDRESSES[selectedNetwork],
      amount: amount,
      userAddress,
    });
    
    // Simulace transakce
    try {
      // Zde by byla skutečná transakce přes smart contract
      // Pro demo pouze simulace
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log("Deposit transaction simulated successfully");
      
      // Zavolání callbacku pro aktualizaci UI
      if (onTransactionComplete) {
        onTransactionComplete();
      }
      
      // Zavření modalu
      onClose();
      
      // Zobrazení success message
      alert(`Successfully deposited $${amount.toFixed(2)} USDC on ${selectedNetwork}`);
      
    } catch (error) {
      console.error("Deposit failed:", error);
      alert("Deposit failed. Please try again.");
    }
  };
  
  const handleWithdraw = async () => {
    if (!isValid) return;
    
    // Check if wallet is connected
    if (!userAddress) {
      alert("Please connect your wallet first");
      return;
    }
    
    console.log("Withdraw:", {
      token: "USDC",
      network: selectedNetwork,
      amount: amount,
      userAddress,
    });
    
    // Simulace transakce
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log("Withdraw transaction simulated successfully");
      
      // Zavolání callbacku pro aktualizaci UI
      if (onTransactionComplete) {
        onTransactionComplete();
      }
      
      // Zavření modalu
      onClose();
      
      // Zobrazení success message
      alert(`Successfully withdrew $${amount.toFixed(2)} USDC from ${selectedNetwork}`);
      
    } catch (error) {
      console.error("Withdraw failed:", error);
      alert("Withdraw failed. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Close button - fine-tuned position */}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-3 text-muted-foreground hover:text-foreground transition-colors w-10 h-10 flex items-center justify-center bg-card/80 hover:bg-card rounded-full z-20"
          aria-label="Close deposit modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tabs */}
        <div className="flex border-b border-border pt-1">
          {["deposit", "withdraw"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors relative ${
                activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6">
          <h2 className="text-foreground font-black text-3xl mb-6 uppercase">
            {activeTab === "deposit" ? "Deposit" : "Withdraw"}
          </h2>

          {/* Asset section */}
          <div className="bg-secondary/50 border border-border rounded-xl p-4 mb-6">
            <p className="text-muted-foreground text-xs mb-3">
              Select the asset you want to {activeTab}
            </p>

            <div className="flex gap-4">
              {/* Network dropdown */}
              <NetworkDropdown 
                selectedNetwork={selectedNetwork} 
                onSelect={setSelectedNetwork}
                disabled={!userAddress}
                tooltip={!userAddress ? "Connect wallet to change network" : undefined}
              />

              {/* Amount input */}
              <div className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 flex flex-col justify-between">
                <input
                  type="text"
                  inputmode="decimal"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0"
                  className="bg-transparent text-foreground text-right text-xl font-bold w-full outline-none placeholder:text-muted-foreground"
                />
                <div className="text-muted-foreground text-xs text-right">
                  ${isValid ? (amount).toFixed(2) : "0.00"}
                </div>
              </div>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={activeTab === "deposit" ? handleDeposit : handleWithdraw}
            disabled={!isValid || !userAddress}
            className={`w-full py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all ${
              isValid && userAddress
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-secondary text-muted-foreground cursor-not-allowed opacity-50"
            }`}
            title={!userAddress ? "Connect wallet first" : undefined}
          >
            {!userAddress ? "Connect Wallet First" : (activeTab === "deposit" ? "Deposit" : "Withdraw")}
          </button>
        </div>
      </div>
    </div>
  );
}