import { json } from '@sveltejs/kit';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import db from '$lib/server/db';

export const POST = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return json({ error: 'Invalid transaction id.' }, { status: 400 });
  }

  const row = db
    .prepare('SELECT id, hash, rpc_url as rpcUrl FROM transactions WHERE id = ?')
    .get(id) as { id: number; hash: `0x${string}`; rpcUrl: string } | undefined;

  if (!row) {
    return json({ error: 'Transaction not found.' }, { status: 404 });
  }

  try {
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(row.rpcUrl),
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: row.hash });
    const status = receipt.status === 'success' ? 'confirmed' : 'failed';

    db.prepare('UPDATE transactions SET status = ?, receipt_json = ?, error = NULL WHERE id = ?').run(
      status,
      JSON.stringify(receipt),
      row.id
    );

    return json({ receipt, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch receipt.';
    db.prepare('UPDATE transactions SET status = ?, error = ? WHERE id = ?').run('failed', message, row.id);
    return json({ error: message }, { status: 500 });
  }
};
