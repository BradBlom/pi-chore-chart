import { escapeHtml, getChoreName, getDisplayName, normalizeStatus } from './utils.js';

const statusOptions = [
  { label: 'Complete', value: 'c', iconClass: 'fa-check-circle', iconColor: 'w3-text-green' },
  { label: 'Incomplete', value: 'i', iconClass: 'fa-minus-circle', iconColor: 'w3-text-red' },
  { label: 'Unsure', value: 'u', iconClass: 'fa-question-circle', iconColor: 'w3-text-blue' },
  { label: 'Parent check', value: 'r', iconClass: 'fa-vcard', iconColor: 'w3-text-blue' }
];

export function renderChoreList(container, entity, chores, onStatusChange) {
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
      if (!choreId || !status) return;
      await onStatusChange(choreId, status);
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
          <button type="button" class="w3-button w3-small ${isSelected ? 'w3-black' : 'w3-white w3-border'}" data-status-action="true" data-chore-id="${chore.id}" data-status-value="${option.value}">
            <i class="fa ${option.iconClass} w3-margin-right ${option.iconColor}" aria-hidden="true"></i>
            <span class="w3-hide-medium w3-hide-small">${escapeHtml(option.label)}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

export function renderChoreListEdit(container, entity, chores, { onRename, onDelete, onCreate }) {
  const entityName = getDisplayName(entity);
  const rows = chores.length
    ? chores.map((chore) => `
        <tr>
          <td>${escapeHtml(getChoreName(chore))}</td>
          <td>
            <button type="button" class="w3-button w3-small w3-black" data-edit-action="rename" data-chore-id="${chore.id}">
              <i class="fa fa-edit w3-margin-right w3-text-blue" aria-hidden="true"></i>
              <span>Rename</span>
            </button>
            <button type="button" class="w3-button w3-small w3-black" data-edit-action="delete" data-chore-id="${chore.id}">
              <i class="fa fa-close w3-margin-right w3-text-red" aria-hidden="true"></i>
              <span>Delete</span>
            </button>
          </td>
        </tr>
      `).join('')
    : '<tr><td colspan="2">No chores found for this item.</td></tr>';

  container.innerHTML = `
    <div class="w3-row-padding">
      <div class="w3-col s12">
        <div class="w3-card w3-padding">
          <h2 style="margin-top:0">Edit Chore List</h2>
          <h3 class="w3-text-teal" style="margin-top:0; margin-bottom:0.5rem;">${escapeHtml(entityName)}</h3>
          <table class="w3-table w3-striped w3-bordered w3-white">
            <thead><tr><th>Name</th><th>Actions</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <button type="button" class="w3-button w3-black w3-margin-top" data-edit-action="create">
            <i class="fa fa-plus w3-margin-right w3-text-green" aria-hidden="true"></i>
            <span>Create</span>
          </button>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-edit-action="rename"]').forEach((button) => {
    button.addEventListener('click', () => onRename(Number(button.dataset.choreId)));
  });
  container.querySelectorAll('[data-edit-action="delete"]').forEach((button) => {
    button.addEventListener('click', () => onDelete(Number(button.dataset.choreId)));
  });
  container.querySelector('[data-edit-action="create"]')?.addEventListener('click', onCreate);
}