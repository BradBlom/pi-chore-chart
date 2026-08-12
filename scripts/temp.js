import Database from 'better-sqlite3';

const db = new Database('data/database.db', { verbose: console.log });
db.pragma('journal_mode = WAL');

// const recs_server_settings = {
//     singleEntry: {
//         day_begins_hr: 5,
//         admin_passcode: 'admin123'
//     }
// };

// const settings = db.prepare('SELECT curr_day, day_begins_hr, init_day_status FROM server_settings LIMIT 1').get();
// console.log('Current server_settings:', settings);  

// const chores = db.prepare('SELECT * FROM chore').all();
// console.log('Current chore records:', chores);

db.prepare('UPDATE chore SET curr_day = ? WHERE 1=1')
  .run('2020-01-01');

db.prepare('UPDATE server_settings SET curr_day = ?, init_day_status = ? WHERE id = 1')
  .run('2020-01-01', 'ready');

console.log('updated successfully.');
db.close();
