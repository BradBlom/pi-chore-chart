import { fetchChores, fetchMembers, fetchTeams } from './api.js';
import { renderDashboard } from './dashboard-renderer.js';

document.addEventListener('DOMContentLoaded', () => {
  initializeToday();
});

async function initializeToday() {
  const container = document.getElementById('today-content');
  if (!container) {
    return;
  }

  container.innerHTML = '<p>Loading...</p>';

  try {
    const [members, teams, chores] = await Promise.all([
      fetchMembers(),
      fetchTeams(),
      fetchChores()
    ]);

    renderDashboard(container, members, teams, chores, { editMode: true });
  } catch (error) {
    console.error('Error initializing today page:', error);
    container.innerHTML = '<p>Unable to load today\'s chores.</p>';
  }
}