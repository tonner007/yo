import { createYoClient } from '@yo-protocol/core';

const client = createYoClient({ chainId: 1 });
const vault = '0x0000000f2eb9f69274678c76222b35eec7588a65';
const user = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

try {
  const data = await client.getUserHistory(vault, user);
  console.log(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
} catch (e) {
  console.error('ERR', e?.message || e);
}
