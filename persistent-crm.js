const {
  EventStore,
  EVENT_TYPES,
  createContactAddedEvent,
  createContactUpdatedEvent,
  createCommunicationRecordedEvent,
  createCommunicationUpdatedEvent,
  replayEvents
} = require('./event-store');

const {
  createContact,
  createCommunication,
  createContactStream,
  createCommunicationStream,
  getContactsByType
} = require('./crm-core');

class PersistentCRM {
  constructor(eventStorePath = './crm-events.json') {
    this.eventStore = new EventStore(eventStorePath);
    
    // Initialize streams
    this.contactsStream = createContactStream();
    this.communicationsStream = createCommunicationStream();
    
    // Derived streams
    this.leadsStream = this.contactsStream.map(contacts => 
      getContactsByType(contacts, 'lead')
    );
    
    this.customersStream = this.contactsStream.map(contacts => 
      getContactsByType(contacts, 'customer')
    );
    
    this.recentCommunicationsStream = this.communicationsStream.map(communications =>
      communications
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10)
    );
  }

  async initialize() {
    // Load events and rebuild state
    await this.eventStore.loadEvents();
    const events = this.eventStore.getEvents();
    const state = replayEvents(events);
    
    // Update streams with rebuilt state
    this.contactsStream.set(state.contacts);
    this.communicationsStream.set(state.communications);
    
    console.log(`📚 Loaded ${events.length} events, rebuilt state:`, {
      contacts: state.contacts.length,
      communications: state.communications.length
    });
    
    return state;
  }

  async addContact(name, email, type = 'lead') {
    // Create contact and event
    const contact = createContact(name, email, type);
    const event = createContactAddedEvent(contact);
    
    // Persist event
    await this.eventStore.appendEvent(event);
    
    // Update stream
    const currentContacts = this.contactsStream.get() || [];
    this.contactsStream.set([...currentContacts, contact]);
    
    console.log(`➕ Contact added: ${contact.name}`);
    return contact;
  }

  async updateContact(contactId, updates) {
    // Create and persist event
    const event = createContactUpdatedEvent(contactId, updates);
    await this.eventStore.appendEvent(event);
    
    // Update stream
    const currentContacts = this.contactsStream.get() || [];
    const updatedContacts = currentContacts.map(contact => 
      contact.id === contactId ? { ...contact, ...updates } : contact
    );
    this.contactsStream.set(updatedContacts);
    
    console.log(`📝 Contact updated: ID ${contactId}`, updates);
    return updates;
  }

  async recordCommunication(contactId, type, content, direction = 'outbound') {
    // Create communication and event
    const communication = createCommunication(contactId, type, content, direction);
    const event = createCommunicationRecordedEvent(communication);
    
    // Persist event
    await this.eventStore.appendEvent(event);
    
    // Update stream
    const currentComms = this.communicationsStream.get() || [];
    this.communicationsStream.set([...currentComms, communication]);
    
    console.log(`💬 Communication recorded: ${type} with contact ${contactId}`);
    return communication;
  }

  async promoteLeadToCustomer(contactId) {
    return this.updateContact(contactId, { type: 'customer' });
  }

  async updateCommunication(communicationId, updates) {
    // Get current communication for history tracking
    const currentComms = this.communicationsStream.get() || [];
    const currentComm = currentComms.find(c => c.id === communicationId);
    
    if (!currentComm) {
      throw new Error(`Communication with ID ${communicationId} not found`);
    }

    // Create and persist event with previous content for audit trail
    const event = createCommunicationUpdatedEvent(communicationId, updates, {
      type: currentComm.type,
      content: currentComm.content,
      direction: currentComm.direction
    });
    
    await this.eventStore.appendEvent(event);
    
    // Update stream
    const updatedComms = currentComms.map(comm => 
      comm.id === communicationId 
        ? { ...comm, ...updates, updatedAt: new Date().toISOString() }
        : comm
    );
    this.communicationsStream.set(updatedComms);
    
    console.log(`📝 Communication updated: ID ${communicationId}`, updates);
    return updates;
  }

  // Read-only access to streams
  getContactsStream() { return this.contactsStream; }
  getCommunicationsStream() { return this.communicationsStream; }
  getLeadsStream() { return this.leadsStream; }
  getCustomersStream() { return this.customersStream; }
  getRecentCommunicationsStream() { return this.recentCommunicationsStream; }

  // Event store access for debugging/analysis
  getEvents() { return this.eventStore.getEvents(); }
  getEventsByType(type) { return this.eventStore.getEventsByType(type); }
  
  async getEventHistory() {
    const events = this.eventStore.getEvents();
    return events.map(event => ({
      timestamp: event.timestamp,
      type: event.type,
      summary: this.getEventSummary(event)
    }));
  }

  getEventSummary(event) {
    switch (event.type) {
      case EVENT_TYPES.CONTACT_ADDED:
        return `Added contact: ${event.payload.name} (${event.payload.type})`;
      case EVENT_TYPES.CONTACT_UPDATED:
        return `Updated contact ID ${event.payload.contactId}`;
      case EVENT_TYPES.COMMUNICATION_RECORDED:
        return `${event.payload.type} communication with contact ${event.payload.contactId}`;
      case EVENT_TYPES.COMMUNICATION_UPDATED:
        return `Updated communication ID ${event.payload.communicationId}`;
      default:
        return 'Unknown event';
    }
  }
}

module.exports = { PersistentCRM, EVENT_TYPES };