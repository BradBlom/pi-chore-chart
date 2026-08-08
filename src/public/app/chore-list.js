let currentRouteInfo = null;
let currentEntity = null;
let currentChores = [];

const statusOptions = [
  { label: 'Complete', value: 'c', iconClass: 'fa-check-circle', iconColor: 'w3-text-green' },
  { label: 'Incomplete', value: 'i', iconClass: 'fa-minus-circle', iconColor: 'w3-text-red' },
  { label: 'Unsure', value: 'u', iconClass: 'fa-question-circle', iconColor: 'w3-text-blue' },
  { label: 'Parent check', value: 'r', iconClass: 'fa-vcard', iconColor: 'w3-text-blue' }
];

document.addEventListener('DOMContentLoaded', () => {
  initializeChoreList();
});

async function initializeChoreList() {
  const container = document.getElementById('chore-list-content');
  if (!container) {
    return;
  }

  const routeInfo = getRouteInfo(container);
  if (!routeInfo) {
    container.innerHTML = '<p class="w3-text-red">Invalid chore list route.</p>';
    return;
  }

  container.innerHTML = '<p>Loading chores...</p>';

  try {
    const [entity, chores] = await Promise.all([
      fetchEntity(routeInfo.type, routeInfo.id),
      fetchChores()
    ]);

    currentRouteInfo = routeInfo;
    currentEntity = entity;
    currentChores = Array.isArray(chores) ? chores : [];

    const filteredChores = currentChores.filter((chore) => isAssignedToEntity(chore, routeInfo.type, routeInfo.id));
    currentChores = filteredChores;
    renderChoreList(container, routeInfo, entity, filteredChores);
  } catch (error) {
    console.error('Error loading chore list:', error);
    container.innerHTML = '<p class="w3-text-red">Unable to load chore list.</p>';
  }
}

function getRouteInfo(container) {
  const type = container?.getAttribute('data-entity-type');
  const id = container?.getAttribute('data-entity-id');
  const label = container?.getAttribute('data-entity-label');

  if (!type || !id || !label) {
    return null;
  }

  return {
    type,
    id: Number(id),
    label
  };
}

async function fetchEntity(type, id) {
  const endpoint = type === 'members' ? `/api/members/${encodeURIComponent(id)}` : `/api/teams/${encodeURIComponent(id)}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Unable to load ${type === 'members' ? 'member' : 'team'}`);
  }

  return response.json();
}

async function fetchChores() {
  const response = await fetch('/api/chores');
  if (!response.ok) {
    throw new Error('Unable to load chores');
  }

  return response.json();
}

function isAssignedToEntity(chore, type, id) {
  if (type === 'members') {
    return chore.fkMemberId === id || chore.fk_member_id === id;
  }

  return chore.fkTeamId === id || chore.fk_team_id === id;
}

function renderChoreList(container, routeInfo, entity, chores) {
  const entityName = getDisplayName(entity);
  const rows = chores.length
    ? chores.map((chore) => `
        <tr>
          <td>${escapeHtml(getChoreName(chore))}</td>
          <td>${renderStatusCell(chore)}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="2">No chores found for this item.</td></tr>';

  container.innerHTML = `
    <div class="w3-row-padding">
      <div class="w3-col s12">
        <div class="w3-card w3-padding">
          <h2 style="margin-top:0">Chore List</h2>
          <h3 class="w3-text-teal" style="margin-top:0; margin-bottom:0.5rem;">${escapeHtml(entityName)}</h3>
          <table class="w3-table w3-striped w3-bordered w3-white">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-status-action]').forEach((button) => {
    button.addEventListener('click', async () => {
      const choreId = Number(button.getAttribute('data-chore-id'));
      const status = button.getAttribute('data-status-value');
      if (!choreId || !status) {
        return;
      }

      await updateChoreStatus(choreId, status);
    });
  });
}

function renderStatusCell(chore) {
  const selectedStatus = normalizeStatus(chore?.status);

  return `
    <div class="w3-bar" style="gap:4px; flex-wrap:wrap;">
      ${statusOptions.map((option) => {
        const isSelected = selectedStatus === option.value;
        return `
          <button
            type="button"
            class="w3-button w3-small ${isSelected ? 'w3-black' : 'w3-white w3-border'}"
            data-status-action="true"
            data-chore-id="${chore.id}"
            data-status-value="${option.value}"
          >
            <i class="fa ${option.iconClass} w3-margin-right ${option.iconColor}" aria-hidden="true"></i>
            <span class="w3-hide-medium w3-hide-small">${escapeHtml(option.label)}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

async function updateChoreStatus(choreId, status) {
  if (!currentRouteInfo) {
    return;
  }

  const existingChore = currentChores.find((chore) => chore.id === choreId);
  if (!existingChore) {
    return;
  }

  const payload = {
    ...existingChore,
    status
  };

  try {
    const response = await fetch(`/api/chores/${encodeURIComponent(choreId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Unable to update chore');
    }

    const updatedChore = await response.json();
    currentChores = currentChores.map((chore) => (chore.id === choreId ? updatedChore : chore));

    const container = document.getElementById('chore-list-content');
    if (!container) {
      return;
    }

    const filteredChores = currentChores.filter((chore) => isAssignedToEntity(chore, currentRouteInfo.type, currentRouteInfo.id));
    renderChoreList(container, currentRouteInfo, currentEntity, filteredChores);
  } catch (error) {
    console.error('Error updating chore status:', error);
  }
}

function normalizeStatus(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'c' || normalized === 'complete' || normalized === 'done') {
    return 'c';
  }
  if (normalized === 'i' || normalized === 'incomplete' || normalized === 'in progress' || normalized === 'active') {
    return 'i';
  }
  if (normalized === 'u' || normalized === 'unsure') {
    return 'u';
  }
  if (normalized === 'r' || normalized === 'ready') {
    return 'r';
  }
  return '';
}

function getDisplayName(item) {
  return item?.longName || item?.long_name || item?.name || 'Unnamed';
}

function getChoreName(chore) {
  return chore?.name || 'Untitled chore';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
