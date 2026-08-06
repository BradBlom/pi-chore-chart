document.addEventListener('DOMContentLoaded', () => {
  initializeSettings();
});

let currentTemplates = [];
let editingTemplateId = null;
let modalMode = 'create';

function initializeSettings() {
  const container = document.getElementById('settings-content');
  if (!container) {
    return;
  }

  container.innerHTML = '<p>Loading chore templates...</p>';
  loadChoreTemplates();
}

async function loadChoreTemplates() {
  try {
    const response = await fetch('/api/chore-templates');
    if (!response.ok) {
      throw new Error('Failed to load chore templates');
    }

    currentTemplates = await response.json();
    renderSettingsPage();
  } catch (error) {
    console.error('Error loading chore templates:', error);
    const container = document.getElementById('settings-content');
    if (container) {
      container.innerHTML = '<p class="w3-text-red">Unable to load chore templates.</p>';
    }
  }
}

function renderSettingsPage() {
  const container = document.getElementById('settings-content');
  if (!container) {
    return;
  }

  const rows = currentTemplates.map((template) => `
    <tr>
      <td>${escapeHtml(template.name || 'Untitled')}</td>
      <td>${escapeHtml(template.restartsOn || template.restarts_on || '—')}</td>
      <td>
        <button class="w3-button w3-small w3-blue" data-action="edit" data-id="${template.id}">Edit</button>
        <button class="w3-button w3-small w3-red" data-action="delete" data-id="${template.id}">Delete</button>
        <button class="w3-button w3-small w3-theme" data-action="assign" data-id="${template.id}">Assign</button>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="w3-row-padding">
      <div class="w3-col s12">
        <div class="w3-margin-bottom">
          <h2 style="margin:0 0 8px 0;">Chore templates</h2>
          <button id="create-template-btn" class="w3-button w3-theme">Create</button>
        </div>
        <div id="settings-message" class="w3-panel w3-pale-green w3-border w3-margin-bottom" style="display:none"></div>
        <table class="w3-table w3-striped w3-bordered w3-white">
          <thead>
            <tr>
              <th>Name</th>
              <th>Restart schedule</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="3">No chore templates found.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const createButton = document.getElementById('create-template-btn');
  if (createButton) {
    createButton.addEventListener('click', () => openTemplateModal());
  }

  container.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-action');
      const id = Number(button.getAttribute('data-id'));
      const template = currentTemplates.find((item) => item.id === id);

      if (!template) {
        return;
      }

      if (action === 'edit') {
        openTemplateModal(template);
      } else if (action === 'delete') {
        deleteTemplate(template.id);
      } else if (action === 'assign') {
        openAssignModal(template);
      }
    });
  });
}

function openTemplateModal(template = null) {
  editingTemplateId = template ? template.id : null;
  modalMode = template ? 'edit' : 'create';

  const modal = document.getElementById('template-modal');
  const modalTitle = document.getElementById('modal-title');
  const form = document.getElementById('template-form');
  const nameInput = document.getElementById('template-name');
  const restartsInput = document.getElementById('template-restarts-on');
  const templateIdInput = document.getElementById('template-id');
  const message = document.getElementById('modal-message');

  if (!modal || !modalTitle || !form || !nameInput || !restartsInput || !templateIdInput || !message) {
    return;
  }

  message.style.display = 'none';
  message.textContent = '';

  if (template) {
    modalTitle.textContent = 'Edit chore template';
    nameInput.value = template.name || '';
    restartsInput.value = template.restartsOn || template.restarts_on || '';
    templateIdInput.value = template.id;
  } else {
    modalTitle.textContent = 'Create chore template';
    form.reset();
    templateIdInput.value = '';
  }

  modal.style.display = 'block';
}

function openAssignModal(template) {
  const modal = document.getElementById('template-modal');
  const modalTitle = document.getElementById('modal-title');
  const form = document.getElementById('template-form');
  const message = document.getElementById('modal-message');
  const nameInput = document.getElementById('template-name');
  const restartsInput = document.getElementById('template-restarts-on');
  const templateIdInput = document.getElementById('template-id');

  if (!modal || !modalTitle || !form || !message || !nameInput || !restartsInput || !templateIdInput) {
    return;
  }

  editingTemplateId = template ? template.id : null;
  modalMode = 'assign';
  modalTitle.textContent = 'Assign chore template';
  nameInput.value = template?.name || '';
  restartsInput.value = template?.restartsOn || template?.restarts_on || '';
  templateIdInput.value = template?.id || '';
  form.reset();
  nameInput.value = template?.name || '';
  restartsInput.value = template?.restartsOn || template?.restarts_on || '';
  templateIdInput.value = template?.id || '';

  message.textContent = 'Assignment workflow is coming soon.';
  message.className = 'w3-panel w3-pale-yellow w3-border w3-margin-bottom';
  message.style.display = 'block';
  modal.style.display = 'block';
}

function closeTemplateModal() {
  const modal = document.getElementById('template-modal');
  const form = document.getElementById('template-form');
  const message = document.getElementById('modal-message');

  if (modal) {
    modal.style.display = 'none';
  }

  if (form) {
    form.reset();
  }

  if (message) {
    message.style.display = 'none';
    message.textContent = '';
  }

  editingTemplateId = null;
  modalMode = 'create';
}

document.getElementById('template-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (modalMode === 'assign') {
    closeTemplateModal();
    return;
  }

  const nameInput = document.getElementById('template-name');
  const restartsInput = document.getElementById('template-restarts-on');
  const templateIdInput = document.getElementById('template-id');
  const message = document.getElementById('modal-message');

  if (!nameInput || !restartsInput || !message) {
    return;
  }

  const name = nameInput.value.trim();
  const restartsOn = restartsInput.value.trim();

  if (!name || !restartsOn) {
    message.textContent = 'Please fill out both fields.';
    message.className = 'w3-panel w3-pale-red w3-border w3-margin-bottom';
    message.style.display = 'block';
    return;
  }

  const payload = { name, restartsOn };
  const method = editingTemplateId ? 'PUT' : 'POST';
  const url = editingTemplateId
    ? `/api/chore-templates/${editingTemplateId}`
    : '/api/chore-templates';

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Unable to save chore template');
    }

    const savedTemplate = await response.json();
    if (editingTemplateId) {
      currentTemplates = currentTemplates.map((template) => template.id === savedTemplate.id ? savedTemplate : template);
    } else {
      currentTemplates = [savedTemplate, ...currentTemplates];
    }

    renderSettingsPage();
    closeTemplateModal();
    showMessage('Chore template saved.');
  } catch (error) {
    console.error('Error saving chore template:', error);
    message.textContent = 'Unable to save chore template.';
    message.className = 'w3-panel w3-pale-red w3-border w3-margin-bottom';
    message.style.display = 'block';
  }
});

async function deleteTemplate(id) {
  if (!window.confirm('Delete this chore template?')) {
    return;
  }

  try {
    const response = await fetch(`/api/chore-templates/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error('Unable to delete chore template');
    }

    currentTemplates = currentTemplates.filter((template) => template.id !== id);
    renderSettingsPage();
    showMessage('Chore template deleted.');
  } catch (error) {
    console.error('Error deleting chore template:', error);
    showMessage('Unable to delete chore template.', true);
  }
}

function showMessage(message, isError = false) {
  const messageBox = document.getElementById('settings-message');
  if (!messageBox) {
    return;
  }

  messageBox.textContent = message;
  messageBox.className = isError
    ? 'w3-panel w3-pale-red w3-border w3-margin-bottom'
    : 'w3-panel w3-pale-green w3-border w3-margin-bottom';
  messageBox.style.display = 'block';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.closeTemplateModal = closeTemplateModal;
