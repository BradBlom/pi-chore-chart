import express from 'express';
import { getAllChoreAssignments, getChoreAssignment, createChoreAssignment, updateChoreAssignment, deleteChoreAssignment } from './controller.js';

const router = express.Router();

router.get('/', getAllChoreAssignments);
router.get('/:id', getChoreAssignment);
router.post('/', createChoreAssignment);
router.put('/:id', updateChoreAssignment);
router.delete('/:id', deleteChoreAssignment);

export default router;
