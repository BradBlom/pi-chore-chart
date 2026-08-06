import db from '../../shared/db.js';
import { transformToApi, transformToDb } from '../transform.js';

export const getAllChoreTemplates = (req, res) => {
  try {
    const choreTemplates = db.prepare('SELECT * FROM chore_template').all().map(transformToApi);
    res.json(choreTemplates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getChoreTemplate = (req, res) => {
  try {
    const { id } = req.params;
    const choreTemplate = db.prepare('SELECT * FROM chore_template WHERE id = ?').get(id);
    if (!choreTemplate) {
      return res.status(404).json({ error: 'Chore template not found' });
    }
    res.json(transformToApi(choreTemplate));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createChoreTemplate = (req, res) => {
  try {
    const payload = transformToDb(req.body);
    const { name, restarts_on } = payload;
    const result = db.prepare('INSERT INTO chore_template (name, restarts_on) VALUES (?, ?)').run(
      name,
      restarts_on
    );
    res.status(201).json(transformToApi({ id: result.lastInsertRowid, ...payload }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateChoreTemplate = (req, res) => {
  try {
    const { id } = req.params;
    const payload = transformToDb(req.body);
    const { name, restarts_on } = payload;
    const result = db.prepare('UPDATE chore_template SET name = ?, restarts_on = ? WHERE id = ?').run(
      name,
      restarts_on,
      id
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Chore template not found' });
    }
    res.json(transformToApi({ id, ...payload }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteChoreTemplate = (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM chore_template WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Chore template not found' });
    }
    res.json({ message: 'Chore template deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
