const fs = require('fs').promises;
const path = require('path');

// Event types
const EVENT_TYPES = {
  CONTACT_ADDED: 'CONTACT_ADDED',
  CONTACT_UPDATED: 'CONTACT_UPDATED',
  COMMUNICATION_RECORDED: 'COMMUNICATION_RECORDED',
  COMMUNICATION_UPDATED: 'COMMUNICATION_UPDATED'
};

// Event creators (pure functions)
const createEvent = (type, payload, metadata = {}) => ({
  id: Date.now() + Math.random(), // Simple ID for demo
  type,
  payload,
  timestamp: new Date().toISOString(),
  version: 1,
  metadata
});

const createContactAddedEvent = (contact) => 
  createEvent(EVENT_TYPES.CONTACT_ADDED, contact);

const createContactUpdatedEvent = (contactId, updates) => 
  createEvent(EVENT_TYPES.CONTACT_UPDATED, { contactId, updates });

const createCommunicationRecordedEvent = (communication) => 
  createEvent(EVENT_TYPES.COMMUNICATION_RECORDED, communication);

const createCommunicationUpdatedEvent = (communicationId, updates, previousContent) => 
  createEvent(EVENT_TYPES.COMMUNICATION_UPDATED, { 
    communicationId, 
    updates, 
    previousContent 
  });

// Event store implementation
class EventStore {
  constructor(filePath = './events.json') {
    this.filePath = filePath;
    this.events = [];
  }

  async loadEvents() {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      this.events = JSON.parse(data);
      return this.events;
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.events = [];
        return this.events;
      }
      throw error;
    }
  }

  async appendEvent(event) {
    this.events.push(event);
    await this.saveEvents();
    return event;
  }

  async appendEvents(events) {
    this.events.push(...events);
    await this.saveEvents();
    return events;
  }

  async saveEvents() {
    await fs.writeFile(this.filePath, JSON.stringify(this.events, null, 2));
  }

  getEvents() {
    return [...this.events]; // Return immutable copy
  }

  getEventsByType(type) {
    return this.events.filter(event => event.type === type);
  }

  getEventsAfterTimestamp(timestamp) {
    return this.events.filter(event => new Date(event.timestamp) > new Date(timestamp));
  }
}

// State reconstruction from events (pure functions)
const applyContactAddedEvent = (state, event) => ({
  ...state,
  contacts: [...state.contacts, event.payload]
});

const applyContactUpdatedEvent = (state, event) => ({
  ...state,
  contacts: state.contacts.map(contact => 
    contact.id === event.payload.contactId 
      ? { ...contact, ...event.payload.updates }
      : contact
  )
});

const applyCommunicationRecordedEvent = (state, event) => ({
  ...state,
  communications: [...state.communications, event.payload]
});

const applyCommunicationUpdatedEvent = (state, event) => ({
  ...state,
  communications: state.communications.map(comm => 
    comm.id === event.payload.communicationId 
      ? { ...comm, ...event.payload.updates, updatedAt: event.timestamp }
      : comm
  )
});

// Event applier map
const eventAppliers = {
  [EVENT_TYPES.CONTACT_ADDED]: applyContactAddedEvent,
  [EVENT_TYPES.CONTACT_UPDATED]: applyContactUpdatedEvent,
  [EVENT_TYPES.COMMUNICATION_RECORDED]: applyCommunicationRecordedEvent,
  [EVENT_TYPES.COMMUNICATION_UPDATED]: applyCommunicationUpdatedEvent
};

// Reduce events to current state
const replayEvents = (events, initialState = { contacts: [], communications: [] }) => {
  return events.reduce((state, event) => {
    const applier = eventAppliers[event.type];
    return applier ? applier(state, event) : state;
  }, initialState);
};

module.exports = {
  EVENT_TYPES,
  EventStore,
  createEvent,
  createContactAddedEvent,
  createContactUpdatedEvent,
  createCommunicationRecordedEvent,
  createCommunicationUpdatedEvent,
  replayEvents,
  eventAppliers
};