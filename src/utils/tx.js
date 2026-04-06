export async function ensureWalletChain({ walletClient, switchNetwork, network, chainId, targetChain, fallbackMessage }) {
  if (walletClient.chain?.id !== chainId) {
    const switched = await switchNetwork?.(network);
    if (!switched?.success) {
      throw new Error(switched?.error || fallbackMessage || `Please switch wallet to ${network}`);
    }
  }

  return targetChain;
}

export async function buildTxRequest(publicClient, walletClient, targetChain, userAddress, tx) {
  const baseRequest = {
    account: walletClient.account,
    to: tx.to,
    data: tx.data,
    value: tx.value ?? 0n,
    chain: targetChain,
  };

  try {
    const gas = await publicClient.estimateGas({
      account: userAddress,
      to: tx.to,
      data: tx.data,
      value: tx.value ?? 0n,
    });

    const fees = await publicClient.estimateFeesPerGas();

    return {
      ...baseRequest,
      gas: (gas * 120n) / 100n,
      ...(fees.maxFeePerGas ? { maxFeePerGas: fees.maxFeePerGas } : {}),
      ...(fees.maxPriorityFeePerGas ? { maxPriorityFeePerGas: fees.maxPriorityFeePerGas } : {}),
      ...(fees.gasPrice ? { gasPrice: fees.gasPrice } : {}),
    };
  } catch {
    return baseRequest;
  }
}

/**
 * @param {object} params
 * @param {any} params.publicClient
 * @param {any} params.walletClient
 * @param {any} params.targetChain
 * @param {any} params.userAddress
 * @param {any[]} params.txs
 * @param {(hash: string) => Promise<any>} [params.waitForLastReceipt]
 */
export async function sendTransactions({ publicClient, walletClient, targetChain, userAddress, txs, waitForLastReceipt }) {
  const hashes = [];
  let lastResult = null;

  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    const request = await buildTxRequest(publicClient, walletClient, targetChain, userAddress, tx);
    const hash = await walletClient.sendTransaction(request);
    hashes.push(hash);

    if (i < txs.length - 1) {
      await publicClient.waitForTransactionReceipt({ hash });
    } else {
      lastResult = waitForLastReceipt
        ? await waitForLastReceipt(hash)
        : await publicClient.waitForTransactionReceipt({ hash });
    }
  }

  return { hashes, lastResult };
}
