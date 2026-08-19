document.addEventListener('DOMContentLoaded', () => {
  initializeSettings();
});

let currentTemplates = [];
let editingTemplateId = null;
let modalMode = 'create';
let memberPageCache = {};
let teamPageCache = {};
let currentAssignmentTemplateId = null;
let currentMembers = [];
let currentTeams = [];
let currentServerSetting = null;
let editingMemberId = null;
let editingTeamId = null;

const restartScheduleDays = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' }
];

function initializeSettings() {
  const container = document.getElementById('settings-content');
  if (!container) {
    return;
  }

  const modal = document.getElementById('passcode-modal');
  const passcodeInput = document.getElementById('server-passcode');
  if (modal) {
    modal.style.display = 'block';
  }
  passcodeInput?.focus();
}

async function loadSettingsAfterVerification(passcode) {
  const container = document.getElementById('settings-content');
  const modal = document.getElementById('passcode-modal');
  const message = document.getElementById('passcode-message');

  if (!container || !modal || !message) {
    return;
  }

  try {
    const response = await fetch(`/api/settings/verify-passcode?passcode=${encodeURIComponent(passcode)}`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error('Unable to verify passcode');
    }

    const result = await response.json();
    if (!result.isMatch) {
      throw new Error('Incorrect passcode');
    }

    modal.style.display = 'none';
    container.innerHTML = '<p>Loading settings...</p>';
    Promise.all([loadSettings(), loadChoreTemplates(), loadMembers(), loadTeams()])
      .then(() => renderSettingsPage())
      .catch((err) => {
        console.error('Error loading settings:', err);
        container.innerHTML = '<p class="w3-text-red">Unable to load settings.</p>';
      });
  } catch (error) {
    console.error('Error verifying settings passcode:', error);
    message.textContent = error.message === 'Incorrect passcode'
      ? 'Incorrect passcode.'
      : 'Unable to verify passcode.';
    message.style.display = 'block';
  }
}

async function loadSettings() {
  try {
    const response = await fetch('/api/settings/primary');
    if (!response.ok) {
      throw new Error('Failed to load server settings');
    }

    currentServerSetting = await response.json();
  } catch (error) {
    console.error('Error loading server settings:', error);
    currentServerSetting = null;
  }
}

async function loadChoreTemplates() {
  try {
    const response = await fetch('/api/chore-templates');
    if (!response.ok) {
      throw new Error('Failed to load chore templates');
    }

    currentTemplates = await response.json();
    return;
  } catch (error) {
    console.error('Error loading chore templates:', error);
    const container = document.getElementById('settings-content');
    if (container) {
      container.innerHTML = '<p class="w3-text-red">Unable to load chore templates.</p>';
    }
  }
}

async function loadMembers() {
  try {
    const response = await fetch('/api/members');
    if (!response.ok) throw new Error('Failed to load members');
    currentMembers = await response.json();
    return;
  } catch (err) {
    console.error('Error loading members:', err);
    currentMembers = [];
  }
}

async function loadTeams() {
  try {
    const response = await fetch('/api/teams');
    if (!response.ok) throw new Error('Failed to load teams');
    currentTeams = await response.json();
    return;
  } catch (err) {
    console.error('Error loading teams:', err);
    currentTeams = [];
  }
}

async function refreshSettingsContent(event) {
  const button = event.currentTarget;
  const container = document.getElementById('settings-content');

  if (button) {
    button.disabled = true;
  }

  try {
    await Promise.all([loadSettings(), loadChoreTemplates(), loadMembers(), loadTeams()]);
    renderSettingsPage();
  } catch (error) {
    console.error('Error refreshing settings:', error);
    if (container) {
      container.innerHTML = '<p class="w3-text-red">Unable to refresh settings.</p>';
    }
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}

function renderSettingsPage() {
  const container = document.getElementById('settings-content');
  if (!container) {
    return;
  }

  const serverSetting = currentServerSetting || {};
  // build rows for templates
  const templateRows = currentTemplates.map((template) => `
    <tr>
      <td>${escapeHtml(template.name || 'Untitled')}</td>
      <td>${escapeHtml(formatRestartSchedule(template.restartsOn || template.restarts_on))}</td>
      <td>
        <button class="w3-button w3-small w3-black" data-resource="template" data-action="assign" data-id="${template.id}">
          <i class="fa fa-exchange w3-margin-right w3-text-blue" aria-hidden="true"></i>
          <span class="w3-hide-medium w3-hide-small">Assign</span>
        </button>
        <button class="w3-button w3-small w3-black" data-resource="template" data-action="edit" data-id="${template.id}">
          <i class="fa fa-edit w3-margin-right w3-text-blue" aria-hidden="true"></i>
          <span class="w3-hide-medium w3-hide-small">Edit</span>
        </button>
        <button class="w3-button w3-small w3-black" data-resource="template" data-action="delete" data-id="${template.id}">
          <i class="fa fa-close w3-margin-right w3-text-red" aria-hidden="true"></i>
          <span class="w3-hide-medium w3-hide-small">Delete</span>
        </button>
      </td>
    </tr>
  `).join('');

  // build rows for members
  const memberRows = currentMembers.map((m) => `
    <tr>
      <td>${escapeHtml(m.shortName || m.longName || 'Unnamed')}</td>
      <td>${escapeHtml(m.longName || '')}</td>
      <td>
        <button class="w3-button w3-small w3-black" data-resource="member" data-action="edit" data-id="${m.id}">
          <i class="fa fa-edit w3-margin-right w3-text-blue" aria-hidden="true"></i>
          <span class="w3-hide-medium w3-hide-small">Edit</span>
        </button>
        <button class="w3-button w3-small w3-black" data-resource="member" data-action="delete" data-id="${m.id}">
          <i class="fa fa-close w3-margin-right w3-text-red" aria-hidden="true"></i>
          <span class="w3-hide-medium w3-hide-small">Delete</span>
        </button>
      </td>
    </tr>
  `).join('');

  // build rows for teams
  const teamRows = currentTeams.map((t) => `
    <tr>
      <td>${escapeHtml(t.shortName || t.longName || 'Unnamed')}</td>
      <td>${escapeHtml(t.longName || '')}</td>
      <td>
        <button class="w3-button w3-small w3-black" data-resource="team" data-action="edit" data-id="${t.id}">
          <i class="fa fa-edit w3-margin-right w3-text-blue" aria-hidden="true"></i>
          <span class="w3-hide-medium w3-hide-small">Edit</span>
        </button>
        <button class="w3-button w3-small w3-black" data-resource="team" data-action="delete" data-id="${t.id}">
          <i class="fa fa-close w3-margin-right w3-text-red" aria-hidden="true"></i>
          <span class="w3-hide-medium w3-hide-small">Delete</span>
        </button>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="w3-row-padding">
      <div id="settings-message" class="w3-panel w3-pale-green w3-border w3-margin-bottom" style="display:none"></div>
      <div class="w3-col s12">
        <div class="w3-margin-bottom w3-margin-top">
          <button id="refresh-settings-btn" class="w3-button w3-small w3-black" type="button">
            <i class="fa fa-refresh w3-margin-right w3-text-blue" aria-hidden="true"></i>
            <span class="w3-hide-medium w3-hide-small">Refresh</span>
          </button>
        </div>
        <div class="w3-margin-bottom">
          <h2 style="margin:0 0 8px 0;">Chore Templates</h2>
          <button id="create-template-btn" class="w3-button w3-small w3-black">
            <i class="fa fa-plus w3-margin-right w3-text-green" aria-hidden="true"></i>
            <span class="w3-hide-medium w3-hide-small">Create</span>
          </button>
        </div>
        <table class="w3-table w3-striped w3-bordered w3-white">
          <thead>
            <tr>
              <th>Name</th>
              <th>Restart schedule</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${templateRows || '<tr><td colspan="3">No chore templates found.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <div class="w3-row-padding" style="margin-top:24px">
      <div class="w3-col s12">
        <div class="w3-margin-bottom">
          <h2 style="margin:0 0 8px 0;">Members</h2>
          <button id="create-member-btn" class="w3-button w3-small w3-black">
            <i class="fa fa-plus w3-margin-right w3-text-green" aria-hidden="true"></i>
            <span class="w3-hide-medium w3-hide-small">Create</span>
          </button>
        </div>
        <table class="w3-table w3-striped w3-bordered w3-white">
          <thead>
            <tr>
              <th>Name</th>
              <th>Full name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${memberRows || '<tr><td colspan="3">No members found.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <div class="w3-row-padding" style="margin-top:24px">
      <div class="w3-col s12">
        <div class="w3-margin-bottom">
          <h2 style="margin:0 0 8px 0;">Teams</h2>
          <button id="create-team-btn" class="w3-button w3-small w3-black">
            <i class="fa fa-plus w3-margin-right w3-text-green" aria-hidden="true"></i>
            <span class="w3-hide-medium w3-hide-small">Create</span>
          </button>
        </div>
        <table class="w3-table w3-striped w3-bordered w3-white">
          <thead>
            <tr>
              <th>Name</th>
              <th>Full name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${teamRows || '<tr><td colspan="3">No teams found.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <div class="w3-row-padding" style="margin-top:24px">
      <div class="w3-col s12">
        <div class="w3-margin-bottom">
          <h2 style="margin:0 0 8px 0;">Server Settings</h2>
        </div>
        <form id="server-settings-form" class="w3-container w3-white w3-border w3-padding">
          <input type="hidden" id="server-setting-id" value="${escapeHtml(serverSetting.id || '')}" />
          <label class="w3-text-dark-grey" for="server-day-begins-hour">Day begins hour</label>
          <input id="server-day-begins-hour" type="number" min="0" max="23" class="w3-input w3-border w3-margin-bottom" value="${escapeHtml(serverSetting.dayBeginsHr ?? '')}" required />

          <label class="w3-text-dark-grey" for="server-admin-passcode">Admin passcode</label>
          <input id="server-admin-passcode" type="password" class="w3-input w3-border w3-margin-bottom" value="${escapeHtml(serverSetting.adminPasscode || '')}" required />

          <p><strong>Initialization status:</strong> ${escapeHtml(serverSetting.initDayStatus || '—')}</p>
          <p><strong>Current day:</strong> ${escapeHtml(serverSetting.currDay || '—')}</p>
          <button type="submit" class="w3-button w3-black">
            <i class="fa fa-save w3-margin-right w3-text-green" aria-hidden="true"></i>
            Save server settings
          </button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('server-settings-form')?.addEventListener('submit', saveServerSettings);
  document.getElementById('refresh-settings-btn')?.addEventListener('click', refreshSettingsContent);

  const createTemplateButton = document.getElementById('create-template-btn');
  if (createTemplateButton) createTemplateButton.addEventListener('click', () => openTemplateModal());
  const createMemberButton = document.getElementById('create-member-btn');
  if (createMemberButton) createMemberButton.addEventListener('click', () => openMemberModal());
  const createTeamButton = document.getElementById('create-team-btn');
  if (createTeamButton) createTeamButton.addEventListener('click', () => openTeamModal());

  container.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-action');
      const resource = button.getAttribute('data-resource') || 'template';
      const id = Number(button.getAttribute('data-id'));

      if (resource === 'template') {
        const template = currentTemplates.find((item) => item.id === id);
        if (!template) return;
        if (action === 'edit') openTemplateModal(template);
        else if (action === 'delete') deleteTemplate(template.id);
        else if (action === 'assign') openAssignModal(template);
      } else if (resource === 'member') {
        const member = currentMembers.find((m) => m.id === id);
        if (!member) return;
        if (action === 'edit') openMemberModal(member);
        else if (action === 'delete') deleteMember(member.id);
      } else if (resource === 'team') {
        const team = currentTeams.find((t) => t.id === id);
        if (!team) return;
        if (action === 'edit') openTeamModal(team);
        else if (action === 'delete') deleteTeam(team.id);
      }
    });
  });
}

async function saveServerSettings(event) {
  event.preventDefault();

  const id = document.getElementById('server-setting-id')?.value;
  const dayBeginsHr = Number(document.getElementById('server-day-begins-hour')?.value);
  const adminPasscode = document.getElementById('server-admin-passcode')?.value.trim();
  const message = document.getElementById('settings-message');

  if (!id || Number.isNaN(dayBeginsHr) || !adminPasscode || !currentServerSetting) {
    showMessage('Please enter valid server settings.', true);
    return;
  }

  try {
    const response = await fetch(`/api/settings/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dayBeginsHr,
        initDayStatus: currentServerSetting.initDayStatus,
        currDay: currentServerSetting.currDay,
        adminPasscode
      })
    });
    if (!response.ok) {
      throw new Error('Unable to save server settings');
    }

    currentServerSetting = await response.json();
    renderSettingsPage();
    showMessage('Server settings saved.');
  } catch (error) {
    console.error('Error saving server settings:', error);
    if (message) {
      showMessage('Unable to save server settings.', true);
    }
  }
}

function openTemplateModal(template = null) {
  editingTemplateId = template ? template.id : null;
  modalMode = template ? 'edit' : 'create';

  const modal = document.getElementById('template-modal');
  const modalTitle = document.getElementById('modal-title');
  const form = document.getElementById('template-form');
  const nameInput = document.getElementById('template-name');
  const templateIdInput = document.getElementById('template-id');
  const message = document.getElementById('modal-message');

  if (!modal || !modalTitle || !form || !nameInput || !templateIdInput || !message) {
    return;
  }

  message.style.display = 'none';
  message.textContent = '';

  if (template) {
    modalTitle.textContent = 'Edit Chore Template';
    nameInput.value = template.name || '';
    setRestartScheduleCheckboxes(template.restartsOn || template.restarts_on);
    templateIdInput.value = template.id;
  } else {
    modalTitle.textContent = 'Create Chore Template';
    form.reset();
    setRestartScheduleCheckboxes('');
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

  if (!Array.isArray(assignments)) {
    container.innerHTML = '<p>No assignments found.</p>';
    return;
  }

  const memberAssignments = assignments.filter((assignment) => assignment.fkMemberId !== undefined && assignment.fkMemberId !== null);
  const teamAssignments = assignments.filter((assignment) => assignment.fkTeamId !== undefined && assignment.fkTeamId !== null);

  const memberRows = memberAssignments.map((assignment) => `
      <tr>
        <td class="member-assignment-name" data-member-id="${assignment.fkMemberId}">
          <i class="fa fa-spinner fa-spin" aria-hidden="true"></i>
        </td>
        <td>
          <button class="w3-button w3-small w3-black" onclick="removeAssignment(${assignment.id}, ${templateId})">
            <i class="fa fa-close w3-margin-right w3-text-red" aria-hidden="true"></i>
            <span class="w3-hide-medium w3-hide-small">Remove</span>
          </button>
        </td>
      </tr>`).join('');

  const teamRows = teamAssignments.map((assignment) => `
      <tr>
        <td class="team-assignment-name" data-team-id="${assignment.fkTeamId}">
          <i class="fa fa-spinner fa-spin" aria-hidden="true"></i>
        </td>
        <td>
          <button class="w3-button w3-small w3-black" onclick="removeAssignment(${assignment.id}, ${templateId})">
            <i class="fa fa-close w3-margin-right w3-text-red" aria-hidden="true"></i>
            <span class="w3-hide-medium w3-hide-small">Remove</span>
          </button>
        </td>
      </tr>`).join('');

  container.innerHTML = `
    <div class="w3-container w3-padding-small">
      <div class="w3-margin-bottom">
        <button class="w3-button w3-small w3-black" data-action="create-member-assignment">
          <i class="fa fa-plus w3-margin-right w3-text-green" aria-hidden="true"></i>
          <i class="fa fa-user w3-margin-right w3-text-green" aria-hidden="true"></i>
          <span class="w3-hide-medium w3-hide-small">Create member assignment</span>
        </button>
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
    <div class="w3-container w3-padding-small" style="margin-top:32px">
      <div class="w3-margin-bottom">
        <button class="w3-button w3-small w3-black" data-action="create-team-assignment">
          <i class="fa fa-plus w3-margin-right w3-text-green" aria-hidden="true"></i>
          <i class="fa fa-users w3-margin-right w3-text-green" aria-hidden="true"></i>
          <span class="w3-hide-medium w3-hide-small">Create team assignment</span>
        </button>
        <div class="w3-margin-top" data-team-assignment-picker></div>
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

  const teamAssignmentButton = container.querySelector('[data-action="create-team-assignment"]');
  if (teamAssignmentButton) {
    teamAssignmentButton.addEventListener('click', () => {
      if (!currentAssignmentTemplateId) {
        return;
      }
      showTeamAssignmentOptions(container, currentAssignmentTemplateId);
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
            ${escapeHtml(member.longName || member.shortName || 'Unnamed member')}
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

async function showTeamAssignmentOptions(container, templateId) {
  if (!container) {
    return;
  }

  const picker = container.querySelector('[data-team-assignment-picker]');
  if (!picker) {
    return;
  }

  picker.innerHTML = '<div class="w3-padding-small w3-border w3-round" style="display:inline-block">Loading teams...</div>';

  try {
    const response = await fetch('/api/teams');
    if (!response.ok) {
      throw new Error('Unable to load teams');
    }

    const teams = await response.json();
    if (!Array.isArray(teams) || !teams.length) {
      picker.innerHTML = '<div class="w3-padding-small w3-border w3-round">No teams found.</div>';
      return;
    }

    picker.innerHTML = `
      <div class="w3-container w3-padding-small w3-border w3-round" style="display:flex; flex-wrap:wrap; gap:8px;">
        ${teams.map((team) => `
          <button
            class="w3-button w3-small w3-white w3-border"
            data-action="select-team-assignment"
            data-team-id="${team.id}"
          >
            ${escapeHtml(team.longName || team.shortName || 'Unnamed team')}
          </button>
        `).join('')}
      </div>
    `;

    picker.querySelectorAll('[data-action="select-team-assignment"]').forEach((button) => {
      button.addEventListener('click', async () => {
        const teamId = button.getAttribute('data-team-id');
        if (!teamId) {
          return;
        }
        await createTeamAssignment(templateId, Number(teamId), container);
      });
    });
  } catch (error) {
    console.error('Error loading teams:', error);
    picker.innerHTML = '<div class="w3-padding-small w3-border w3-round w3-text-red">Unable to load teams.</div>';
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

async function createTeamAssignment(templateId, teamId, container) {
  if (!templateId || !teamId) {
    return;
  }

  try {
    const response = await fetch('/api/chore-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fkChoreTemplateId: templateId, fkTeamId: teamId })
    });

    if (!response.ok) {
      throw new Error('Unable to create assignment');
    }

    const assignmentList = document.getElementById('assignment-list');
    if (assignmentList) {
      loadTemplateAssignments(templateId, assignmentList);
    }
  } catch (error) {
    console.error('Error creating team assignment:', error);
    if (container) {
      const picker = container.querySelector('[data-team-assignment-picker]');
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
      cell.textContent = cachedMember.longName || cachedMember.shortName || 'Unnamed member';
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
    const displayName = member.longName || member.shortName || 'Unnamed member';
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
      cell.textContent = cachedTeam.longName || cachedTeam.shortName || 'Unnamed team';
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
    const displayName = team.longName || team.shortName || 'Unnamed team';
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

function openMemberModal(member = null) {
  editingMemberId = member ? member.id : null;
  const modal = document.getElementById('member-modal');
  const title = document.getElementById('member-modal-title');
  const form = document.getElementById('member-form');
  const shortNameInput = document.getElementById('member-short-name');
  const longNameInput = document.getElementById('member-long-name');
  const isAdminInput = document.getElementById('member-is-admin');
  const idInput = document.getElementById('member-id');
  const msg = document.getElementById('member-modal-message');
  if (!modal || !form || !shortNameInput || !idInput || !msg) return;
  msg.style.display = 'none'; msg.textContent = '';
  if (member) {
    title.textContent = 'Edit Member';
    shortNameInput.value = member.shortName || '';
    longNameInput.value = member.longName || '';
    if (isAdminInput) isAdminInput.checked = Boolean(member.isAdmin || false);
    idInput.value = member.id;
  } else {
    title.textContent = 'Create Member';
    form.reset(); idInput.value = '';
  }
  modal.style.display = 'block';
}

function closeMemberModal() {
  const modal = document.getElementById('member-modal');
  const form = document.getElementById('member-form');
  const msg = document.getElementById('member-modal-message');
  if (modal) modal.style.display = 'none';
  if (form) form.reset();
  if (msg) { msg.style.display = 'none'; msg.textContent = ''; }
  editingMemberId = null;
}

function openTeamModal(team = null) {
  editingTeamId = team ? team.id : null;
  const modal = document.getElementById('team-modal');
  const title = document.getElementById('team-modal-title');
  const form = document.getElementById('team-form');
  const shortNameInput = document.getElementById('team-short-name');
  const longNameInput = document.getElementById('team-long-name');
  const idInput = document.getElementById('team-id');
  const msg = document.getElementById('team-modal-message');
  if (!modal || !form || !shortNameInput || !idInput || !msg) return;
  msg.style.display = 'none'; msg.textContent = '';
  if (team) {
    title.textContent = 'Edit Team';
    shortNameInput.value = team.shortName || '';
    longNameInput.value = team.longName || '';
    idInput.value = team.id;
  } else {
    title.textContent = 'Create Team';
    form.reset(); idInput.value = '';
  }
  modal.style.display = 'block';
}

function closeTeamModal() {
  const modal = document.getElementById('team-modal');
  const form = document.getElementById('team-form');
  const msg = document.getElementById('team-modal-message');
  if (modal) modal.style.display = 'none';
  if (form) form.reset();
  if (msg) { msg.style.display = 'none'; msg.textContent = ''; }
  editingTeamId = null;
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
  const templateIdInput = document.getElementById('template-id');
  const message = document.getElementById('modal-message');

  if (!nameInput || !message) {
    return;
  }

  const name = nameInput.value.trim();
  const restartsOn = getSelectedRestartSchedule();

  if (!name || !restartsOn) {
    message.textContent = 'Please enter a name and select at least one restart day.';
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

document.getElementById('passcode-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const passcodeInput = document.getElementById('server-passcode');
  const message = document.getElementById('passcode-message');
  if (!passcodeInput || !message) {
    return;
  }

  message.style.display = 'none';
  await loadSettingsAfterVerification(passcodeInput.value);
});

document.getElementById('member-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const shortNameInput = document.getElementById('member-short-name');
  const longNameInput = document.getElementById('member-long-name');
  const idInput = document.getElementById('member-id');
  const msg = document.getElementById('member-modal-message');
  if (!shortNameInput || !msg) return;

  const shortName = shortNameInput.value.trim();
  const longName = longNameInput?.value.trim() || '';
  const isAdmin = Boolean(document.getElementById('member-is-admin')?.checked);

  if (!shortName) {
    msg.textContent = 'Please enter a name.';
    msg.className = 'w3-panel w3-pale-red w3-border w3-margin-bottom';
    msg.style.display = 'block';
    return;
  }

  const payload = { shortName, longName, isActive: 1 };
  payload.isAdmin = isAdmin ? 1 : 0;
  const editingId = idInput?.value ? Number(idInput.value) : null;
  const method = editingId ? 'PUT' : 'POST';
  const url = editingId ? `/api/members/${editingId}` : '/api/members';

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Unable to save member');
    await loadMembers();
    renderSettingsPage();
    closeMemberModal();
    showMessage('Member saved.');
  } catch (err) {
    console.error('Error saving member:', err);
    msg.textContent = 'Unable to save member.';
    msg.className = 'w3-panel w3-pale-red w3-border w3-margin-bottom';
    msg.style.display = 'block';
  }
});

document.getElementById('team-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const shortNameInput = document.getElementById('team-short-name');
  const longNameInput = document.getElementById('team-long-name');
  const idInput = document.getElementById('team-id');
  const msg = document.getElementById('team-modal-message');
  if (!shortNameInput || !msg) return;

  const shortName = shortNameInput.value.trim();
  const longName = longNameInput?.value.trim() || '';

  if (!shortName) {
    msg.textContent = 'Please enter a name.';
    msg.className = 'w3-panel w3-pale-red w3-border w3-margin-bottom';
    msg.style.display = 'block';
    return;
  }

  const payload = { shortName, longName, isActive: 1 };
  const editingId = idInput?.value ? Number(idInput.value) : null;
  const method = editingId ? 'PUT' : 'POST';
  const url = editingId ? `/api/teams/${editingId}` : '/api/teams';

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Unable to save team');
    await loadTeams();
    renderSettingsPage();
    closeTeamModal();
    showMessage('Team saved.');
  } catch (err) {
    console.error('Error saving team:', err);
    msg.textContent = 'Unable to save team.';
    msg.className = 'w3-panel w3-pale-red w3-border w3-margin-bottom';
    msg.style.display = 'block';
  }
});

async function deleteMember(id) {
  if (!window.confirm('Delete this member?')) return;
  try {
    const response = await fetch(`/api/members/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Unable to delete member');
    await loadMembers();
    renderSettingsPage();
    showMessage('Member deleted.');
  } catch (err) {
    console.error('Error deleting member:', err);
    showMessage('Unable to delete member.', true);
  }
}

async function deleteTeam(id) {
  if (!window.confirm('Delete this team?')) return;
  try {
    const response = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Unable to delete team');
    await loadTeams();
    renderSettingsPage();
    showMessage('Team deleted.');
  } catch (err) {
    console.error('Error deleting team:', err);
    showMessage('Unable to delete team.', true);
  }
}

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

function formatRestartSchedule(value) {
  const schedule = String(value || '').trim().toLowerCase();
  if (!schedule) {
    return '—';
  }
  if (schedule === 'daily') {
    return 'Daily';
  }

  return schedule
    .split(',')
    .map((day) => day.trim())
    .filter(Boolean)
    .map((day) => day.charAt(0).toUpperCase() + day.slice(1))
    .join(' ');
}

function setRestartScheduleCheckboxes(value) {
  const schedule = String(value || '').trim().toLowerCase();
  const selectedDays = schedule === 'daily'
    ? restartScheduleDays.map((day) => day.value)
    : schedule.split(',').map((day) => day.trim()).filter(Boolean);

  document.querySelectorAll('[data-restart-day]').forEach((checkbox) => {
    checkbox.checked = selectedDays.includes(checkbox.value);
  });
}

function getSelectedRestartSchedule() {
  const form = document.getElementById('template-form');
  if (!form) {
    return '';
  }

  const selectedDays = Array.from(
    form.querySelectorAll('[data-restart-day]:checked')
  ).map((checkbox) => checkbox.value);

  const orderedSelectedDays = restartScheduleDays
    .map((day) => day.value)
    .filter((day) => selectedDays.includes(day));

  if (orderedSelectedDays.length === restartScheduleDays.length) {
    return 'daily';
  }

  return orderedSelectedDays.join(',');
}

window.closeTemplateModal = closeTemplateModal;
window.closeAssignmentModal = closeAssignmentModal;
window.closeMemberModal = closeMemberModal;
window.closeTeamModal = closeTeamModal;
