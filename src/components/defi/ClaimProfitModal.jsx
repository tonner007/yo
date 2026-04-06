import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useWallet } from "../../contexts/WalletContext";
import { executeWithdraw } from "../../utils/withdraw";
import { notifySuccess } from "../../lib/notify";

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

export default function ClaimProfitModal({ isOpen, onClose, profitAmount, onTransactionComplete }) {
  const { userAddress, walletClient, switchNetwork } = useWallet();
  const [selectedNetwork, setSelectedNetwork] = useState("base");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const amount = parseFloat(profitAmount);
  const isValid = !isNaN(amount) && amount > 0;

  const handleClaim = async () => {
    if (!isValid || isSubmitting) return;

    if (!userAddress) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await executeWithdraw({
        network: selectedNetwork,
        amount,
        userAddress,
        walletClient,
        switchNetwork,
        skipApproval: false, // Use approval flow for reliability
      });

      if (onTransactionComplete) {
        onTransactionComplete();
      }

      onClose();
      notifySuccess(`Profit claimed successfully! Amount: $${amount.toFixed(4)} USDC`);
    } catch (error) {
      if (!isUserRejectedError(error)) {
        setError(error?.message || "Claim profit failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-foreground font-bold text-xl">Claim Profit</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Withdraw your profit from YOUSD vault
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Amount display */}
          <div className="mb-6">
            <div className="text-muted-foreground text-sm mb-2">Amount to claim</div>
            <div className="flex items-center justify-between p-4 bg-secondary border border-border rounded-xl">
              <div>
                <div className="text-foreground font-bold text-2xl">${profitAmount}</div>
                <div className="text-muted-foreground text-sm mt-1">USDC</div>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src="/icons/usdc.png"
                  alt="USDC"
                  className="w-10 h-10 rounded-full object-contain"
                />
                <div className="text-right">
                  <div className="text-foreground font-bold text-sm">USDC</div>
                  <div className="text-muted-foreground text-xs">Base</div>
                </div>
              </div>
            </div>
          </div>

          {/* Network selector (simplified) */}
          <div className="mb-6">
            <div className="text-muted-foreground text-sm mb-2">Network</div>
            <div className="flex gap-2">
              {["base", "ethereum", "arbitrum"].map((network) => (
                <button
                  key={network}
                  onClick={() => setSelectedNetwork(network)}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-colors ${
                    selectedNetwork === network
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-secondary border-border text-foreground hover:border-muted-foreground"
                  }`}
                  disabled={isSubmitting}
                >
                  <div className="font-bold text-sm capitalize">{network}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="text-red-500 text-sm">{error}</div>
            </div>
          )}

          {/* Info note */}
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="text-blue-500 text-sm">
              <strong>Note:</strong> This will trigger two transactions:
              <ol className="list-decimal ml-4 mt-2 space-y-1">
                <li>Approve spending cap for YOUSD vault</li>
                <li>Redeem profit shares to USDC</li>
              </ol>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-secondary border border-border rounded-xl text-foreground font-bold hover:bg-muted transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleClaim}
              disabled={!isValid || isSubmitting}
              className="flex-1 py-3 px-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Processing..." : "Claim Profit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}