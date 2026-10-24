import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.resolve(__dirname, '../../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.resolve(dbDir, 'stocksmart.db');
const db = new DatabaseSync(dbPath);

// Enable foreign key enforcement
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export const query = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
};

export const get = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
};

export const run = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
};

export const exec = (sql) => {
  return db.exec(sql);
};

export const transaction = (callback) => {
  db.exec('BEGIN IMMEDIATE TRANSACTION;');
  try {
    const result = callback({ query, get, run, exec });
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
};

export default {
  db,
  query,
  get,
  run,
  exec,
  transaction
};
