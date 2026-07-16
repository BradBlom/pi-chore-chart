import db from '../../shared/db.js';

export const getAllChores = (req, res) => {
  try {
    const chores = db.prepare('SELECT * FROM chore').all();
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
    res.json(chore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createChore = (req, res) => {
  try {
    const { name, fk_member_id, fk_team_id, status, begins_on, ends_on } = req.body;
    const result = db.prepare('INSERT INTO chore (name, fk_member_id, fk_team_id, status, begins_on, ends_on) VALUES (?, ?, ?, ?, ?, ?)').run(
      name,
      fk_member_id || null,
      fk_team_id || null,
      status || 'i',
      begins_on,
      ends_on || null
    );
    res.status(201).json({ id: result.lastInsertRowid, name, fk_member_id, fk_team_id, status, begins_on, ends_on });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateChore = (req, res) => {
  try {
    const { id } = req.params;
    const { name, fk_member_id, fk_team_id, status, begins_on, ends_on } = req.body;
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
    res.json({ id, name, fk_member_id, fk_team_id, status, begins_on, ends_on });
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
