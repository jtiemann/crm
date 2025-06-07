// Browser-compatible stream implementation
const createStream = (initialValue = null) => {
  let value = initialValue;
  const observers = [];
  
  const stream = {
    get: () => value,
    set: (newValue) => {
      value = newValue;
      observers.forEach(observer => observer(value));
      return stream;
    },
    subscribe: (observer) => {
      observers.push(observer);
      if (value !== null) observer(value);
      return () => {
        const index = observers.indexOf(observer);
        if (index > -1) observers.splice(index, 1);
      };
    },
    map: (transform) => {
      const mapped = createStream();
      stream.subscribe(val => mapped.set(transform(val)));
      return mapped;
    },
    filter: (predicate) => {
      const filtered = createStream();
      stream.subscribe(val => {
        if (predicate(val)) filtered.set(val);
      });
      return filtered;
    }
  };
  
  return stream;
};

// Counter for IDs
let counter = 0;
const nextId = () => counter++;

// Data creators
const createContact = (name, email, type = 'lead') => ({
  id: nextId(),
  name,
  email,
  type,
  createdAt: new Date().toISOString(),
  tags: []
});

const createCommunication = (contactId, type, content, direction = 'outbound') => ({
  id: nextId(),
  contactId,
  type,
  content,
  direction,
  timestamp: new Date().toISOString()
});

// Pure functions
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

// Main streams
const contactsStream = createStream([]);
const communicationsStream = createStream([]);

// Derived streams
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

const contactActivityStream = contactsStream.map(contacts => 
  contacts.map(contact => ({
    ...contact,
    communications: getContactCommunications(communicationsStream.get() || [], contact.id),
    lastCommunication: getContactCommunications(communicationsStream.get() || [], contact.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || null
  }))
);

// Actions
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