import { useMemo, useState } from "react";
import HoldingsCard from "./HoldingsCard";
import DepositModal from "./DepositModal";
import { useWallet } from "../../contexts/WalletContext";
import { useSevenDayApy } from "../../hooks/useSevenDayApy";
import { useTotalBalance } from "../../hooks/useTotalBalance";
import { useProfit } from "../../hooks/useProfit";
import { useClaimableRewards } from "../../hooks/useClaimableRewards";

export default function HoldingsGrid() {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [defaultModalTab, setDefaultModalTab] = useState("deposit");
  const { network, userAddress } = useWallet();
  const { apyRaw } = useSevenDayApy(network);
  const {
    totalBalance,
    totalBalanceRaw,
    isLoading: isTotalBalanceLoading,
    refreshTotalBalance,
  } = useTotalBalance(userAddress, network);
  const {
    profit,
    profitRaw,
    isLoading: isProfitLoading,
    refreshProfit,
  } = useProfit(userAddress, network);
  const {
    claimableRewards,
    canClaim,
    isLoading: isClaimableRewardsLoading,
    refreshClaimableRewards,
  } = useClaimableRewards(userAddress, network);

  const projectedYearlyEarnings = useMemo(() => {
    const total = Number(totalBalanceRaw || 0);
    const apy = Number(apyRaw || 0);

    if (!total || !apy) {
      return '$0.00';
    }

    const yearly = total * (apy / 100);
    return `$${yearly.toFixed(2)}`;
  }, [apyRaw, totalBalanceRaw]);
  
  const holdings = [
    { 
      label: "Total Balance", 
      value: totalBalance,
      isLoading: isTotalBalanceLoading,
      subtitle: "Withdraw",
      onSubtitleClick: () => {
        setDefaultModalTab("withdraw");
        setIsDepositModalOpen(true);
      }
    },
    { 
      label: "PROFIT & LOSS", 
      value: profit,
      isLoading: isProfitLoading,
      valueClassName: profitRaw > 0 ? 'text-green-500' : profitRaw < 0 ? 'text-red-500' : 'text-foreground',
      subtitle: "Claim profit",
      onSubtitleClick: () => {}
    },
    { label: "Projected 1 Y Earnings", value: projectedYearlyEarnings },
    { 
      label: "Claimable Rewards", 
      value: claimableRewards,
      isLoading: isClaimableRewardsLoading,
      subtitle: "Claim rewards",
      onSubtitleClick: canClaim ? async () => {
        alert('Claim flow is not yet wired to an onchain transaction. Rewards value was refreshed from YO API.');
        refreshClaimableRewards();
        refreshTotalBalance();
        refreshProfit();
      } : () => {}
    },
  ];

  return (
    <>
      <div className="px-6 pb-8">
        <h2 className="text-foreground font-bold text-2xl mb-4">My holdings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {holdings.map((item) => (
            <HoldingsCard key={item.label} {...item} />
          ))}
        </div>
      </div>
      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={() => setIsDepositModalOpen(false)}
        defaultTab={defaultModalTab}
        onTransactionComplete={() => {
          refreshTotalBalance();
          refreshProfit();
          refreshClaimableRewards();
        }}
      />
    </>
  );
}