import { getUserHistoryForNetwork, getUserPerformanceForNetwork } from '../lib/yo';
import { getTotalBalanceForNetwork } from './getTotalBalance';

function toAmountNumber(value) {
  if (value == null) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,%\s,]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  if (typeof value === 'object') {
    // Prefer assets.formatted (USD value) from YO SDK history
    if (value.assets?.formatted != null) {
      const n = Number(value.assets.formatted);
      if (Number.isFinite(n)) return n;
    }

    // If only raw is available, we need to know the decimals
    // But YO SDK history always provides formatted, so this is fallback
    if (value.assets?.raw != null && value.assets?.decimals != null) {
      const raw = Number(value.assets.raw);
      const decimals = Number(value.assets.decimals);
      if (Number.isFinite(raw) && Number.isFinite(decimals)) {
        return raw / Math.pow(10, decimals);
      }
    }

    // Legacy fallback for other formats
    const candidates = [
      value.amount,
      value.assetAmount,
      value.underlyingAmount,
      value.netAmount,
      value.value,
      value.formatted,
      value.raw,
    ];

    for (const candidate of candidates) {
      const n = toAmountNumber(candidate);
      if (Number.isFinite(n) && n !== 0) return n;
    }
  }

  return 0;
}

function getEventType(item) {
  return String(
    item?.type ?? item?.eventType ?? item?.action ?? item?.kind ?? ''
  ).toLowerCase();
}

function sumNetDeposits(history = []) {
  let deposits = 0;
  let withdrawals = 0;

  for (const item of history) {
    const type = getEventType(item);
    const amount = toAmountNumber(item);

    if (type.includes('deposit')) deposits += amount;
    if (type.includes('withdraw') || type.includes('redeem')) withdrawals += amount;
  }

  return {
    deposits,
    withdrawals,
    netDeposits: deposits - withdrawals,
  };
}

export async function getNetDeposits(network, account) {
  try {
    if (!account) {
      return { deposits: 0, withdrawals: 0, netDeposits: 0, history: [] };
    }

    const history = await getUserHistoryForNetwork(network, account);
    return { ...sumNetDeposits(history), history };
  } catch (error) {
    console.error('Failed to fetch net deposits:', error);
    return { deposits: 0, withdrawals: 0, netDeposits: 0, history: [], error };
  }
}

export async function getProfit(network, account) {
  try {
    // Try to get performance data from YO SDK first (more accurate)
    const performance = await getUserPerformanceForNetwork(network, account);
    
    if (performance && performance.unrealized) {
      // Use YO SDK performance data (what YO app uses)
      const unrealized = Number(performance.unrealized.formatted ?? 0);
      const realized = Number(performance.realized.formatted ?? 0);
      const totalProfit = unrealized + realized;
      const abs = Math.abs(totalProfit).toFixed(4);
      const formatted = totalProfit < 0 ? `-$${abs}` : `$${abs}`;
      
      return {
        totalBalance: 0, // Will be filled by hook
        netDeposits: 0,
        profitRaw: totalProfit,
        profitFormatted: formatted,
        deposits: 0,
        withdrawals: 0,
        history: [],
        source: 'yo-performance',
        unrealized,
        realized,
      };
    }
    
    // Fallback to our own calculation if YO performance not available
    const [balance, net] = await Promise.all([
      getTotalBalanceForNetwork(network, account),
      getNetDeposits(network, account),
    ]);

    const totalBalanceUSD = Number(balance.raw ?? 0);
    const netDepositsUSD = Number(net.netDeposits ?? 0);
    const profitRaw = totalBalanceUSD - netDepositsUSD;
    const abs = Math.abs(profitRaw).toFixed(4);
    const formatted = profitRaw < 0 ? `-$${abs}` : `$${abs}`;

    return {
      totalBalance: totalBalanceUSD,
      netDeposits: netDepositsUSD,
      profitRaw,
      profitFormatted: formatted,
      deposits: net.deposits,
      withdrawals: net.withdrawals,
      history: net.history,
      source: 'calculated',
    };
  } catch (error) {
    console.error('Failed to compute profit:', error);
    return {
      totalBalance: 0,
      netDeposits: 0,
      profitRaw: 0,
      profitFormatted: '$0.0000',
      deposits: 0,
      withdrawals: 0,
      history: [],
      error,
      source: 'error',
    };
  }
}
