import express from 'express';
import { getAllTeams, getTeam, createTeam, updateTeam, deleteTeam } from './controller.js';

const router = express.Router();

router.get('/', getAllTeams);
router.get('/:id', getTeam);
router.post('/', createTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);

export default router;
