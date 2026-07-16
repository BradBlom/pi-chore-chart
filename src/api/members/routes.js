import express from 'express';
import { getAllMembers, getMember, createMember, updateMember, deleteMember } from './controller.js';

const router = express.Router();

router.get('/', getAllMembers);
router.get('/:id', getMember);
router.post('/', createMember);
router.put('/:id', updateMember);
router.delete('/:id', deleteMember);

export default router;
