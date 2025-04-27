const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    address TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS votes (
    proposal_id INTEGER,
    username TEXT,
    vote TEXT,
    tokens INTEGER
  )`);
});

module.exports = db;