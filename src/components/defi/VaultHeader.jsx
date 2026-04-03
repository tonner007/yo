import { useState } from "react";
import NetworkSelector from "./NetworkSelector";
import DepositModal from "./DepositModal";

export default function VaultHeader() {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [defaultModalTab, setDefaultModalTab] = useState("deposit");
  return (
    <>
      <div className="px-6 py-6">
        <h2 className="text-foreground font-bold text-2xl mb-6">My positions</h2>

        <div className="flex flex-wrap items-center gap-4">
          {/* USDC Network Selector */}
          <NetworkSelector />

          {/* Available to Deposit */}
          <div className="bg-card border border-border rounded-xl px-6 py-3">
            <div className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground mb-1">Available to Deposit</div>
            <div className="text-2xl font-bold text-foreground">$0.00</div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 ml-auto">
            <button 
              onClick={() => {
                setDefaultModalTab("withdraw");
                setIsDepositModalOpen(true);
              }}
              className="bg-secondary text-foreground font-bold text-sm px-7 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              WITHDRAW
            </button>
            <button 
              onClick={() => {
                setDefaultModalTab("deposit");
                setIsDepositModalOpen(true);
              }}
              className="bg-primary text-primary-foreground font-bold text-sm px-7 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              DEPOSIT
            </button>
          </div>
        </div>
      </div>
      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={() => setIsDepositModalOpen(false)}
        defaultTab={defaultModalTab}
      />
    </>
  );
}