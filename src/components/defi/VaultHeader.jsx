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

        <div className="positions-row grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {/* USDC Network Selector */}
          <div className="position-card h-full">
            <NetworkSelector />
          </div>

          {/* Available to Deposit */}
          <div className="position-card h-full">
            <HoldingsCard 
              label="Available to Deposit" 
              value="$0.00" 
              subtitle="Deposit"
              onSubtitleClick={() => {
                setDefaultModalTab("deposit");
                setIsDepositModalOpen(true);
              }}
            />
          </div>

          {/* 7D APY Card */}
          <div className="position-card h-full">
            <HoldingsCard 
              label="7D APY" 
              value="16.95 %" 
              highlight={true}
            />
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