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
    const { name, fk_member_id, fk_team_id, status, begins_on, ends_on } = payload;
    const result = db.prepare('INSERT INTO chore (name, fk_member_id, fk_team_id, status, begins_on, ends_on) VALUES (?, ?, ?, ?, ?, ?)').run(
      name,
      fk_member_id === undefined ? null : fk_member_id,
      fk_team_id === undefined ? null : fk_team_id,
      status === undefined ? 'i' : status,
      begins_on,
      ends_on === undefined ? null : ends_on
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
    const { name, fk_member_id, fk_team_id, status, begins_on, ends_on } = payload;
    const result = db.prepare('UPDATE chore SET name = ?, fk_member_id = ?, fk_team_id = ?, status = ?, begins_on = ?, ends_on = ? WHERE id = ?').run(
      name,
      fk_member_id,
      fk_team_id,
      status,
      begins_on,
      ends_on,
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
