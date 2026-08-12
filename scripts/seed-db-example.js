import Database from 'better-sqlite3';

const db = new Database('data/database.db', { verbose: console.log });
db.pragma('journal_mode = WAL');

const recs_server_settings = {
    singleEntry: {
        day_begins_hr: 5,
        admin_passcode: 'admin123'
    }
};

const recs_members = {
    alice: {
        long_name: 'Alice Johnson',
        short_name: 'Alice',
        is_active: 1,
        is_admin: 1
    },
    bob: {
        long_name: 'Bob Smith',
        short_name: 'Bob',
        is_active: 1,
        is_admin: 0
    }
};

const recs_team = {
    kitchen: {
        long_name: 'Kitchen Crew',
        short_name: 'Kitchen',
        is_active: 1
    }
};

const recs_chore_template = {
    brushTeeth: {
        name: 'Brush teeth',
        restarts_on: 'daily'
    },
    washDishes: {
        name: 'Wash dishes',
        restarts_on: 'mon'
    },
    cleanCounters: {
        name: 'Clean counters',
        restarts_on: 'wed,fri'
    },
    laundry: {
        name: 'Laundry',
        restarts_on: 'sun'
    }
};

const recs_chore_template_assignment = [
    { choreTemplateKey: 'brushTeeth', memberKey: 'alice', teamKey: null },
    { choreTemplateKey: 'brushTeeth', memberKey: 'bob', teamKey: null },
    { choreTemplateKey: 'washDishes', memberKey: null, teamKey: 'kitchen' },
    { choreTemplateKey: 'cleanCounters', memberKey: null, teamKey: 'kitchen' },
    { choreTemplateKey: 'laundry', memberKey: 'alice', teamKey: null }
];

const recs_chore = {
    aliceBrushTeeth: {
        name: 'Brush teeth',
        memberKey: 'alice',
        teamKey: null,
        status: 'c',
        curr_day: '2026-07-15'
    },
    bobBrushTeeth: {
        name: 'Brush teeth',
        memberKey: 'bob',
        teamKey: null,
        status: 'i',
        curr_day: '2026-07-15'
    },
    kitchenWashDishes: {
        name: 'Wash dishes',
        memberKey: null,
        teamKey: 'kitchen',
        status: 'r',
        curr_day: '2026-07-14'
    },
    kitchenCleanCounters: {
        name: 'Clean counters',
        memberKey: null,
        teamKey: 'kitchen',
        status: 'u',
        curr_day: '2026-07-16'
    }
};

// Insert sample server_settings
const serverSettingsStmt = db.prepare(`
  INSERT INTO server_settings (day_begins_hr, admin_passcode)
  VALUES (?, ?)
`);
const serverSettingsResult = serverSettingsStmt.run(recs_server_settings.singleEntry.day_begins_hr, recs_server_settings.singleEntry.admin_passcode);
recs_server_settings.singleEntry.id = serverSettingsResult.lastInsertRowid;
console.log('Inserted server_settings with id:', recs_server_settings.singleEntry.id);

// Insert sample members
const memberStmt = db.prepare(`
  INSERT INTO member (long_name, short_name, is_active, is_admin)
  VALUES (?, ?, ?, ?)
`);
Object.keys(recs_members).forEach(key => {
  const member = recs_members[key];
  const result = memberStmt.run(member.long_name, member.short_name, member.is_active, member.is_admin);
  member.id = result.lastInsertRowid;
  console.log(`Inserted member (${key}) with id:`, member.id);
});

// Insert sample team
const teamStmt = db.prepare(`
  INSERT INTO team (long_name, short_name, is_active)
  VALUES (?, ?, ?)
`);
Object.keys(recs_team).forEach(key => {
  const team = recs_team[key];
  const result = teamStmt.run(team.long_name, team.short_name, team.is_active);
  team.id = result.lastInsertRowid;
  console.log(`Inserted team (${key}) with id:`, team.id);
});

// Insert sample chore templates
const choreTemplateStmt = db.prepare(`
  INSERT INTO chore_template (name, restarts_on)
  VALUES (?, ?)
`);
Object.keys(recs_chore_template).forEach(key => {
  const choreTemplate = recs_chore_template[key];
  const result = choreTemplateStmt.run(choreTemplate.name, choreTemplate.restarts_on);
  choreTemplate.id = result.lastInsertRowid;
  console.log(`Inserted chore_template (${key}) with id:`, choreTemplate.id);
});

// Assign chore templates
const choreTemplateAssignmentStmt = db.prepare(`
  INSERT INTO chore_template_assignment (fk_chore_template_id, fk_member_id, fk_team_id)
  VALUES (?, ?, ?)
`);
recs_chore_template_assignment.forEach((assignment, index) => {
  const choreTemplateId = recs_chore_template[assignment.choreTemplateKey].id;
  const memberId = assignment.memberKey ? recs_members[assignment.memberKey].id : null;
  const teamId = assignment.teamKey ? recs_team[assignment.teamKey].id : null;
  choreTemplateAssignmentStmt.run(choreTemplateId, memberId, teamId);
  console.log(`Inserted chore_template_assignment ${index + 1}`);
});

// Insert sample chores
const choreStmt = db.prepare(`
  INSERT INTO chore (name, fk_member_id, fk_team_id, status, curr_day)
  VALUES (?, ?, ?, ?, ?)
`);
Object.keys(recs_chore).forEach(key => {
  const chore = recs_chore[key];
  const memberId = chore.memberKey ? recs_members[chore.memberKey].id : null;
  const teamId = chore.teamKey ? recs_team[chore.teamKey].id : null;
  const result = choreStmt.run(chore.name, memberId, teamId, chore.status, chore.curr_day);
  chore.id = result.lastInsertRowid;
  console.log(`Inserted chore (${key}) with id:`, chore.id);
});

console.log('Sample data inserted successfully.');
db.close();
