import { lazy, Suspense, useMemo, useState } from "react";
import HoldingsCard from "./HoldingsCard";
import { useWallet } from "../../contexts/WalletContext";
import { useSevenDayApy } from "../../hooks/useSevenDayApy";
import { useTotalBalance } from "../../hooks/useTotalBalance";
import { useProfit } from "../../hooks/useProfit";
import { useClaimableRewards } from "../../hooks/useClaimableRewards";
import WithdrawDebugValues from "./WithdrawDebugValues";
import { getWithdrawDebugValuesForNetwork } from "../../utils/getWithdrawDebugValues";
import { requestRedeem } from "../../utils/requestRedeem";

const DepositModal = lazy(() => import("./DepositModal"));
function isUserRejectedError(error) {
  const combined = [
    String(error?.message || ''),
    String(error?.details || ''),
    String(error?.shortMessage || ''),
    String(error?.cause?.message || ''),
  ].join(' | ').toLowerCase();
  return (
    error?.code === 4001 ||
    error?.code === 'ACTION_REJECTED' ||
    combined.includes('user rejected') ||
    combined.includes('user denied') ||
    combined.includes('request rejected') ||
    combined.includes('reject') ||
    combined.includes('cancelled') ||
    combined.includes('canceled')
  );
}

function isRateLimitError(error) {
  const combined = [
    String(error?.message || ''),
    String(error?.details || ''),
    String(error?.shortMessage || ''),
    String(error?.cause?.message || ''),
  ].join(' | ').toLowerCase();
  return combined.includes('429') || combined.includes('rate limit') || combined.includes('over rate limit');
}

export default function HoldingsGrid() {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [defaultModalTab, setDefaultModalTab] = useState("deposit");
  const [isClaimingProfit, setIsClaimingProfit] = useState(false);
  const { network, userAddress, walletClient, switchNetwork } = useWallet();
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

  const handleClaimProfit = async () => {
    if (!userAddress || !walletClient || isClaimingProfit || !profitRaw || profitRaw <= 0) {
      return;
    }

    try {
      setIsClaimingProfit(true);
      const debugValues = await getWithdrawDebugValuesForNetwork(network, userAddress);
      const exchangeRateQuote = Number(debugValues.exchangeRateQuoteRaw ?? 0);

      if (!exchangeRateQuote || exchangeRateQuote <= 0) {
        throw new Error('Exchange rate unavailable');
      }

      await executeClaimProfit({
        network,
        profitUsd: Number(profitRaw),
        exchangeRateQuote,
        userAddress,
        walletClient,
        switchNetwork,
      });

      refreshTotalBalance();
      refreshProfit();
      refreshClaimableRewards();
    } catch (error) {
      if (!isUserRejectedError(error)) {
        console.error('Claim profit failed:', error);
        if (isRateLimitError(error)) {
          alert('Base RPC je dočasně přetížené (429). Zkus Claim profit za pár sekund znovu.');
        } else {
          alert(error?.message || error?.shortMessage || 'Claim profit failed. Please try again.');
        }
      }
    } finally {
      setIsClaimingProfit(false);
    }
  };

  const handleRequestRedeem = async () => {
    if (!userAddress || !walletClient || isClaimingProfit || !profitRaw || profitRaw <= 0) {
      return;
    }

    try {
      setIsClaimingProfit(true);
      const debugValues = await getWithdrawDebugValuesForNetwork(network, userAddress);
      const exchangeRateQuote = Number(debugValues.exchangeRateQuoteRaw ?? 0);

      if (!exchangeRateQuote || exchangeRateQuote <= 0) {
        throw new Error('Exchange rate unavailable');
      }

      await requestRedeem({
        network,
        profitUsd: Number(profitRaw),
        exchangeRateQuote,
        userAddress,
        walletClient,
        switchNetwork,
      });

      refreshTotalBalance();
      refreshProfit();
      refreshClaimableRewards();
      
      alert('Profit claimed successfully!');
    } catch (error) {
      if (!isUserRejectedError(error)) {
        console.error('Request redeem failed:', error);
        if (isRateLimitError(error)) {
          alert('Base RPC je dočasně přetížené (429). Zkus Claim profit za pár sekund znovu.');
        } else {
          alert(error?.message || error?.shortMessage || 'Claim profit failed. Please try again.');
        }
      }
    } finally {
      setIsClaimingProfit(false);
    }
  };

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
      showInfo: true,
      tooltip: "Current profit or loss versus your net deposits",
      subtitle: profitRaw > 0 ? "Claim profit" : null,
      onSubtitleClick: profitRaw > 0 ? handleRequestRedeem : undefined
    },
    { 
      label: "Projected 1 Y Earnings", 
      value: projectedYearlyEarnings,
      showInfo: true,
      tooltip: "Simple yearly estimate based on current total balance and native APY"
    },
    { 
      label: "Claimable Rewards", 
      value: claimableRewards,
      isLoading: isClaimableRewardsLoading,
      showInfo: true,
      tooltip: "Additional rewards available to claim separately from vault balance",
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
      <WithdrawDebugValues userAddress={userAddress} network={network} />
      {isDepositModalOpen && (
        <Suspense fallback={null}>
          <DepositModal 
            key={`deposit-modal-${defaultModalTab}`}
            isOpen={isDepositModalOpen} 
            onClose={() => setIsDepositModalOpen(false)}
            defaultTab={defaultModalTab}
            presetAmount={null}
            skipApproval={false}
            onTransactionComplete={() => {
              refreshTotalBalance();
              refreshProfit();
              refreshClaimableRewards();
            }}
          />
        </Suspense>
      )}
    </>
  );
}