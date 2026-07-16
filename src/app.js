import express from 'express';
import appRoutes from './app/routes.js';
import membersRoutes from './api/members/routes.js';
import teamsRoutes from './api/teams/routes.js';
import choresRoutes from './api/chores/routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// App routes (HTML pages)
app.use('/app', appRoutes);

// API routes
app.use('/api/members', membersRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/chores', choresRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
