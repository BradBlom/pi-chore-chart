import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

router.get('/', (req, res) => {
  res.redirect('/app/dashboard');
});

router.get('/dashboard', (req, res) => {
  res.sendFile(join(__dirname, '../views/dashboard.html'));
});

router.get('/settings', (req, res) => {
  res.sendFile(join(__dirname, '../views/settings.html'));
});

export default router;
