import { getUserHistoryForNetwork } from '../lib/yo';
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
    if (value.assets?.formatted != null) {
      const n = Number(value.assets.formatted);
      if (Number.isFinite(n)) return n;
    }

    if (value.assets?.raw != null) {
      const raw = Number(value.assets.raw);
      if (Number.isFinite(raw)) return raw / 1_000_000;
    }

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
    const [balance, net] = await Promise.all([
      getTotalBalanceForNetwork(network, account),
      getNetDeposits(network, account),
    ]);

    const totalBalanceUSD = Number(balance.raw ?? 0);
    const netDepositsUSD = Number(net.netDeposits ?? 0);
    const profitRaw = totalBalanceUSD - netDepositsUSD;
    const abs = Math.abs(profitRaw).toFixed(2);
    const formatted = profitRaw < 0 ? `-$${abs}` : `$${abs}`;

    return {
      totalBalance: totalBalanceUSD,
      netDeposits: netDepositsUSD,
      profitRaw,
      profitFormatted: formatted,
      deposits: net.deposits,
      withdrawals: net.withdrawals,
      history: net.history,
    };
  } catch (error) {
    console.error('Failed to compute profit:', error);
    return {
      totalBalance: 0,
      netDeposits: 0,
      profitRaw: 0,
      profitFormatted: '$0.00',
      deposits: 0,
      withdrawals: 0,
      history: [],
      error,
    };
  }
}
