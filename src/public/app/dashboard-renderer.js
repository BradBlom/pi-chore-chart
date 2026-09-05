import { escapeHtml, getDisplayName, isChoreComplete } from './utils.js';

export function renderDashboard(container, members, teams, chores, { editMode = false } = {}) {
  if (!container) return;

  const choreListPath = editMode ? 'chore-list-edit' : 'chore-list';
  const heading = editMode ? '<h1>Edit Today\'s Chore List</h1>' : '';

  const memberSections = members.map((member) => {
    const memberChores = chores.filter((chore) => chore.fkMemberId === member.id || chore.fk_member_id === member.id);
    return `
      <a class="w3-card w3-margin-bottom w3-padding" href="/app/members/${member.id}/${choreListPath}" style="display:block; text-decoration:none; color:inherit;">
        <h3 class="w3-text-teal">${escapeHtml(getDisplayName(member))}</h3>
        ${renderProgressBar(memberChores)}
      </a>
    `;
  }).join('');

  const teamSections = teams.map((team) => {
    const teamChores = chores.filter((chore) => chore.fkTeamId === team.id || chore.fk_team_id === team.id);
    return `
      <a class="w3-card w3-margin-bottom w3-padding" href="/app/teams/${team.id}/${choreListPath}" style="display:block; text-decoration:none; color:inherit;">
        <h3 class="w3-text-teal">${escapeHtml(getDisplayName(team))}</h3>
        ${renderProgressBar(teamChores)}
      </a>
    `;
  }).join('');

  container.innerHTML = `
    ${heading}
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