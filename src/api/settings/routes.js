import express from 'express';
import { getServerSetting, updateServerSetting, verifyPasscode } from './controller.js';

const router = express.Router();

router.get('/primary', getServerSetting); // shortcut
router.get('/:id', getServerSetting);
router.put('/:id', updateServerSetting);
router.post('/verify-passcode', verifyPasscode);

export default router;
