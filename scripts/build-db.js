import Database from 'better-sqlite3';

const db = new Database('data/database.db', { verbose: console.log });
db.pragma('journal_mode = WAL');

const statements = [
  `CREATE TABLE IF NOT EXISTS server_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_begins_hr INTEGER NOT NULL,
    init_day_status TEXT NOT NULL DEFAULT 'ready' CHECK (init_day_status IN ('ready', 'starting')),
    curr_day TEXT NOT NULL DEFAULT '2020-01-01',
    admin_passcode TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS member (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    long_name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_admin INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS team (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    long_name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
  )`,
  // restarts_on values: 'daily', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'
  `CREATE TABLE IF NOT EXISTS chore_template (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    restarts_on TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS chore_template_assignment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fk_chore_template_id INTEGER NOT NULL,
    fk_member_id INTEGER,
    fk_team_id INTEGER,
    FOREIGN KEY (fk_chore_template_id) REFERENCES chore_template(id),
    FOREIGN KEY (fk_member_id) REFERENCES member(id),
    FOREIGN KEY (fk_team_id) REFERENCES team(id)
  )`,
  // i: incomplete, c: complete, u: unsure, r: ready
  `CREATE TABLE IF NOT EXISTS chore (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    fk_member_id INTEGER,
    fk_team_id INTEGER,
    status TEXT NOT NULL DEFAULT 'i' CHECK (status IN ('i', 'c', 'u', 'r')),
    curr_day TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (fk_member_id) REFERENCES member(id),
    FOREIGN KEY (fk_team_id) REFERENCES team(id)
  )`,
  `CREATE TABLE IF NOT EXISTS event (
    id INTEGER PRIMARY KEY AUTOINCREMENT
  )`
];

for (const statement of statements) {
  db.exec(statement);
}

db.exec(`
  INSERT INTO server_settings (day_begins_hr, admin_passcode)
  SELECT 5, 'admin123'
  WHERE NOT EXISTS (SELECT 1 FROM server_settings)
`);

console.log('Database schema created successfully.');
db.close();

