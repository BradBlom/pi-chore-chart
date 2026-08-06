import db from '../../shared/db.js';
import { transformToApi, transformToDb } from '../transform.js';

export const getAllMembers = (req, res) => {
  try {
    const members = db.prepare('SELECT * FROM member').all().map(transformToApi);
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
    res.json(transformToApi(member));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createMember = (req, res) => {
  try {
    const payload = transformToDb(req.body);
    const { long_name, short_name, is_active, is_admin } = payload;
    const result = db.prepare('INSERT INTO member (long_name, short_name, is_active, is_admin) VALUES (?, ?, ?, ?)').run(
      long_name,
      short_name,
      is_active === undefined ? 1 : is_active,
      is_admin === undefined ? 0 : is_admin
    );
    res.status(201).json(transformToApi({ id: result.lastInsertRowid, ...payload }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMember = (req, res) => {
  try {
    const { id } = req.params;
    const payload = transformToDb(req.body);
    const { long_name, short_name, is_active, is_admin } = payload;
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
    res.json(transformToApi({ id, ...payload }));
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
