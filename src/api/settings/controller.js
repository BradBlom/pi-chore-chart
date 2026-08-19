import db from '../../shared/db.js';
import { transformToApi, transformToDb } from '../transform.js';
import { appLogger as logger } from '../../shared/utils/logger.js';

export const getServerSetting = (req, res) => {
  try {
    // should only every be one row in the table, so default to id 1
    const id = req.params?.id ?? 1;
    const setting = db.prepare('SELECT * FROM server_settings WHERE id = ?').get(id);
    if (!setting) {
      return res.status(404).json({ error: 'Server setting not found' });
    }
    res.json(transformToApi(setting));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateServerSetting = (req, res) => {
  try {
    const { id } = req.params;
    const payload = transformToDb(req.body);
    const { day_begins_hr, init_day_status, curr_day, admin_passcode } = payload;
    const result = db.prepare(`
      UPDATE server_settings
      SET day_begins_hr = ?, init_day_status = ?, curr_day = ?, admin_passcode = ?
      WHERE id = ?
    `).run(day_begins_hr, init_day_status, curr_day, admin_passcode, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Server setting not found' });
    }
    res.json(transformToApi({ id, ...payload }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyPasscode = (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM server_settings').all().map(transformToApi)?.[0];
    const isMatch = settings && settings.adminPasscode === req.query.passcode;
    res.status(200).json({ isMatch });
  } catch (error) {
    logger.error('Error occurred while verifying passcode:', error);
    res.status(500).json({ error: error.message });
  }
};
