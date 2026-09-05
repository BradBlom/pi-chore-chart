import { fetchChores, fetchEntity, updateChore } from './api.js';
import { isAssignedToEntity } from './utils.js';
import { renderChoreList } from './chore-list-renderer.js';

let currentRouteInfo = null;
let currentEntity = null;
let currentChores = [];

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
      fetchChores({ throwOnError: true })
    ]);

    currentRouteInfo = routeInfo;
    currentEntity = entity;
    currentChores = (Array.isArray(chores) ? chores : [])
      .filter((chore) => isAssignedToEntity(chore, routeInfo.type, routeInfo.id));
    renderCurrentChoreList(container);
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

function renderCurrentChoreList(container) {
  renderChoreList(container, currentEntity, currentChores, updateChoreStatus);
}

async function updateChoreStatus(choreId, status) {
  if (!currentRouteInfo || !currentChores.some((chore) => chore.id === choreId)) {
    return;
  }

  try {
    const updatedChore = await updateChore(choreId, { status });
    currentChores = currentChores.map((chore) => chore.id === choreId ? updatedChore : chore);

    const container = document.getElementById('chore-list-content');
    if (container) {
      renderCurrentChoreList(container);
    }
  } catch (error) {
    console.error('Error updating chore status:', error);
  }
}
