// Dashboard JavaScript
// Main client-side logic for the dashboard

document.addEventListener('DOMContentLoaded', () => {
  initializeDashboard();
});

/**
 * Initialize the dashboard
 */
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

function renderDashboard(container, members, teams, chores) {
  if (!container) {
    return;
  }

  const memberSections = members.map((member) => {
    const memberChores = chores.filter((chore) => chore.fkMemberId === member.id || chore.fk_member_id === member.id);
    return `
      <div class="w3-card w3-margin-bottom w3-padding">
        <h3 class="w3-text-teal">${escapeHtml(getDisplayName(member))}</h3>
        <p><strong>Short name:</strong> ${escapeHtml(getShortName(member))}</p>
        <h4>Chores</h4>
        ${memberChores.length > 0 ? `<ul>${memberChores.map((chore) => `<li>${escapeHtml(getChoreName(chore))}</li>`).join('')}</ul>` : '<p>No chores assigned.</p>'}
      </div>
    `;
  }).join('');

  const teamSections = teams.map((team) => {
    const teamChores = chores.filter((chore) => chore.fkTeamId === team.id || chore.fk_team_id === team.id);
    return `
      <div class="w3-card w3-margin-bottom w3-padding">
        <h3 class="w3-text-teal">${escapeHtml(getDisplayName(team))}</h3>
        <p><strong>Short name:</strong> ${escapeHtml(getShortName(team))}</p>
        <h4>Chores</h4>
        ${teamChores.length > 0 ? `<ul>${teamChores.map((chore) => `<li>${escapeHtml(getChoreName(chore))}</li>`).join('')}</ul>` : '<p>No chores assigned.</p>'}
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="w3-row-padding">
      <div class="w3-half w3-container">
        <h2>Members</h2>
        ${memberSections || '<p>No members found.</p>'}
      </div>
      <div class="w3-half w3-container">
        <h2>Teams</h2>
        ${teamSections || '<p>No teams found.</p>'}
      </div>
    </div>
  `;
}

function getDisplayName(item) {
  return item.longName || item.long_name || item.name || 'Unnamed';
}

function getShortName(item) {
  return item.shortName || item.short_name || '—';
}

function getChoreName(chore) {
  return chore.name || 'Untitled chore';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
