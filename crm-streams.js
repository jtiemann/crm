const {
  createContact,
  createCommunication,
  createContactStream,
  createCommunicationStream,
  addContact,
  addCommunication,
  updateContact,
  getContactCommunications,
  getContactsByType
} = require('./crm-core');

// Main CRM streams
const contactsStream = createContactStream();
const communicationsStream = createCommunicationStream();

// Derived streams - auto-update when base data changes
const leadsStream = contactsStream.map(contacts => 
  getContactsByType(contacts, 'lead')
);

const customersStream = contactsStream.map(contacts => 
  getContactsByType(contacts, 'customer')
);

const recentCommunicationsStream = communicationsStream.map(communications =>
  communications
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10)
);

// Contact activity stream - combines contacts with their communications
const contactActivityStream = contactsStream.map(contacts => 
  contacts.map(contact => ({
    ...contact,
    communications: getContactCommunications(communicationsStream.get() || [], contact.id),
    lastCommunication: getContactCommunications(communicationsStream.get() || [], contact.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || null
  }))
);

// CRM actions that update streams
const addNewContact = (name, email, type) => {
  const contact = createContact(name, email, type);
  const currentContacts = contactsStream.get() || [];
  contactsStream.set(addContact(currentContacts, contact));
  return contact;
};

const recordNewCommunication = (contactId, type, content, direction) => {
  const communication = createCommunication(contactId, type, content, direction);
  const currentComms = communicationsStream.get() || [];
  communicationsStream.set(addCommunication(currentComms, communication));
  return communication;
};

const promoteLeadToCustomer = (contactId) => {
  const currentContacts = contactsStream.get() || [];
  contactsStream.set(updateContact(currentContacts, contactId, { type: 'customer' }));
};

module.exports = {
  // Streams
  contactsStream,
  communicationsStream,
  leadsStream,
  customersStream,
  recentCommunicationsStream,
  contactActivityStream,
  
  // Actions
  addNewContact,
  recordNewCommunication,
  promoteLeadToCustomer
};