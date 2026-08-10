import db from '../db.js';

// Cache for initialization check - only check DB once every 15 minutes
const INIT_CHECK_CACHE = {
  expiresAt: 0
};

const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

export function initDayIfNeeded() {
  const now = Date.now();
  
  // If cache hasn't expired, skip the check
  if (now < INIT_CHECK_CACHE.expiresAt) {
    return;
  }
  
  // Update cache expiration time
  INIT_CHECK_CACHE.expiresAt = now + CACHE_DURATION_MS;
  
  // Get server settings
  const settings = db.prepare('SELECT curr_day, day_begins_hr, init_day_status FROM server_settings LIMIT 1').get();
  
  if (!settings) {
    console.error('No server_settings found');
    return;
  }
  
  // If initialization is already in progress, return
  if (settings.init_day_status === 'starting') {
    return;
  }
  
  // Get current UTC date and time
  const nowDt = new Date();
  const currentDateStr = nowDt.toISOString().split('T')[0]; // YYYY-MM-DD in UTC
  const currentHour = nowDt.getUTCHours();
  
  // Check if we need to initialize a new day
  // Only initialize if: current date is different from stored curr_day AND current hour >= day_begins_hr
  if (currentDateStr === settings.curr_day || currentHour < settings.day_begins_hr) {
    // No need to initialize
    return;
  }
  
  try {
    // Step 1: Set curr_day to today's date and init_day_status to 'starting'
    db.prepare('UPDATE server_settings SET curr_day = ?, init_day_status = ? WHERE id = 1')
      .run(currentDateStr, 'starting');
    
    // Step 2: Query all active chore templates and their assignments
    const choreAssignments = db.prepare(`
      SELECT 
        cta.fk_member_id,
        cta.fk_team_id,
        ct.name
      FROM chore_template_assignment cta
      JOIN chore_template ct ON cta.fk_chore_template_id = ct.id
    `).all();
    
    // Step 3: For each chore assignment, create a chore record
    const choreInsertStmt = db.prepare(`
      INSERT INTO chore (name, fk_member_id, fk_team_id, status, curr_day)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const assignment of choreAssignments) {
      choreInsertStmt.run(
        assignment.name,
        assignment.fk_member_id,
        assignment.fk_team_id,
        'r', // status 'r' = ready
        currentDateStr
      );
    }
    
    // Step 4: Set init_day_status to 'ready'
    db.prepare('UPDATE server_settings SET init_day_status = ? WHERE id = 1')
      .run('ready');
    
    console.log('Day initialized successfully');
  } catch (error) {
    console.error('Error initializing day:', error);
    // Ensure status is set to ready even if there's an error
    db.prepare('UPDATE server_settings SET init_day_status = ? WHERE id = 1')
      .run('ready');
  }
}
