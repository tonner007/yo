import { useState } from "react";
import NetworkSelector from "./NetworkSelector";
import DepositModal from "./DepositModal";
import HoldingsCard from "./HoldingsCard";

export default function VaultHeader() {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [defaultModalTab, setDefaultModalTab] = useState("deposit");
  return (
    <>
      <div className="px-6 py-6">
        <h2 className="text-foreground font-bold text-2xl mb-6">My positions</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {/* Top cards container */}
          <div className="top-cards grid grid-cols-2 gap-4 md:col-span-2">
            {/* USDC Network Selector */}
            <div className="h-full">
              <NetworkSelector />
            </div>

            {/* Available to Deposit */}
            <div className="h-full">
              <HoldingsCard 
                label="Available to Deposit" 
                value="$0.00" 
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 justify-end md:justify-start">
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