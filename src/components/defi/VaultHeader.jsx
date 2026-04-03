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

          {/* Actions Card */}
          <div className="position-card h-full">
            <div className="stat-card top-card position-card-content">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">ACTIONS</span>
              </div>
              <div className="flex flex-col flex-grow justify-between">
                <div className="mt-auto">
                  <div className="flex gap-3 mt-auto">
                    <button 
                      onClick={() => {
                        setDefaultModalTab("withdraw");
                        setIsDepositModalOpen(true);
                      }}
                      className="bg-secondary text-foreground font-bold text-sm px-4 py-3 rounded-full hover:opacity-90 transition-opacity flex-1"
                    >
                      WITHDRAW
                    </button>
                    <button 
                      onClick={() => {
                        setDefaultModalTab("deposit");
                        setIsDepositModalOpen(true);
                      }}
                      className="bg-primary text-primary-foreground font-bold text-sm px-4 py-3 rounded-full hover:opacity-90 transition-opacity flex-1"
                    >
                      DEPOSIT
                    </button>
                  </div>
                </div>
              </div>
            </div>
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