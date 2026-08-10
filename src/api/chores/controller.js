import db from '../../shared/db.js';
import { transformToApi, transformToDb } from '../transform.js';

export const getAllChores = (req, res) => {
  try {
    const chores = db.prepare('SELECT * FROM chore').all().map(transformToApi);
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

export const patchChoreStatus = (req, res) => {
  try {
    const { id } = req.params;
    const payload = transformToDb(req.body);

    if (!payload || typeof payload !== 'object' || !Object.prototype.hasOwnProperty.call(payload, 'status') || Object.keys(payload).length !== 1) {
      return res.status(400).json({ error: 'Only the status field can be updated' });
    }

    const { status } = payload;
    const result = db.prepare('UPDATE chore SET status = ? WHERE id = ?').run(status, id);
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
