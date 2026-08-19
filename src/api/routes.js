import express from 'express';
import membersRoutes from './members/routes.js';
import teamsRoutes from './teams/routes.js';
import choresRoutes from './chores/routes.js';
import choreTemplatesRoutes from './chore-templates/routes.js';
import choreAssignmentsRoutes from './chore-assignments/routes.js';
import settingsRoutes from './settings/routes.js';
import { useHttpLogger } from '../shared/utils/logger.js';

const router = express.Router();
useHttpLogger(router);

router.use('/members', membersRoutes);
router.use('/teams', teamsRoutes);
router.use('/chores', choresRoutes);
router.use('/chore-templates', choreTemplatesRoutes);
router.use('/chore-assignments', choreAssignmentsRoutes);
router.use('/settings', settingsRoutes);

export default router;
