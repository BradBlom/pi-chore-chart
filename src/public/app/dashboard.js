import { fetchChores, fetchMembers, fetchTeams } from './api.js';
import { renderDashboard } from './dashboard-renderer.js';

document.addEventListener('DOMContentLoaded', () => {
  initializeDashboard();
});

async function initializeDashboard() {
  const container = document.getElementById('dashboard-content');

  if (container) {
    container.innerHTML = '<p>Loading...</p>';
  }

  try {
    const [members, teams, chores] = await Promise.all([
      fetchMembers(),
      fetchTeams(),
      fetchChores()
    ]);

    renderDashboard(container, members, teams, chores);
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    if (container) {
      container.innerHTML = '<p>Unable to load dashboard data.</p>';
    }
  }
}
