export function isAssignedToEntity(chore, type, id) {
  if (type === 'members') {
    return chore.fkMemberId === id || chore.fk_member_id === id;
  }

  return chore.fkTeamId === id || chore.fk_team_id === id;
}

export function isChoreComplete(chore) {
  return chore.status === 'c' || chore.status === 'complete' || chore.status === 'done';
}

export function normalizeStatus(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'c' || normalized === 'complete' || normalized === 'done') return 'c';
  if (normalized === 'i' || normalized === 'incomplete' || normalized === 'in progress' || normalized === 'active') return 'i';
  if (normalized === 'u' || normalized === 'unsure') return 'u';
  if (normalized === 'r' || normalized === 'ready') return 'r';
  return '';
}

export function getDisplayName(item) {
  return item?.shortName || item?.short_name || item?.name || 'Unnamed';
}

export function getChoreName(chore) {
  return chore?.name || 'Untitled chore';
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}