import { useEffect, useState } from 'react';
import { getWithdrawDebugValuesForNetwork } from '../../utils/getWithdrawDebugValues';

export const SHOW_DEBUG_WITHDRAW_VALUES = false;

export default function WithdrawDebugValues({ userAddress, network }) {
  const [values, setValues] = useState({
    totalBalanceDebugFormatted: '$0.00',
    maxWithdrawableDebugFormatted: '$0.00',
    vaultTotalAssetsFormatted: '$0.00',
    sharesFormatted: '0.000000',
    differenceFormatted: '$0.00',
    estimatedFeeFormatted: '$0.0000',
    estimatedFeePercentFormatted: '0.000000%',
    estimatedFeePercentVsMaxFormatted: '0.000000%',
    totalDepositedFormatted: '$0.00',
    totalWithdrawnFormatted: '$0.00',
    netDepositsFormatted: '$0.00',
    grossProfitFormatted: '$0.0000',
    exchangeRateMaxFormatted: '0.000000',
    exchangeRateQuoteFormatted: '0.000000',
    grossProfitInSharesFormatted: '0.000000',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!SHOW_DEBUG_WITHDRAW_VALUES || !userAddress) return;
      setIsLoading(true);
      try {
        const result = await getWithdrawDebugValuesForNetwork(network, userAddress);
        if (!cancelled) {
          setValues(result);
        }
      } catch {
        if (!cancelled) {
          setValues({
            totalBalanceDebugFormatted: '$0.00',
            maxWithdrawableDebugFormatted: '$0.00',
            vaultTotalAssetsFormatted: '$0.00',
            sharesFormatted: '0.000000',
            differenceFormatted: '$0.00',
            estimatedFeeFormatted: '$0.0000',
            estimatedFeePercentFormatted: '0.000000%',
            estimatedFeePercentVsMaxFormatted: '0.000000%',
            totalDepositedFormatted: '$0.00',
            totalWithdrawnFormatted: '$0.00',
            netDepositsFormatted: '$0.00',
            grossProfitFormatted: '$0.0000',
            exchangeRateMaxFormatted: '0.000000',
            exchangeRateQuoteFormatted: '0.000000',
            grossProfitInSharesFormatted: '0.000000',
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [network, userAddress]);

  if (!SHOW_DEBUG_WITHDRAW_VALUES || !userAddress) {
    return null;
  }

  return (
    <div className="px-6 pb-8">
      <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
        <div className="mb-2 font-semibold text-white/70">Debug values</div>
        <div className="space-y-2">
          <div>
            <div>
              Debug: Total Balance (quotePreviewRedeem):{' '}
              <span className="text-white/85">
                {isLoading ? 'Loading...' : values.totalBalanceDebugFormatted}
              </span>
            </div>
            <div className="text-white/45">• Odhad, kolik pravděpodobně dostaneš podle YO quote flow.</div>
          </div>
          <div>
            <div>
              Debug: Max Withdrawable (maxWithdraw):{' '}
              <span className="text-white/85">
                {isLoading ? 'Loading...' : values.maxWithdrawableDebugFormatted}
              </span>
            </div>
            <div className="text-white/45">• Kolik ti kontrakt dovolí právě teď maximálně vybrat.</div>
          </div>
          <div>
            <div>
              Debug: Vault Total Assets (totalAssets):{' '}
              <span className="text-white/85">
                {isLoading ? 'Loading...' : values.vaultTotalAssetsFormatted}
              </span>
            </div>
            <div className="text-white/45">• Celková hodnota aktiv, které vault spravuje.</div>
          </div>
          <div>
            <div>
              Debug: Your Shares:{' '}
              <span className="text-white/85">
                {isLoading ? 'Loading...' : values.sharesFormatted}
              </span>
            </div>
            <div className="text-white/45">• Počet tvých vault share tokenů, tedy tvůj podíl ve vaultu.</div>
          </div>
          <div>
            <div>
              Debug: Difference (quote vs maxWithdraw):{' '}
              <span className="text-white/85">
                {isLoading ? 'Loading...' : values.differenceFormatted}
              </span>
            </div>
            <div className="text-white/45">• Rozdíl mezi YO quote odhadem a contract-level maximem pro výběr.</div>
          </div>
          <div>
            <div>
              Debug: Estimated Withdraw Fee:{' '}
              <span className="text-white/85">
                {isLoading ? 'Loading...' : `${values.estimatedFeeFormatted} (${values.estimatedFeePercentFormatted})`}
              </span>
            </div>
            <div className="text-white/45">• Odhad vypočtený jako Max Withdrawable minus quotePreviewRedeem, procenta jsou počítaná vůči quotePreviewRedeem.</div>
            <div className="text-white/45">• Procenta vůči Max Withdrawable: <span className="text-white/70">{isLoading ? 'Loading...' : values.estimatedFeePercentVsMaxFormatted}</span></div>
          </div>
          <div>
            <div>
              Debug: Total Deposited USDC:{' '}
              <span className="text-white/85">
                {isLoading ? 'Loading...' : values.totalDepositedFormatted}
              </span>
            </div>
            <div className="text-white/45">• Součet všech deposit operací do vaultu podle historie uživatele.</div>
          </div>
          <div>
            <div>
              Debug: Total Withdrawn USDC:{' '}
              <span className="text-white/85">
                {isLoading ? 'Loading...' : values.totalWithdrawnFormatted}
              </span>
            </div>
            <div className="text-white/45">• Součet všech withdraw nebo redeem operací podle historie uživatele.</div>
          </div>
          <div>
            <div>
              Debug: Net Deposits:{' '}
              <span className="text-white/85">
                {isLoading ? 'Loading...' : values.netDepositsFormatted}
              </span>
            </div>
            <div className="text-white/45">• Vypočteno jako Total Deposited USDC minus Total Withdrawn USDC.</div>
          </div>
          <div>
            <div>
              Debug: Gross Profit:{' '}
              <span className="text-white/85">
                {isLoading ? 'Loading...' : values.grossProfitFormatted}
              </span>
            </div>
            <div className="text-white/45">• Vypočteno jako Max Withdrawable minus Net Deposits.</div>
          </div>
          <div>
            <div>
              Debug: Exchange Rate (maxWithdraw / shares):{' '}
              <span className="text-white/85">
                {isLoading ? 'Loading...' : `${values.exchangeRateMaxFormatted} USDC`}
              </span>
            </div>
            <div className="text-white/45">• Kolik USDC vychází na 1 yoUSD share podle Max Withdrawable.</div>
          </div>
          <div>
            <div>
              Debug: Exchange Rate (quote / shares):{' '}
              <span className="text-white/85">
                {isLoading ? 'Loading...' : `${values.exchangeRateQuoteFormatted} USDC`}
              </span>
            </div>
            <div className="text-white/45">• Kolik USDC vychází na 1 yoUSD share podle quotePreviewRedeem.</div>
          </div>
          <div>
            <div>
              Debug: Gross Profit in yoUSD:{' '}
              <span className="text-white/85">
                {isLoading ? 'Loading...' : values.grossProfitInSharesFormatted}
              </span>
            </div>
            <div className="text-white/45">• Přibližný brutto profit přepočtený zpět do yoUSD shares podle Max Withdrawable rate.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
