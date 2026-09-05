import db from '../../shared/db.js';
import { transformToApi, transformToDb } from '../transform.js';

// note that getAllChores gets only the active chores (today's chores) because the chore table is designed to store only the chores for the current day. The previous day's chores are closed out and marked as inactive during the day initialization process, so they are not included in the active list.
export const getAllChores = (req, res) => {
  try {
    const chores = db.prepare('SELECT * FROM chore WHERE is_active = 1').all().map(transformToApi);
    res.json(chores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getChore = (req, res) => {
  try {
    const { id } = req.params;
    const chore = db.prepare('SELECT * FROM chore WHERE id = ?').get(id);
    if (!chore) {
      return res.status(404).json({ error: 'Chore not found' });
    }
    res.json(transformToApi(chore));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createChore = (req, res) => {
  try {
    const payload = transformToDb(req.body);
    const { name, fk_member_id, fk_team_id, status, curr_day } = payload;
    const result = db.prepare('INSERT INTO chore (name, fk_member_id, fk_team_id, status, curr_day) VALUES (?, ?, ?, ?, ?)').run(
      name,
      fk_member_id === undefined ? null : fk_member_id,
      fk_team_id === undefined ? null : fk_team_id,
      status === undefined ? 'i' : status,
      curr_day === undefined ? null : curr_day
    );
    res.status(201).json(transformToApi({ id: result.lastInsertRowid, ...payload }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateChore = (req, res) => {
  try {
    const { id } = req.params;
    const payload = transformToDb(req.body);
    const { name, fk_member_id, fk_team_id, status, curr_day } = payload;
    const result = db.prepare('UPDATE chore SET name = ?, fk_member_id = ?, fk_team_id = ?, status = ?, curr_day = ? WHERE id = ?').run(
      name,
      fk_member_id,
      fk_team_id,
      status,
      curr_day,
      id
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Chore not found' });
    }
    res.json(transformToApi({ id, ...payload }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const patchChore = (req, res) => {
  try {
    const { id } = req.params;
    const payload = transformToDb(req.body);
    const supportedFields = ['status', 'name'];
    const payloadFields = payload && typeof payload === 'object' ? Object.keys(payload) : [];
    const updateFields = supportedFields.filter((field) => Object.prototype.hasOwnProperty.call(payload || {}, field));

    if (!updateFields.length || payloadFields.some((field) => !supportedFields.includes(field))) {
      return res.status(400).json({ error: 'The status and/or name field must be provided' });
    }

    const values = updateFields.map((field) => field === 'name' ? String(payload[field]).trim() : payload[field]);
    if (Object.prototype.hasOwnProperty.call(payload, 'name') && !values[updateFields.indexOf('name')]) {
      return res.status(400).json({ error: 'The name cannot be empty' });
    }

    const assignments = updateFields.map((field) => `${field} = ?`).join(', ');
    const result = db.prepare(`UPDATE chore SET ${assignments} WHERE id = ?`).run(...values, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Chore not found' });
    }

    const updatedChore = db.prepare('SELECT * FROM chore WHERE id = ?').get(id);
    res.json(transformToApi(updatedChore));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteChore = (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM chore WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Chore not found' });
    }
    res.json({ message: 'Chore deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
