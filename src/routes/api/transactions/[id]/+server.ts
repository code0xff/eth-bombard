import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

export const GET = ({ params }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return json({ error: 'Invalid transaction id.' }, { status: 400 });
  }

  const row = db
    .prepare(
      `SELECT id, hash, account, recipient, status, created_at as createdAt, receipt_json as receiptJson, error
       FROM transactions
       WHERE id = ?`
    )
    .get(id);

  if (!row) {
    return json({ error: 'Transaction not found.' }, { status: 404 });
  }

  return json({ transaction: row });
};
