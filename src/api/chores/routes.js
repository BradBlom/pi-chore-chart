import express from 'express';
import { getAllChores, getChore, createChore, updateChore, deleteChore } from './controller.js';

const router = express.Router();

router.get('/', getAllChores);
router.get('/:id', getChore);
router.post('/', createChore);
router.put('/:id', updateChore);
router.delete('/:id', deleteChore);

export default router;
