import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

const PAGE_SIZE_DEFAULT = 10;
const PAGE_SIZE_MAX = 50;

export const GET = ({ url }) => {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const pageSize = Math.min(
    PAGE_SIZE_MAX,
    Math.max(1, Number(url.searchParams.get('pageSize') ?? PAGE_SIZE_DEFAULT))
  );
  const offset = (page - 1) * pageSize;

  const total = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number };
  const items = db
    .prepare(
      `SELECT id, hash, account, recipient, status, created_at as createdAt, receipt_json as receiptJson, error
       FROM transactions
       ORDER BY id DESC
       LIMIT ? OFFSET ?`
    )
    .all(pageSize, offset);

  return json({
    page,
    pageSize,
    total: total.count,
    items,
  });
};

export const POST = async ({ request }) => {
  const payload = await request.json();
  const hash = String(payload.hash ?? '').trim();
  const account = String(payload.account ?? '').trim();
  const recipient = String(payload.recipient ?? '').trim();
  const rpcUrl = String(payload.rpcUrl ?? '').trim();

  if (!hash || !account || !recipient || !rpcUrl) {
    return json({ error: 'Missing required transaction fields.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const statement = db.prepare(
    `INSERT OR IGNORE INTO transactions (hash, account, recipient, status, rpc_url, created_at)
     VALUES (?, ?, ?, 'pending', ?, ?)`
  );
  statement.run(hash, account, recipient, rpcUrl, now);

  const row = db
    .prepare(
      `SELECT id, hash, account, recipient, status, created_at as createdAt, receipt_json as receiptJson, error
       FROM transactions
       WHERE hash = ?`
    )
    .get(hash);

  return json({ transaction: row });
};
