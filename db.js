// db.js — better-sqlite3 is synchronous, so no async ceremony needed
// for simple queries. Creates app.db in the project root on first run.
const Database = require('better-sqlite3');
const db = new Database('app.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    verified INTEGER NOT NULL DEFAULT 0,
    verify_token TEXT,
    verify_token_expires INTEGER
  )
`);

module.exports = db;
