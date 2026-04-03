import { useState } from "react";
import HoldingsCard from "./HoldingsCard";
import DepositModal from "./DepositModal";

export default function HoldingsGrid() {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [defaultModalTab, setDefaultModalTab] = useState("deposit");
  
  const holdings = [
    { 
      label: "Total Balance", 
      value: "$11.7", 
      subtitle: "Withdraw",
      onSubtitleClick: () => {
        setDefaultModalTab("withdraw");
        setIsDepositModalOpen(true);
      }
    },
    { label: "7D APY", value: "16.95 %", highlight: true },
    { 
      label: "Profit", 
      value: "$0.04", 
      showInfo: true, 
      subtitle: "Claim profit",
      onSubtitleClick: () => {
        // TODO: Add claim profit functionality
        console.log("Claim profit clicked");
      }
    },
    { label: "Projected 1 Y Earnings", value: "$1.98", showInfo: true },
    { 
      label: "Claimable Rewards", 
      value: "$0.05", 
      showInfo: true, 
      subtitle: "Claim rewards",
      onSubtitleClick: () => {
        // TODO: Add claim rewards functionality
        console.log("Claim rewards clicked");
      }
    },
  ];

  return (
    <>
      <div className="px-6 pb-8">
        <h2 className="text-foreground font-bold text-2xl mb-4">My holdings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {holdings.map((item) => (
            <HoldingsCard key={item.label} {...item} />
          ))}
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