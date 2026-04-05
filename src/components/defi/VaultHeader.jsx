import { lazy, Suspense, useState } from "react";
import NetworkSelector from "./NetworkSelector";
import HoldingsCard from "./HoldingsCard";
import { useWallet } from "../../contexts/WalletContext";
import { useBalance } from "../../hooks/useBalance";
import { useSevenDayApy } from "../../hooks/useSevenDayApy";

const DepositModal = lazy(() => import("./DepositModal"));
export default function VaultHeader() {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [defaultModalTab, setDefaultModalTab] = useState("deposit");
  
  // Wallet state
  const { isConnected, userAddress, network, switchNetwork } = useWallet();
  
  // USDC balance - using ultra-simple hook
  const { 
    availableToDeposit,
    isLoading,
    refreshBalance
  } = useBalance(userAddress, network);

  const {
    apy,
    isLoading: isApyLoading,
    refreshApy,
  } = useSevenDayApy(network);
  
  // Balance updates automatically via useEffect in hook
  
  // Aktualizace po transakci
  const handleAfterTransaction = () => {
    refreshBalance();
    refreshApy();
    // Transaction completed, balance and APY refreshed
  };
  
  const handleDepositClick = () => {
    if (!isConnected) {
      // Pokud není připojená peněženka, můžeme zobrazit connect modal
      // Prozatím otevřeme deposit modal a uživatel uvidí $0.00
      // Wallet not connected, showing deposit modal with $0.00
    }
    setDefaultModalTab("deposit");
    setIsDepositModalOpen(true);
  };
  
  return (
    <>
      <div className="px-6 py-6">
        <h2 className="text-foreground font-bold text-2xl mb-6">My positions</h2>

        <div className="positions-row grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {/* USDC Network Selector */}
          <div className="position-card h-full">
            <NetworkSelector 
              onNetworkChange={switchNetwork}
              currentNetwork={network}
            />
          </div>

          {/* Available to Deposit */}
          <div className="position-card h-full">
            <HoldingsCard 
              label="Available to Deposit" 
              value={isLoading ? "Loading..." : availableToDeposit}
              subtitle="Deposit"
              onSubtitleClick={handleDepositClick}
              isLoading={isLoading}
              tooltip={isConnected ? 
                `Your USDC balance on ${network} network` : 
                "Connect wallet to see your USDC balance"
              }
            />
          </div>

          {/* 7D APY Card */}
          <div className="position-card h-full">
            <HoldingsCard 
              label="7D APY" 
              value={isApyLoading ? "Loading..." : apy}
              highlight={true}
              isLoading={isApyLoading}
              tooltip="Native APY from YO SDK vault snapshot"
            />
          </div>
        </div>
        
      </div>
      
      {isDepositModalOpen && (
        <Suspense fallback={null}>
          <DepositModal 
            isOpen={isDepositModalOpen} 
            onClose={() => setIsDepositModalOpen(false)}
            defaultTab={defaultModalTab}
            onTransactionComplete={handleAfterTransaction}
          />
        </Suspense>
      )}
    </>
  );
}