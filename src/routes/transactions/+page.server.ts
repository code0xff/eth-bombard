import type { PageServerLoad } from './$types';
import db from '$lib/server/db';

const PAGE_SIZE_DEFAULT = 10;
const PAGE_SIZE_MAX = 50;

export const load: PageServerLoad = ({ url }) => {
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

  const summary = db
    .prepare(
      `SELECT
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
       FROM transactions`
    )
    .get() as { confirmed: number | null; failed: number | null; pending: number | null };

  return {
    page,
    pageSize,
    total: total.count,
    items,
    summary: {
      confirmed: summary.confirmed ?? 0,
      failed: summary.failed ?? 0,
      pending: summary.pending ?? 0,
    },
  };
};
