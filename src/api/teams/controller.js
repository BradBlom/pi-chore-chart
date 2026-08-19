import db from '../../shared/db.js';
import { transformToApi, transformToDb } from '../transform.js';

export const getAllTeams = (req, res) => {
  try {
    const teams = db.prepare('SELECT * FROM team WHERE is_active = 1').all().map(transformToApi);
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTeam = (req, res) => {
  try {
    const { id } = req.params;
    const team = db.prepare('SELECT * FROM team WHERE id = ? AND is_active = 1').get(id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(transformToApi(team));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTeam = (req, res) => {
  try {
    const payload = transformToDb(req.body);
    const { long_name, short_name, is_active } = payload;
    const result = db.prepare('INSERT INTO team (long_name, short_name, is_active) VALUES (?, ?, ?)').run(
      long_name,
      short_name,
      is_active === undefined ? 1 : is_active
    );
    res.status(201).json(transformToApi({ id: result.lastInsertRowid, ...payload }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTeam = (req, res) => {
  try {
    const { id } = req.params;
    const payload = transformToDb(req.body);
    const { long_name, short_name, is_active } = payload;
    const result = db.prepare('UPDATE team SET long_name = ?, short_name = ?, is_active = ? WHERE id = ?').run(
      long_name,
      short_name,
      is_active,
      id
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(transformToApi({ id, ...payload }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTeam = (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('UPDATE team SET is_active = 0 WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json({ message: 'Team deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
