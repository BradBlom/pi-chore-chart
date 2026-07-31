// Dashboard JavaScript
// Main client-side logic for the dashboard

document.addEventListener('DOMContentLoaded', () => {
  console.log('Dashboard loaded');
  initializeDashboard();
});

/**
 * Initialize the dashboard
 */
async function initializeDashboard() {
  try {
    // Fetch and display members
    const members = await fetchMembers();
    console.log('Members:', members);

    // Fetch and display teams
    const teams = await fetchTeams();
    console.log('Teams:', teams);

    // Fetch and display chores
    const chores = await fetchChores();
    console.log('Chores:', chores);
  } catch (error) {
    console.error('Error initializing dashboard:', error);
  }
}

/**
 * Fetch all members from the API
 */
async function fetchMembers() {
  try {
    const response = await fetch('/api/members');
    if (!response.ok) throw new Error('Failed to fetch members');
    return await response.json();
  } catch (error) {
    console.error('Error fetching members:', error);
    return [];
  }
}

/**
 * Fetch all teams from the API
 */
async function fetchTeams() {
  try {
    const response = await fetch('/api/teams');
    if (!response.ok) throw new Error('Failed to fetch teams');
    return await response.json();
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
}

/**
 * Fetch all chores from the API
 */
async function fetchChores() {
  try {
    const response = await fetch('/api/chores');
    if (!response.ok) throw new Error('Failed to fetch chores');
    return await response.json();
  } catch (error) {
    console.error('Error fetching chores:', error);
    return [];
  }
}
