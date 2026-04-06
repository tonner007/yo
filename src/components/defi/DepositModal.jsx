import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { useWallet } from "../../contexts/WalletContext";
import { executeDeposit } from "../../utils/deposit";
import { requestRedeem } from "../../utils/requestRedeem";
import { getWithdrawExchangeRate } from "../../utils/getWithdrawExchangeRate";

function floorToDecimals(value, decimals = 4) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  const factor = 10 ** decimals;
  return Math.floor(num * factor) / factor;
}

function formatFloorToDecimals(value, decimals = 4) {
  return floorToDecimals(value, decimals).toFixed(decimals);
}

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

function isUserRejectedError(error) {
  const rawMessage = String(error?.message || '');
  const message = rawMessage.toLowerCase();
  const code = error?.code;
  const details = String(error?.details || '').toLowerCase();
  const shortMessage = String(error?.shortMessage || '').toLowerCase();
  const causeMessage = String(error?.cause?.message || '').toLowerCase();
  const combined = [message, details, shortMessage, causeMessage].join(' | ');

  return (
    code === 4001 ||
    code === 'ACTION_REJECTED' ||
    combined.includes('user rejected') ||
    combined.includes('user denied') ||
    combined.includes('request rejected') ||
    combined.includes('rejected the request') ||
    combined.includes('transaction rejected') ||
    combined.includes('signature rejected') ||
    combined.includes('cancelled') ||
    combined.includes('canceled') ||
    combined.includes('denied transaction signature') ||
    combined.includes('user rejected the request') ||
    combined.includes('user rejected the transaction') ||
    combined.includes('user rejected the action') ||
    combined.includes('reject')
  );
}

export default function DepositModal({ isOpen, onClose, defaultTab = "deposit", presetAmount = null, skipApproval = false, onTransactionComplete }) {
  const { userAddress, walletClient, switchNetwork } = useWallet();
  const depositPresetAmount = defaultTab === 'deposit' && presetAmount ? formatFloorToDecimals(presetAmount, 4) : null;
  const withdrawPresetAmount = defaultTab === 'withdraw' && presetAmount ? formatFloorToDecimals(presetAmount, 4) : null;
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [selectedNetwork, setSelectedNetwork] = useState("base");
  const [depositAmount, setDepositAmount] = useState(
    defaultTab === 'deposit' ? (depositPresetAmount || "") : (withdrawPresetAmount || "")
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maxWithdrawable, setMaxWithdrawable] = useState(() => {
    if (withdrawPresetAmount) {
      return floorToDecimals(withdrawPresetAmount, 4);
    }
    return 0;
  });
  const [maxDepositAvailable, setMaxDepositAvailable] = useState(() => {
    if (depositPresetAmount) {
      return floorToDecimals(depositPresetAmount, 4);
    }
    return 0;
  });
  const [isAmountValid, setIsAmountValid] = useState(true);

  // Reset amount and update tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);

      if (defaultTab === 'deposit') {
        setDepositAmount(depositPresetAmount || "");
        return;
      }

      if (defaultTab === 'withdraw') {
        setDepositAmount(withdrawPresetAmount || "");
        return;
      }

      setDepositAmount("");
    }
  }, [isOpen, defaultTab, depositPresetAmount, withdrawPresetAmount]);

  const amount = parseFloat(depositAmount);
  const isValid = !isNaN(amount) && amount > 0;

  // Fetch Total Balance limit when modal opens for withdraw tab
  useEffect(() => {
    if (isOpen && activeTab === 'withdraw' && userAddress) {
      if (withdrawPresetAmount) {
        setMaxWithdrawable(floorToDecimals(withdrawPresetAmount, 4));
      }

      const fetchWithdrawLimit = async () => {
        try {
          const { getTotalBalanceForNetwork } = await import("../../utils/getTotalBalance");
          const totalBalance = await getTotalBalanceForNetwork(selectedNetwork, userAddress);
          setMaxWithdrawable(floorToDecimals(totalBalance.raw ?? 0, 4));
        } catch (error) {
          console.error('Failed to fetch withdraw limit from Total Balance:', error);
        }
      };
      fetchWithdrawLimit();
    }
  }, [isOpen, activeTab, userAddress, selectedNetwork, withdrawPresetAmount]);

  // Fetch Available to Deposit limit when modal opens for deposit tab
  useEffect(() => {
    if (isOpen && activeTab === 'deposit' && userAddress) {
      if (depositPresetAmount) {
        setMaxDepositAvailable(floorToDecimals(depositPresetAmount, 4));
      }

      const fetchDepositLimit = async () => {
        try {
          const { getUsdcBalance } = await import("../../utils/getUsdcBalance");
          const available = await getUsdcBalance(userAddress, selectedNetwork);
          const flooredAvailable = floorToDecimals(available.balance ?? 0, 4);
          setMaxDepositAvailable(flooredAvailable);

          if (defaultTab === 'deposit' && presetAmount) {
            setDepositAmount(formatFloorToDecimals(presetAmount, 4));
          }
        } catch (error) {
          console.error('Failed to fetch deposit limit from Available to Deposit:', error);
        }
      };
      fetchDepositLimit();
    }
  }, [isOpen, activeTab, userAddress, selectedNetwork, defaultTab, presetAmount, depositPresetAmount]);

  // Validate amount against current tab limit rounded down to 4 decimals
  useEffect(() => {
    if (!depositAmount) {
      setIsAmountValid(true);
      return;
    }

    const amountNum = Number(depositAmount);

    if (activeTab === 'withdraw') {
      const maxAllowed = floorToDecimals(withdrawPresetAmount ?? maxWithdrawable, 4);
      setIsAmountValid(amountNum > 0 && amountNum <= maxAllowed);
      return;
    }

    if (activeTab === 'deposit') {
      const maxAllowed = floorToDecimals(depositPresetAmount ?? maxDepositAvailable, 4);
      setIsAmountValid(amountNum > 0 && amountNum <= maxAllowed);
      return;
    }

    setIsAmountValid(true);
  }, [depositAmount, maxWithdrawable, maxDepositAvailable, activeTab, depositPresetAmount, withdrawPresetAmount]);

  const handleDeposit = async () => {
    if (!isValid || isSubmitting) return;

    if (!userAddress) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await executeDeposit({
        network: selectedNetwork,
        amount,
        userAddress,
        walletClient,
        switchNetwork,
      });

      // Deposit transaction completed

      if (onTransactionComplete) {
        onTransactionComplete();
      }

      onClose();
      alert(`Deposit completed onchain. Amount: $${amount.toFixed(2)} USDC`);
    } catch (error) {
      if (!isUserRejectedError(error)) {
        console.error("Deposit failed:", error);
        alert(error?.message || "Deposit failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleWithdraw = async () => {
    if (!isValid || isSubmitting) return;

    if (!userAddress) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setIsSubmitting(true);

      const exchangeRateQuote = await getWithdrawExchangeRate(selectedNetwork, userAddress);

      const result = await requestRedeem({
        network: selectedNetwork,
        profitUsd: amount,
        exchangeRateQuote,
        userAddress,
        walletClient,
        switchNetwork,
      });

      // Withdraw transaction completed

      if (onTransactionComplete) {
        onTransactionComplete();
      }

      onClose();
      const assetsOut = result?.redeemReceipt?.assetsOrRequestId != null
        ? Number(result.redeemReceipt.assetsOrRequestId) / 1_000_000
        : amount;
      alert(`Withdraw completed onchain. Received ~$${assetsOut.toFixed(2)} USDC`);
    } catch (error) {
      if (!isUserRejectedError(error)) {
        console.error("Withdraw failed:", error);
        if (String(error?.message || '').includes('429') || String(error?.details || '').includes('429') || String(error?.message || '').toLowerCase().includes('rate limit')) {
          alert('Base RPC je dočasně přetížené (429). Zkus Withdraw za pár sekund znovu.');
        } else {
          alert(error?.message || "Withdraw failed. Please try again.");
        }
      }
    } finally {
      setIsSubmitting(false);
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
              onClick={() => {
              setActiveTab(tab);
              if (tab === 'deposit') {
                setDepositAmount(depositPresetAmount || '');
              } else if (tab === 'withdraw') {
                setDepositAmount(withdrawPresetAmount || '');
              }
            }}
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
                  inputMode="decimal"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0"
                  className={`bg-transparent text-right text-xl font-bold w-full outline-none placeholder:text-muted-foreground ${!isAmountValid ? 'text-red-500' : 'text-foreground'}`}
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
            disabled={!isValid || !userAddress || isSubmitting || !isAmountValid}
            className={`w-full py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all ${
              isValid && userAddress && !isSubmitting && isAmountValid
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-secondary text-muted-foreground cursor-not-allowed opacity-50"
            }`}
            title={!userAddress ? "Connect wallet first" : undefined}
          >
            {!userAddress
              ? "Connect Wallet First"
              : isSubmitting
                ? (activeTab === "deposit" ? "Processing Deposit..." : "Processing Withdraw...")
                : (activeTab === "deposit" ? "Deposit" : "Withdraw")}
          </button>
        </div>
      </div>
    </div>
  );
}