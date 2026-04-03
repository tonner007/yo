import { getTotalBalanceForNetwork } from './getTotalBalance';
import { YOUSD_VAULT_ADDRESS } from './getSevenDayApy';

const NETWORK_TO_CHAIN = {
  ethereum: 'ethereum',
  base: 'base',
};

function toAmountNumber(value) {
  if (value == null) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  const candidates = [
    value.amount,
    value.assets,
    value.assetAmount,
    value.underlyingAmount,
    value.netAmount,
    value.value,
    value.raw,
    value.formatted,
  ];

  for (const candidate of candidates) {
    const n = Number(candidate);
    if (Number.isFinite(n)) return n;
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

    const networkName = NETWORK_TO_CHAIN[network] ?? 'ethereum';
    const url = `https://api.yo.xyz/api/v1/user/history/${networkName}/${YOUSD_VAULT_ADDRESS}/${account}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`History API failed: ${response.status}`);
    }

    const data = await response.json();
    const history = Array.isArray(data) ? data : (data?.items ?? data?.history ?? []);
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

    const profitRaw = Number(balance.raw ?? 0) - Number(net.netDeposits ?? 0);
    const abs = Math.abs(profitRaw).toFixed(2);
    const formatted = profitRaw < 0 ? `-$${abs}` : `$${abs}`;

    return {
      totalBalance: Number(balance.raw ?? 0),
      netDeposits: Number(net.netDeposits ?? 0),
      profitRaw,
      profitFormatted: formatted,
      deposits: net.deposits,
      withdrawals: net.withdrawals,
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
      error,
    };
  }
}
