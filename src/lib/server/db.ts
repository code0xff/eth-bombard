import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'eth-bombard.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT UNIQUE,
    account TEXT NOT NULL,
    recipient TEXT NOT NULL,
    status TEXT NOT NULL,
    rpc_url TEXT NOT NULL,
    created_at TEXT NOT NULL,
    receipt_json TEXT,
    error TEXT
  );
`);

export default db;
