// API client for backend communication
class CRMClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.eventSource = null;
    this.connectionStatus = 'disconnected';
    this.subscribers = {};
  }

  // Subscribe to data updates
  subscribe(type, callback) {
    if (!this.subscribers[type]) {
      this.subscribers[type] = [];
    }
    this.subscribers[type].push(callback);
    
    return () => {
      this.subscribers[type] = this.subscribers[type].filter(cb => cb !== callback);
    };
  }

  // Notify subscribers
  notify(type, data) {
    if (this.subscribers[type]) {
      this.subscribers[type].forEach(callback => callback(data));
    }
  }

  // Connect to real-time stream
  connect() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource('/api/stream');
    
    this.eventSource.onopen = () => {
      this.connectionStatus = 'connected';
      this.notify('connectionStatus', 'connected');
    };

    this.eventSource.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        
        if (type === 'initial') {
          // Handle initial state
          this.notify('contacts', data.contacts);
          this.notify('communications', data.communications);
          this.notify('leads', data.leads);
          this.notify('customers', data.customers);
        } else {
          // Handle updates
          this.notify(type, data);
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    this.eventSource.onerror = () => {
      this.connectionStatus = 'disconnected';
      this.notify('connectionStatus', 'disconnected');
    };
  }

  // API methods
  async addContact(name, email, type) {
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, type })
    });
    return response.json();
  }

  async recordCommunication(contactId, type, content, direction) {
    const response = await fetch('/api/communications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId, type, content, direction })
    });
    return response.json();
  }

  async promoteContact(contactId) {
    const response = await fetch(`/api/contacts/${contactId}/promote`, {
      method: 'PUT'
    });
    return response.json();
  }

  async updateCommunication(communicationId, updates) {
    const response = await fetch(`/api/communications/${communicationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return response.json();
  }

  async getCommunicationHistory(communicationId) {
    const response = await fetch(`/api/communications/${communicationId}/history`);
    return response.json();
  }

  async getState() {
    const response = await fetch('/api/state');
    return response.json();
  }
}

// Initialize client
const client = new CRMClient();

// DOM elements
const connectionStatus = document.getElementById('connection-status');
const totalContactsEl = document.getElementById('total-contacts');
const leadsCountEl = document.getElementById('leads-count');
const customersCountEl = document.getElementById('customers-count');
const communicationsCountEl = document.getElementById('communications-count');
const contactsListEl = document.getElementById('contacts-list');
const communicationsListEl = document.getElementById('communications-list');
const contactForm = document.getElementById('contact-form');
const commForm = document.getElementById('comm-form');
const commContactSelect = document.getElementById('comm-contact');
const errorMessageEl = document.getElementById('error-message');
const successMessageEl = document.getElementById('success-message');

// State
let contacts = [];
let communications = [];
let leads = [];
let customers = [];

// UI helpers
const showMessage = (message, type = 'success') => {
  const el = type === 'success' ? successMessageEl : errorMessageEl;
  el.textContent = message;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3000);
};

const updateFormButtons = (enabled) => {
  document.getElementById('add-contact-btn').disabled = !enabled;
  document.getElementById('add-comm-btn').disabled = !enabled;
  document.querySelectorAll('.promote-btn').forEach(btn => btn.disabled = !enabled);
};

// Subscribe to updates
client.subscribe('connectionStatus', (status) => {
  connectionStatus.textContent = status === 'connected' ? 'Connected' : 'Disconnected';
  connectionStatus.className = `connection-status ${status}`;
  updateFormButtons(status === 'connected');
});

client.subscribe('contacts', (newContacts) => {
  console.log('Received contacts update:', newContacts);
  contacts = newContacts;
  totalContactsEl.textContent = contacts.length;
  updateContactsList();
  updateContactSelect();
});

client.subscribe('communications', (newCommunications) => {
  communications = newCommunications;
  communicationsCountEl.textContent = communications.length;
  updateCommunicationsList();
});

client.subscribe('leads', (newLeads) => {
  leads = newLeads;
  leadsCountEl.textContent = leads.length;
});

client.subscribe('customers', (newCustomers) => {
  customers = newCustomers;
  customersCountEl.textContent = customers.length;
});

// UI update functions
const updateContactsList = () => {
  if (contacts.length === 0) {
    contactsListEl.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No contacts yet</div>';
    return;
  }

  // Calculate communications per contact
  const contactsWithComms = contacts.map(contact => ({
    ...contact,
    commCount: communications.filter(c => c.contactId === contact.id).length
  }));
  
  contactsListEl.innerHTML = contactsWithComms.map(contact => `
    <div class="contact-item">
      <div class="contact-name">${contact.name}</div>
      <div class="contact-meta">
        ${contact.email} • 
        <span class="contact-type type-${contact.type}">${contact.type}</span> • 
        ${contact.commCount} communications
        ${contact.type === 'lead' ? `
          <button class="promote-btn" onclick="promoteContact(${contact.id})">
            Promote to Customer
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
};

const updateCommunicationsList = () => {
  if (communications.length === 0) {
    communicationsListEl.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No communications yet</div>';
    return;
  }

  const recentComms = communications
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);
  
  communicationsListEl.innerHTML = recentComms.map(comm => {
    const contact = contacts.find(c => c.id === comm.contactId);
    const contactName = contact ? contact.name : 'Unknown Contact';
    const date = new Date(comm.timestamp).toLocaleString();
    const updatedText = comm.updatedAt ? ` (edited ${new Date(comm.updatedAt).toLocaleString()})` : '';
    
    return `
      <div class="comm-item" data-comm-id="${comm.id}">
        <div class="comm-header">
          ${contactName} • ${comm.type} • ${comm.direction} • ${date}${updatedText}
          <button class="edit-btn" onclick="editCommunication(${comm.id})">Edit</button>
          <button class="history-btn" onclick="showCommunicationHistory(${comm.id})">History</button>
        </div>
        <div class="comm-content" id="comm-content-${comm.id}">${comm.content}</div>
        <div class="comm-edit-form" id="comm-edit-${comm.id}" style="display: none;">
          <select id="edit-type-${comm.id}">
            <option value="email" ${comm.type === 'email' ? 'selected' : ''}>Email</option>
            <option value="call" ${comm.type === 'call' ? 'selected' : ''}>Call</option>
            <option value="meeting" ${comm.type === 'meeting' ? 'selected' : ''}>Meeting</option>
            <option value="note" ${comm.type === 'note' ? 'selected' : ''}>Note</option>
          </select>
          <select id="edit-direction-${comm.id}">
            <option value="outbound" ${comm.direction === 'outbound' ? 'selected' : ''}>Outbound</option>
            <option value="inbound" ${comm.direction === 'inbound' ? 'selected' : ''}>Inbound</option>
          </select>
          <textarea id="edit-content-${comm.id}" rows="3">${comm.content}</textarea>
          <div>
            <button onclick="saveCommunicationEdit(${comm.id})">Save</button>
            <button onclick="cancelCommunicationEdit(${comm.id})">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

const updateContactSelect = () => {
  const currentValue = commContactSelect.value;
  console.log('Updating contact select. Current value:', currentValue, 'Contacts:', contacts);
  
  commContactSelect.innerHTML = '<option value="">Select Contact</option>' + 
    contacts.map(contact => 
      `<option value="${contact.id}">${contact.name}</option>`
    ).join('');
  
  // Only restore the value if it still exists in the contacts list
  if (currentValue && contacts.some(c => c.id.toString() === currentValue)) {
    commContactSelect.value = currentValue;
    console.log('Restored select value:', currentValue);
  } else if (currentValue) {
    console.log('Could not restore value', currentValue, 'not found in contacts');
  }
};

// Form handlers
contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('contact-name').value;
  const email = document.getElementById('contact-email').value;
  const type = document.getElementById('contact-type').value;
  
  try {
    const result = await client.addContact(name, email, type);
    if (result.success) {
      showMessage(`Contact ${name} added successfully!`);
      contactForm.reset();
    } else {
      showMessage(result.error || 'Failed to add contact', 'error');
    }
  } catch (error) {
    showMessage('Network error: ' + error.message, 'error');
  }
});

commForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const contactIdValue = document.getElementById('comm-contact').value;
  const contactId = parseInt(contactIdValue);
  const type = document.getElementById('comm-type').value;
  const direction = document.getElementById('comm-direction').value;
  const content = document.getElementById('comm-content').value;
  
  console.log('Form submission - contactIdValue:', contactIdValue, 'contactId:', contactId);
  
  if (!contactIdValue || isNaN(contactId)) {
    showMessage('Please select a contact', 'error');
    return;
  }
  
  try {
    const result = await client.recordCommunication(contactId, type, content, direction);
    if (result.success) {
      showMessage('Communication recorded successfully!');
      commForm.reset();
    } else {
      showMessage(result.error || 'Failed to record communication', 'error');
    }
  } catch (error) {
    showMessage('Network error: ' + error.message, 'error');
  }
});

// Global functions
window.promoteContact = async (contactId) => {
  try {
    const result = await client.promoteContact(contactId);
    if (result.success) {
      showMessage('Contact promoted to customer!');
    } else {
      showMessage(result.error || 'Failed to promote contact', 'error');
    }
  } catch (error) {
    showMessage('Network error: ' + error.message, 'error');
  }
};

window.editCommunication = (commId) => {
  document.getElementById(`comm-content-${commId}`).style.display = 'none';
  document.getElementById(`comm-edit-${commId}`).style.display = 'block';
};

window.cancelCommunicationEdit = (commId) => {
  document.getElementById(`comm-content-${commId}`).style.display = 'block';
  document.getElementById(`comm-edit-${commId}`).style.display = 'none';
};

window.saveCommunicationEdit = async (commId) => {
  const type = document.getElementById(`edit-type-${commId}`).value;
  const direction = document.getElementById(`edit-direction-${commId}`).value;
  const content = document.getElementById(`edit-content-${commId}`).value;
  
  try {
    const result = await client.updateCommunication(commId, { type, direction, content });
    if (result.success) {
      showMessage('Communication updated successfully!');
      cancelCommunicationEdit(commId);
    } else {
      showMessage(result.error || 'Failed to update communication', 'error');
    }
  } catch (error) {
    showMessage('Network error: ' + error.message, 'error');
  }
};

window.showCommunicationHistory = async (commId) => {
  const modal = document.getElementById('history-modal');
  const content = document.getElementById('history-content');
  
  modal.style.display = 'block';
  content.innerHTML = 'Loading...';
  
  try {
    const result = await client.getCommunicationHistory(commId);
    if (result.events) {
      content.innerHTML = result.events.map(event => {
        const date = new Date(event.timestamp).toLocaleString();
        let description = '';
        
        if (event.type === 'COMMUNICATION_RECORDED') {
          description = `Created: ${event.payload.type} ${event.payload.direction}`;
        } else if (event.type === 'COMMUNICATION_UPDATED') {
          const prev = event.payload.previousContent;
          const updates = event.payload.updates;
          description = `Updated: ${Object.keys(updates).join(', ')}`;
          if (prev.content !== updates.content) {
            description += `<br><small>Previous: "${prev.content}"</small>`;
          }
        }
        
        return `
          <div style="padding: 10px; border-bottom: 1px solid #eee;">
            <strong>${date}</strong><br>
            ${description}
          </div>
        `;
      }).join('');
    } else {
      content.innerHTML = 'No history found';
    }
  } catch (error) {
    content.innerHTML = 'Error loading history: ' + error.message;
  }
};

window.closeHistoryModal = () => {
  document.getElementById('history-modal').style.display = 'none';
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  client.connect();
});

// Reconnect on page visibility change
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && client.connectionStatus === 'disconnected') {
    client.connect();
  }
});