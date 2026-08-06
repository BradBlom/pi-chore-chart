import express from 'express';
import appRoutes from './app/routes.js';
import apiRoutes from './api/routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('src/public'));

// App routes (HTML pages)
app.use('/app', appRoutes);

// API routes
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
