const express = require('express');
const path = require('path');
const { PersistentCRM } = require('./persistent-crm');

const app = express();
const port = 3001;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Initialize CRM
let crm;

const initializeCRM = async () => {
  crm = new PersistentCRM('./web-crm-events.json');
  await crm.initialize();
  console.log('📱 CRM initialized');
};

// API Routes
app.get('/api/state', (req, res) => {
  const contacts = crm.getContactsStream().get() || [];
  const communications = crm.getCommunicationsStream().get() || [];
  const leads = crm.getLeadsStream().get() || [];
  const customers = crm.getCustomersStream().get() || [];
  
  res.json({
    contacts,
    communications,
    leads,
    customers,
    stats: {
      totalContacts: contacts.length,
      leadsCount: leads.length,
      customersCount: customers.length,
      communicationsCount: communications.length
    }
  });
});

app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, type } = req.body;
    const contact = await crm.addContact(name, email, type);
    res.json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/communications', async (req, res) => {
  try {
    const { contactId, type, content, direction } = req.body;
    const communication = await crm.recordCommunication(
      parseInt(contactId), type, content, direction
    );
    res.json({ success: true, communication });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/contacts/:id/promote', async (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    await crm.promoteLeadToCustomer(contactId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/communications/:id', async (req, res) => {
  try {
    const communicationId = parseInt(req.params.id);
    const updates = req.body;
    await crm.updateCommunication(communicationId, updates);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/communications/:id/history', async (req, res) => {
  try {
    const communicationId = parseInt(req.params.id);
    const events = crm.getEvents();
    
    // Get all events related to this communication
    const commEvents = events.filter(event => 
      (event.type === 'COMMUNICATION_RECORDED' && event.payload.id === communicationId) ||
      (event.type === 'COMMUNICATION_UPDATED' && event.payload.communicationId === communicationId)
    );
    
    res.json({ events: commEvents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const history = await crm.getEventHistory();
    res.json({ events: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Server-Sent Events for real-time updates
app.get('/api/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const sendUpdate = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Subscribe to all streams
  const unsubscribeContacts = crm.getContactsStream().subscribe(contacts => {
    sendUpdate({ type: 'contacts', data: contacts });
  });

  const unsubscribeComms = crm.getCommunicationsStream().subscribe(communications => {
    sendUpdate({ type: 'communications', data: communications });
  });

  const unsubscribeLeads = crm.getLeadsStream().subscribe(leads => {
    sendUpdate({ type: 'leads', data: leads });
  });

  const unsubscribeCustomers = crm.getCustomersStream().subscribe(customers => {
    sendUpdate({ type: 'customers', data: customers });
  });

  // Send initial state
  sendUpdate({ 
    type: 'initial', 
    data: {
      contacts: crm.getContactsStream().get() || [],
      communications: crm.getCommunicationsStream().get() || [],
      leads: crm.getLeadsStream().get() || [],
      customers: crm.getCustomersStream().get() || []
    }
  });

  // Clean up on disconnect
  req.on('close', () => {
    unsubscribeContacts();
    unsubscribeComms();
    unsubscribeLeads();
    unsubscribeCustomers();
  });
});

// Start server
const startServer = async () => {
  await initializeCRM();
  
  app.listen(port, () => {
    console.log(`🚀 CRM Server running at http://localhost:${port}`);
    console.log(`📱 Open http://localhost:${port}/ui-connected.html in your browser`);
  });
};

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

module.exports = { app };