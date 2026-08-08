import express from 'express';
import { readFileSync } from 'fs';
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

router.get('/:type/:id/chore-list', (req, res) => {
  const entityType = req.params.type === 'member' || req.params.type === 'members' ? 'members' : 'teams';
  const entityLabel = entityType === 'members' ? 'member' : 'team';
  const entityId = req.params.id;

  let html = readFileSync(join(__dirname, '../views/chore-list.html'), 'utf8');
  html = html.replace('{{entityType}}', entityType);
  html = html.replace('{{entityId}}', entityId);
  html = html.replace('{{entityLabel}}', entityLabel);

  res.send(html);
});

export default router;
