const { createStream } = require('./streams');
const { nextNumber } = require('./counter');

// Core data creators
const createContact = (name, email, type = 'lead') => ({
  id: nextNumber(),
  name,
  email,
  type,
  createdAt: new Date().toISOString(),
  tags: []
});

const createCommunication = (contactId, type, content, direction = 'outbound') => ({
  id: nextNumber(),
  contactId,
  type, // 'email', 'call', 'meeting', 'note'
  content,
  direction, // 'inbound', 'outbound'
  timestamp: new Date().toISOString()
});

// Stream factories
const createContactStream = () => createStream([]);
const createCommunicationStream = () => createStream([]);

// Pure transformation functions
const addContact = (contacts, contact) => [...contacts, contact];
const addCommunication = (communications, comm) => [...communications, comm];

const updateContact = (contacts, id, updates) =>
  contacts.map(contact => 
    contact.id === id ? { ...contact, ...updates } : contact
  );

const getContactCommunications = (communications, contactId) =>
  communications.filter(comm => comm.contactId === contactId);

const getContactsByType = (contacts, type) =>
  contacts.filter(contact => contact.type === type);

module.exports = {
  createContact,
  createCommunication,
  createContactStream,
  createCommunicationStream,
  addContact,
  addCommunication,
  updateContact,
  getContactCommunications,
  getContactsByType
};