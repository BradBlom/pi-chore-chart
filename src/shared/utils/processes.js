import db from '../db.js';
import { appLogger as logger } from './logger.js';

// Cache for initialization check - only check DB once every 15 minutes
const INIT_CHECK_CACHE = {
  expiresAt: 0
};

const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

export function initDayIfNeeded() {
  const now = Date.now();
  
  // If cache hasn't expired, skip the check
  if (now < INIT_CHECK_CACHE.expiresAt) {
    logger.info(`Skipping day initialization check at %s`, now);
    return;
  } else {
    logger.info(`Checking if day initialization is needed at %s`, now);
  }
  
  // Update cache expiration time
  INIT_CHECK_CACHE.expiresAt = now + CACHE_DURATION_MS;
  
  // Get server settings
  const settings = db.prepare('SELECT curr_day, day_begins_hr, init_day_status FROM server_settings LIMIT 1').get();
  
  if (!settings) {
    logger.error('No server_settings found');
    return;
  }
  
  // If initialization is already in progress, return
  if (settings.init_day_status === 'starting') {
    logger.info('Day initialization is already in progress, skipping');
    return;
  }
  
  // Get current UTC date and time
  const nowDt = new Date();
  const currentDateStr = nowDt.toISOString().split('T')[0]; // YYYY-MM-DD in UTC
  const currentHour = nowDt.getUTCHours();
  
  // Check if we need to initialize a new day
  // Only skip initialization when it's still the same stored day and the current hour is before the configured start hour
  if (currentDateStr === settings.curr_day && currentHour < settings.day_begins_hr) {
    // No need to initialize
    logger.info(`No day initialization needed. Current date: ${currentDateStr}, Stored curr_day: ${settings.curr_day}, Current hour: ${currentHour}, Day begins at hour: ${settings.day_begins_hr}`);
    return;
  }
  
  try {
    // Step 1: Set curr_day to today's date and init_day_status to 'starting'
    db.prepare('UPDATE server_settings SET curr_day = ?, init_day_status = ? WHERE id = 1')
      .run(currentDateStr, 'starting');
    
    // Step 2: Close out chores from the previous stored day
    db.prepare('UPDATE chore SET is_active = 0 WHERE curr_day = ?')
      .run(settings.curr_day);
    
    // Step 3: Query all active chore templates and their assignments
    const choreAssignments = db.prepare(`
      SELECT 
        cta.fk_member_id,
        cta.fk_team_id,
        ct.name
      FROM chore_template_assignment cta
      JOIN chore_template ct ON cta.fk_chore_template_id = ct.id
    `).all();
    
    // Step 4: For each chore assignment, create a chore record
    const choreInsertStmt = db.prepare(`
      INSERT INTO chore (name, fk_member_id, fk_team_id, status, curr_day)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const assignment of choreAssignments) {
      choreInsertStmt.run(
        assignment.name,
        assignment.fk_member_id,
        assignment.fk_team_id,
        'i', // status 'i' = incomplete
        currentDateStr
      );
    }
    
    // Step 5: Set init_day_status to 'ready'
    db.prepare('UPDATE server_settings SET init_day_status = ? WHERE id = 1')
      .run('ready');
    
    logger.info('Day initialized successfully');
  } catch (error) {
    console.error('Error initializing day:', error);
    // Ensure status is set to ready even if there's an error
    db.prepare('UPDATE server_settings SET init_day_status = ? WHERE id = 1')
      .run('ready');
  }
}
