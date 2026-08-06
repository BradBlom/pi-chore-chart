import express from 'express';
import { getAllChoreTemplates, getChoreTemplate, createChoreTemplate, updateChoreTemplate, deleteChoreTemplate } from './controller.js';

const router = express.Router();

router.get('/', getAllChoreTemplates);
router.get('/:id', getChoreTemplate);
router.post('/', createChoreTemplate);
router.put('/:id', updateChoreTemplate);
router.delete('/:id', deleteChoreTemplate);

export default router;
