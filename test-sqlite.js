const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');
db.run('CREATE TABLE test (id INTEGER)');
db.close();
console.log('SQLite3 is working!');