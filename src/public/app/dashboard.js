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
      <a class="w3-card w3-margin-bottom w3-padding" href="/app/members/${member.id}/chore-list" style="display:block; text-decoration:none; color:inherit;">
        <h3 class="w3-text-teal">${escapeHtml(getDisplayName(member))}</h3>
        ${renderProgressBar(memberChores)}
      </a>
    `;
  }).join('');

  const teamSections = teams.map((team) => {
    const teamChores = chores.filter((chore) => chore.fkTeamId === team.id || chore.fk_team_id === team.id);
    return `
      <a class="w3-card w3-margin-bottom w3-padding" href="/app/teams/${team.id}/chore-list" style="display:block; text-decoration:none; color:inherit;">
        <h3 class="w3-text-teal">${escapeHtml(getDisplayName(team))}</h3>
        ${renderProgressBar(teamChores)}
      </a>
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

function renderProgressBar(chores) {
  const total = chores.length;
  if (total === 0) {
    return '<div class="w3-light-grey w3-round w3-margin-bottom"><div class="w3-container w3-round w3-grey" style="width:100%">No chores</div></div>';
  }

  const completed = chores.filter((chore) => isChoreComplete(chore)).length;
  const percent = Math.round((completed / total) * 100);
  const barColor = percent >= 100
    ? 'w3-green'
    : percent >= 66
      ? 'w3-blue'
      : percent >= 33
        ? 'w3-yellow'
        : 'w3-dark-grey';
  return `
    <div class="w3-light-grey w3-round w3-margin-bottom">
      <div class="w3-container w3-round ${barColor}" style="width:${percent}%">${percent}%</div>
    </div>
  `;
}

function isChoreComplete(chore) {
  return chore.status === 'c' || chore.status === 'complete' || chore.status === 'done';
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
