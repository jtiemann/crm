// DOM elements
const totalContactsEl = document.getElementById('total-contacts');
const leadsCountEl = document.getElementById('leads-count');
const customersCountEl = document.getElementById('customers-count');
const communicationsCountEl = document.getElementById('communications-count');
const contactsListEl = document.getElementById('contacts-list');
const communicationsListEl = document.getElementById('communications-list');
const contactForm = document.getElementById('contact-form');
const commForm = document.getElementById('comm-form');
const commContactSelect = document.getElementById('comm-contact');

// Subscribe to streams for reactive UI updates
contactsStream.subscribe(contacts => {
  totalContactsEl.textContent = contacts.length;
  updateContactsList(contacts);
  updateContactSelect(contacts);
});

leadsStream.subscribe(leads => {
  leadsCountEl.textContent = leads.length;
});

customersStream.subscribe(customers => {
  customersCountEl.textContent = customers.length;
});

communicationsStream.subscribe(communications => {
  communicationsCountEl.textContent = communications.length;
});

recentCommunicationsStream.subscribe(communications => {
  updateCommunicationsList(communications);
});

// UI update functions
const updateContactsList = (contacts) => {
  if (contacts.length === 0) {
    contactsListEl.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No contacts yet</div>';
    return;
  }

  const contactsWithComms = contactActivityStream.get() || contacts.map(c => ({ ...c, communications: [] }));
  
  contactsListEl.innerHTML = contactsWithComms.map(contact => `
    <div class="contact-item">
      <div class="contact-name">${contact.name}</div>
      <div class="contact-meta">
        ${contact.email} • 
        <span class="contact-type type-${contact.type}">${contact.type}</span> • 
        ${contact.communications.length} communications
        ${contact.type === 'lead' ? `
          <button class="promote-btn" onclick="promoteLeadToCustomer(${contact.id})">
            Promote to Customer
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
};

const updateCommunicationsList = (communications) => {
  if (communications.length === 0) {
    communicationsListEl.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No communications yet</div>';
    return;
  }

  const contacts = contactsStream.get() || [];
  
  communicationsListEl.innerHTML = communications.map(comm => {
    const contact = contacts.find(c => c.id === comm.contactId);
    const contactName = contact ? contact.name : 'Unknown Contact';
    const date = new Date(comm.timestamp).toLocaleString();
    
    return `
      <div class="comm-item">
        <div class="comm-header">
          ${contactName} • ${comm.type} • ${comm.direction} • ${date}
        </div>
        <div class="comm-content">${comm.content}</div>
      </div>
    `;
  }).join('');
};

const updateContactSelect = (contacts) => {
  const currentValue = commContactSelect.value;
  commContactSelect.innerHTML = '<option value="">Select Contact</option>' + 
    contacts.map(contact => 
      `<option value="${contact.id}">${contact.name}</option>`
    ).join('');
  commContactSelect.value = currentValue;
};

// Form handlers
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const name = document.getElementById('contact-name').value;
  const email = document.getElementById('contact-email').value;
  const type = document.getElementById('contact-type').value;
  
  addNewContact(name, email, type);
  
  // Reset form
  contactForm.reset();
});

commForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const contactId = parseInt(document.getElementById('comm-contact').value);
  const type = document.getElementById('comm-type').value;
  const direction = document.getElementById('comm-direction').value;
  const content = document.getElementById('comm-content').value;
  
  if (!contactId) {
    alert('Please select a contact');
    return;
  }
  
  recordNewCommunication(contactId, type, content, direction);
  
  // Reset form
  commForm.reset();
});

// Global function for promote button
window.promoteLeadToCustomer = promoteLeadToCustomer;

// Add some demo data
setTimeout(() => {
  addNewContact('Alice Johnson', 'alice@example.com', 'lead');
  addNewContact('Bob Smith', 'bob@example.com', 'customer');
  addNewContact('Carol Davis', 'carol@example.com', 'lead');
  
  // Add some communications
  setTimeout(() => {
    const contacts = contactsStream.get();
    if (contacts.length > 0) {
      recordNewCommunication(contacts[0].id, 'email', 'Initial outreach about our services', 'outbound');
      recordNewCommunication(contacts[1].id, 'call', 'Quarterly check-in call', 'outbound');
      recordNewCommunication(contacts[0].id, 'email', 'Responded with questions about pricing', 'inbound');
    }
  }, 100);
}, 100);