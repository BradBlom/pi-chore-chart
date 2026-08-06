import db from '../../shared/db.js';
import { transformToApi, transformToDb } from '../transform.js';

export const getAllChoreAssignments = (req, res) => {
  try {
    const inpChoreTemplateId = req.query['fkChoreTemplateId'];
    let query = 'SELECT * FROM chore_template_assignment';
    const params = [];

    if (inpChoreTemplateId !== undefined) {
      query += ' WHERE fk_chore_template_id = ?';
      params.push(inpChoreTemplateId);
    }

    const choreAssignments = db.prepare(query).all(...params).map(transformToApi);
    res.json(choreAssignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getChoreAssignment = (req, res) => {
  try {
    const { id } = req.params;
    const choreAssignment = db.prepare('SELECT * FROM chore_template_assignment WHERE id = ?').get(id);
    if (!choreAssignment) {
      return res.status(404).json({ error: 'Chore assignment not found' });
    }
    res.json(transformToApi(choreAssignment));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createChoreAssignment = (req, res) => {
  try {
    const payload = transformToDb(req.body);
    const { fk_chore_template_id, fk_member_id, fk_team_id } = payload;
    const result = db.prepare('INSERT INTO chore_template_assignment (fk_chore_template_id, fk_member_id, fk_team_id) VALUES (?, ?, ?)').run(
      fk_chore_template_id,
      fk_member_id === undefined ? null : fk_member_id,
      fk_team_id === undefined ? null : fk_team_id
    );
    res.status(201).json(transformToApi({ id: result.lastInsertRowid, ...payload }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateChoreAssignment = (req, res) => {
  try {
    const { id } = req.params;
    const payload = transformToDb(req.body);
    const { fk_chore_template_id, fk_member_id, fk_team_id } = payload;
    const result = db.prepare('UPDATE chore_template_assignment SET fk_chore_template_id = ?, fk_member_id = ?, fk_team_id = ? WHERE id = ?').run(
      fk_chore_template_id,
      fk_member_id,
      fk_team_id,
      id
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Chore assignment not found' });
    }
    res.json(transformToApi({ id, ...payload }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteChoreAssignment = (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM chore_template_assignment WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Chore assignment not found' });
    }
    res.json({ message: 'Chore assignment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
