import db from '../../shared/db.js';

export const getAllMembers = (req, res) => {
  try {
    const members = db.prepare('SELECT * FROM member').all();
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMember = (req, res) => {
  try {
    const { id } = req.params;
    const member = db.prepare('SELECT * FROM member WHERE id = ?').get(id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createMember = (req, res) => {
  try {
    const { long_name, short_name, is_active, is_admin } = req.body;
    const result = db.prepare('INSERT INTO member (long_name, short_name, is_active, is_admin) VALUES (?, ?, ?, ?)').run(
      long_name,
      short_name,
      is_active || 1,
      is_admin || 0
    );
    res.status(201).json({ id: result.lastInsertRowid, long_name, short_name, is_active, is_admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMember = (req, res) => {
  try {
    const { id } = req.params;
    const { long_name, short_name, is_active, is_admin } = req.body;
    const result = db.prepare('UPDATE member SET long_name = ?, short_name = ?, is_active = ?, is_admin = ? WHERE id = ?').run(
      long_name,
      short_name,
      is_active,
      is_admin,
      id
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ id, long_name, short_name, is_active, is_admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteMember = (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM member WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ message: 'Member deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
