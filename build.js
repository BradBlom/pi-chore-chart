import Database from 'better-sqlite3';
const db = new Database('database.db', { verbose: console.log });
db.pragma('journal_mode = WAL');

// recourring_type can be: dy (daily) wk (weekly)
// restarts_at for daily is the hour (between 0 and 23) and for weekly is day of the week-hour (1-08 for Monday at 8pm)
const tblCategory = `CREATE TABLE IF NOT EXISTS category (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  l_name TEXT NOT NULL,
  s_name TEXT NOT NULL,
  reoccurring_type TEXT NOT NULL,
  restarts_at TEXT NOT NULL,
  is_multi_worker INTEGER NOT NULL DEFAULT 0,
  btn_coordinates TEXT NOT NULL
);`;

const tblChore = `CREATE TABLE IF NOT EXISTS chore (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES category(id)
);`;
