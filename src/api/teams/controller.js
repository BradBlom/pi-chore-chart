import db from '../../shared/db.js';

export const getAllTeams = (req, res) => {
  try {
    const teams = db.prepare('SELECT * FROM team').all();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTeam = (req, res) => {
  try {
    const { id } = req.params;
    const team = db.prepare('SELECT * FROM team WHERE id = ?').get(id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTeam = (req, res) => {
  try {
    const { long_name, short_name, is_active } = req.body;
    const result = db.prepare('INSERT INTO team (long_name, short_name, is_active) VALUES (?, ?, ?)').run(
      long_name,
      short_name,
      is_active || 1
    );
    res.status(201).json({ id: result.lastInsertRowid, long_name, short_name, is_active });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTeam = (req, res) => {
  try {
    const { id } = req.params;
    const { long_name, short_name, is_active } = req.body;
    const result = db.prepare('UPDATE team SET long_name = ?, short_name = ?, is_active = ? WHERE id = ?').run(
      long_name,
      short_name,
      is_active,
      id
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json({ id, long_name, short_name, is_active });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTeam = (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM team WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json({ message: 'Team deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
