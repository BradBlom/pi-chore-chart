import { createChore, deleteChore, fetchChores, fetchEntity, renameChore } from './api.js';
import { escapeHtml, isAssignedToEntity } from './utils.js';
import { renderChoreListEdit } from './chore-list-renderer.js';

let currentRouteInfo = null;
let currentEntity = null;
let currentChores = [];

document.addEventListener('DOMContentLoaded', () => initializeChoreListEdit());

async function initializeChoreListEdit() {
  const container = document.getElementById('chore-list-edit-content');
  if (!container) return;

  const routeInfo = getRouteInfo(container);
  if (!routeInfo) {
    container.innerHTML = '<p class="w3-text-red">Invalid chore list route.</p>';
    return;
  }

  container.innerHTML = '<p>Loading chores...</p>';
  try {
    const [entity, chores] = await Promise.all([
      fetchEntity(routeInfo.type, routeInfo.id),
      fetchChores({ throwOnError: true })
    ]);
    currentRouteInfo = routeInfo;
    currentEntity = entity;
    currentChores = (Array.isArray(chores) ? chores : [])
      .filter((chore) => isAssignedToEntity(chore, routeInfo.type, routeInfo.id));
    renderCurrentChoreList(container);
  } catch (error) {
    console.error('Error loading editable chore list:', error);
    container.innerHTML = '<p class="w3-text-red">Unable to load chore list.</p>';
  }
}

function getRouteInfo(container) {
  const type = container?.getAttribute('data-entity-type');
  const id = Number(container?.getAttribute('data-entity-id'));
  const label = container?.getAttribute('data-entity-label');
  if (!type || !Number.isInteger(id) || !label) return null;
  return { type, id, label };
}

function renderCurrentChoreList(container) {
  renderChoreListEdit(container, currentEntity, currentChores, {
    onRename: openRenameModal,
    onDelete: handleDelete,
    onCreate: openCreateModal
  });
}

function openRenameModal(choreId) {
  const chore = currentChores.find((item) => item.id === choreId);
  if (!chore) return;

  const modal = createModal('Rename Chore', chore.name || '', 'Rename');
  modal.form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = modal.input.value.trim();
    if (!name) return;
    try {
      const updatedChore = await renameChore(choreId, name);
      currentChores = currentChores.map((item) => item.id === choreId ? updatedChore : item);
      modal.close();
      renderCurrentChoreList(document.getElementById('chore-list-edit-content'));
    } catch (error) {
      console.error('Error renaming chore:', error);
      modal.showError('Unable to rename chore.');
    }
  });
}

function openCreateModal() {
  const modal = createModal('Create Chore', '', 'Create');
  modal.form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = modal.input.value.trim();
    if (!name || !currentRouteInfo) return;

    const payload = { name };
    if (currentRouteInfo.type === 'members') {
      payload.fkMemberId = currentRouteInfo.id;
    } else {
      payload.fkTeamId = currentRouteInfo.id;
    }

    try {
      const newChore = await createChore(payload);
      currentChores = [...currentChores, newChore];
      modal.close();
      renderCurrentChoreList(document.getElementById('chore-list-edit-content'));
    } catch (error) {
      console.error('Error creating chore:', error);
      modal.showError('Unable to create chore.');
    }
  });
}

async function handleDelete(choreId) {
  const chore = currentChores.find((item) => item.id === choreId);
  if (!chore || !window.confirm(`Delete "${chore.name || 'this chore'}"?`)) return;

  try {
    await deleteChore(choreId);
    currentChores = currentChores.filter((item) => item.id !== choreId);
    renderCurrentChoreList(document.getElementById('chore-list-edit-content'));
  } catch (error) {
    console.error('Error deleting chore:', error);
  }
}

function createModal(title, initialName, submitLabel) {
  const modalElement = document.createElement('div');
  modalElement.className = 'w3-modal';
  modalElement.style.display = 'block';
  modalElement.innerHTML = `
    <div class="w3-modal-content w3-card-4 w3-animate-zoom" style="max-width:480px">
      <header class="w3-container w3-theme">
        <button type="button" class="w3-button w3-display-topright" data-modal-close aria-label="Close">&times;</button>
        <h2>${escapeHtml(title)}</h2>
      </header>
      <form class="w3-container w3-padding">
        <div class="w3-panel w3-pale-red w3-border" data-modal-error style="display:none"></div>
        <label class="w3-text-dark-grey" for="chore-name-input">Name</label>
        <input id="chore-name-input" class="w3-input w3-border w3-margin-bottom" value="${escapeHtml(initialName)}" required autofocus />
        <div class="w3-right w3-margin-bottom">
          <button type="button" class="w3-button w3-white w3-border" data-modal-cancel>Cancel</button>
          <button type="submit" class="w3-button w3-black">${escapeHtml(submitLabel)}</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modalElement);
  const form = modalElement.querySelector('form');
  const input = modalElement.querySelector('input');
  const close = () => modalElement.remove();
  modalElement.querySelector('[data-modal-close]').addEventListener('click', close);
  modalElement.querySelector('[data-modal-cancel]').addEventListener('click', close);
  input.focus();

  return {
    form,
    input,
    close,
    showError(message) {
      const error = modalElement.querySelector('[data-modal-error]');
      error.textContent = message;
      error.style.display = 'block';
    }
  };
}