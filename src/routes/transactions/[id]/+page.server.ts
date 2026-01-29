import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import db from '$lib/server/db';

export const load: PageServerLoad = ({ params }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    throw error(400, 'Invalid transaction id.');
  }

  const row = db
    .prepare(
      `SELECT id, hash, account, recipient, status, created_at as createdAt, receipt_json as receiptJson, error
       FROM transactions
       WHERE id = ?`
    )
    .get(id) as
    | {
        id: number;
        hash: string;
        account: string;
        recipient: string;
        status: string;
        createdAt: string;
        receiptJson?: string | null;
        error?: string | null;
      }
    | undefined;

  if (!row) {
    throw error(404, 'Transaction not found.');
  }

  return {
    transaction: {
      ...row,
      receipt: row.receiptJson ? JSON.parse(row.receiptJson) : null,
    },
  };
};
