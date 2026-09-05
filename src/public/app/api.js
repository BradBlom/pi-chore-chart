export async function fetchMembers() {
  try {
    const response = await fetch('/api/members');
    if (!response.ok) throw new Error('Failed to fetch members');
    return await response.json();
  } catch (error) {
    console.error('Error fetching members:', error);
    return [];
  }
}

export async function fetchTeams() {
  try {
    const response = await fetch('/api/teams');
    if (!response.ok) throw new Error('Failed to fetch teams');
    return await response.json();
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
}

export async function fetchChores({ throwOnError = false } = {}) {
  try {
    const response = await fetch('/api/chores');
    if (!response.ok) {
      throw new Error('Unable to load chores');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching chores:', error);
    if (throwOnError) {
      throw error;
    }
    return [];
  }
}

export async function fetchEntity(type, id) {
  const endpoint = type === 'members'
    ? `/api/members/${encodeURIComponent(id)}`
    : `/api/teams/${encodeURIComponent(id)}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Unable to load ${type === 'members' ? 'member' : 'team'}`);
  }

  return response.json();
}

export async function updateChore(choreId, payload) {
  const response = await fetch(`/api/chores/${encodeURIComponent(choreId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Unable to update chore');
  }

  return response.json();
}

export async function createChore(payload) {
  const response = await fetch('/api/chores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Unable to create chore');
  }

  return response.json();
}

export async function renameChore(choreId, name) {
  const response = await fetch(`/api/chores/${encodeURIComponent(choreId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });

  if (!response.ok) {
    throw new Error('Unable to rename chore');
  }

  return response.json();
}

export async function deleteChore(choreId) {
  const response = await fetch(`/api/chores/${encodeURIComponent(choreId)}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    throw new Error('Unable to delete chore');
  }
}