document.addEventListener('DOMContentLoaded', () => {
  initializeSettings();
});

let currentTemplates = [];
let editingTemplateId = null;
let modalMode = 'create';
let memberPageCache = {};
let teamPageCache = {};
let currentAssignmentTemplateId = null;

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
  const modal = document.getElementById('assignment-modal');
  const info = document.getElementById('assignment-template-info');
  const assignmentList = document.getElementById('assignment-list');

  if (!modal || !info || !assignmentList) {
    return;
  }

  currentAssignmentTemplateId = template?.id ?? null;

  const name = template?.name || 'Unnamed template';
  const restartsOn = template?.restartsOn || template?.restarts_on || 'No schedule';

  info.innerHTML = `
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Restart schedule:</strong> ${escapeHtml(restartsOn)}</p>
  `;

  assignmentList.style.display = 'block';
  assignmentList.innerHTML = '<p>Loading assignments...</p>';
  modal.style.display = 'block';

  loadTemplateAssignments(template.id, assignmentList);
}

async function loadTemplateAssignments(templateId, container) {
  try {
    const response = await fetch(`/api/chore-assignments?fkChoreTemplateId=${encodeURIComponent(templateId)}`);
    if (!response.ok) {
      throw new Error('Unable to load assignments');
    }

    const assignments = await response.json();
    renderAssignmentList(assignments, container, templateId);
  } catch (error) {
    console.error('Error loading chore assignments:', error);
    container.innerHTML = '<p class="w3-text-red">Unable to load assignments.</p>';
  }
}

function renderAssignmentList(assignments, container, templateId) {
  if (!container) {
    return;
  }

  const memberAssignments = assignments.filter((assignment) => assignment.fkMemberId !== undefined && assignment.fkMemberId !== null);
  const teamAssignments = assignments.filter((assignment) => assignment.fkTeamId !== undefined && assignment.fkTeamId !== null);

  if ((!memberAssignments.length && !teamAssignments.length) || !Array.isArray(assignments)) {
    container.innerHTML = '<p>No assignments found.</p>';
    return;
  }

  const memberRows = memberAssignments.map((assignment) => `
      <tr>
        <td class="member-assignment-name" data-member-id="${assignment.fkMemberId}">
          <i class="fa fa-spinner fa-spin" aria-hidden="true"></i>
        </td>
        <td class="w3-right-align">
          <button class="w3-button w3-white w3-border w3-small" onclick="removeAssignment(${assignment.id}, ${templateId})">Remove</button>
        </td>
      </tr>`).join('');

  const teamRows = teamAssignments.map((assignment) => `
      <tr>
        <td class="team-assignment-name" data-team-id="${assignment.fkTeamId}">
          <i class="fa fa-spinner fa-spin" aria-hidden="true"></i>
        </td>
        <td class="w3-right-align">
          <button class="w3-button w3-white w3-border w3-small" onclick="removeAssignment(${assignment.id}, ${templateId})">Remove</button>
        </td>
      </tr>`).join('');

  container.innerHTML = `
    <div class="w3-container w3-padding-small">
      <div class="w3-margin-bottom">
        <button class="w3-button w3-small w3-theme" data-action="create-member-assignment">Create member assignment</button>
        <div class="w3-margin-top" data-member-assignment-picker></div>
      </div>
      <table class="w3-table w3-striped w3-bordered w3-white">
        <thead>
          <tr>
            <th>Member</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${memberRows || '<tr><td colspan="2">No member assignments</td></tr>'}
        </tbody>
      </table>
    </div>
    <div class="w3-container w3-padding-small">
      <div class="w3-margin-bottom">
        <button class="w3-button w3-small w3-theme">Create team assignment</button>
      </div>
      <table class="w3-table w3-striped w3-bordered w3-white">
        <thead>
          <tr>
            <th>Team</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${teamRows || '<tr><td colspan="2">No team assignments</td></tr>'}
        </tbody>
      </table>
    </div>`;

  const memberAssignmentButton = container.querySelector('[data-action="create-member-assignment"]');
  if (memberAssignmentButton) {
    memberAssignmentButton.addEventListener('click', () => {
      if (!currentAssignmentTemplateId) {
        return;
      }
      showMemberAssignmentOptions(container, currentAssignmentTemplateId);
    });
  }

  container.querySelectorAll('.member-assignment-name').forEach((cell) => {
    const memberId = cell.getAttribute('data-member-id');
    if (!memberId) {
      return;
    }

    loadMemberName(memberId, cell);
  });

  container.querySelectorAll('.team-assignment-name').forEach((cell) => {
    const teamId = cell.getAttribute('data-team-id');
    if (!teamId) {
      return;
    }

    loadTeamName(teamId, cell);
  });
}

async function showMemberAssignmentOptions(container, templateId) {
  if (!container) {
    return;
  }

  const picker = container.querySelector('[data-member-assignment-picker]');
  if (!picker) {
    return;
  }

  picker.innerHTML = '<div class="w3-padding-small w3-border w3-round" style="display:inline-block">Loading members...</div>';

  try {
    const response = await fetch('/api/members');
    if (!response.ok) {
      throw new Error('Unable to load members');
    }

    const members = await response.json();
    if (!Array.isArray(members) || !members.length) {
      picker.innerHTML = '<div class="w3-padding-small w3-border w3-round">No members found.</div>';
      return;
    }

    picker.innerHTML = `
      <div class="w3-container w3-padding-small w3-border w3-round" style="display:flex; flex-wrap:wrap; gap:8px;">
        ${members.map((member) => `
          <button
            class="w3-button w3-small w3-white w3-border"
            data-action="select-member-assignment"
            data-member-id="${member.id}"
          >
            ${escapeHtml(member.longName || member.long_name || member.name || 'Unnamed member')}
          </button>
        `).join('')}
      </div>
    `;

    picker.querySelectorAll('[data-action="select-member-assignment"]').forEach((button) => {
      button.addEventListener('click', async () => {
        const memberId = button.getAttribute('data-member-id');
        if (!memberId) {
          return;
        }
        await createMemberAssignment(templateId, Number(memberId), container);
      });
    });
  } catch (error) {
    console.error('Error loading members:', error);
    picker.innerHTML = '<div class="w3-padding-small w3-border w3-round w3-text-red">Unable to load members.</div>';
  }
}

async function createMemberAssignment(templateId, memberId, container) {
  if (!templateId || !memberId) {
    return;
  }

  try {
    const response = await fetch('/api/chore-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fkChoreTemplateId: templateId, fkMemberId: memberId })
    });

    if (!response.ok) {
      throw new Error('Unable to create assignment');
    }

    const assignmentList = document.getElementById('assignment-list');
    if (assignmentList) {
      loadTemplateAssignments(templateId, assignmentList);
    }
  } catch (error) {
    console.error('Error creating member assignment:', error);
    if (container) {
      const picker = container.querySelector('[data-member-assignment-picker]');
      if (picker) {
        picker.innerHTML = '<div class="w3-padding-small w3-border w3-round w3-text-red">Unable to add assignment.</div>';
      }
    }
  }
}

async function loadMemberName(memberId, cell) {
  const cacheKey = String(memberId);
  const cachedMember = memberPageCache[cacheKey];

  if (cachedMember) {
    if (cell) {
      cell.textContent = cachedMember.longName || cachedMember.long_name || cachedMember.name || 'Unnamed member';
    }
    return;
  }

  try {
    const response = await fetch(`/api/members/${encodeURIComponent(memberId)}`);
    if (!response.ok) {
      throw new Error('Unable to load member');
    }

    const member = await response.json();
    memberPageCache[cacheKey] = member;
    const displayName = member.longName || member.long_name || member.name || 'Unnamed member';
    if (cell) {
      cell.textContent = displayName;
    }
  } catch (error) {
    console.error('Error loading member name:', error);
    if (cell) {
      cell.textContent = 'Unavailable';
    }
  }
}

async function loadTeamName(teamId, cell) {
  const cacheKey = String(teamId);
  const cachedTeam = teamPageCache[cacheKey];

  if (cachedTeam) {
    if (cell) {
      cell.textContent = cachedTeam.longName || cachedTeam.long_name || cachedTeam.name || 'Unnamed team';
    }
    return;
  }

  try {
    const response = await fetch(`/api/teams/${encodeURIComponent(teamId)}`);
    if (!response.ok) {
      throw new Error('Unable to load team');
    }

    const team = await response.json();
    teamPageCache[cacheKey] = team;
    const displayName = team.longName || team.long_name || team.name || 'Unnamed team';
    if (cell) {
      cell.textContent = displayName;
    }
  } catch (error) {
    console.error('Error loading team name:', error);
    if (cell) {
      cell.textContent = 'Unavailable';
    }
  }
}

async function removeAssignment(assignmentId, templateId) {
  if (!assignmentId) {
    return;
  }

  try {
    const response = await fetch(`/api/chore-assignments/${assignmentId}`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error('Unable to remove assignment');
    }

    const container = document.getElementById('assignment-list');
    if (container) {
      loadTemplateAssignments(templateId, container);
    }
  } catch (error) {
    console.error('Error removing assignment:', error);
    const container = document.getElementById('assignment-list');
    if (container) {
      container.innerHTML = '<p class="w3-text-red">Unable to remove assignment.</p>';
    }
  }
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

function closeAssignmentModal() {
  const modal = document.getElementById('assignment-modal');
  const info = document.getElementById('assignment-template-info');
  const assignmentList = document.getElementById('assignment-list');

  if (modal) {
    modal.style.display = 'none';
  }

  if (info) {
    info.innerHTML = '';
  }

  if (assignmentList) {
    assignmentList.style.display = 'none';
    assignmentList.innerHTML = '';
  }

  currentAssignmentTemplateId = null;
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
window.closeAssignmentModal = closeAssignmentModal;
