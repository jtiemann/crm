const {
  contactsStream,
  communicationsStream,
  leadsStream,
  customersStream,
  recentCommunicationsStream,
  contactActivityStream,
  addNewContact,
  recordNewCommunication,
  promoteLeadToCustomer
} = require('./crm-streams');

// Set up reactive logging
leadsStream.subscribe(leads => 
  console.log(`📝 Leads updated: ${leads.length} total`)
);

customersStream.subscribe(customers => 
  console.log(`💰 Customers updated: ${customers.length} total`)
);

recentCommunicationsStream.subscribe(recent => 
  console.log(`💬 Recent communications: ${recent.length}`)
);

// Demo usage
console.log('🚀 Starting CRM demo...\n');

// Add some contacts
const john = addNewContact('John Doe', 'john@example.com', 'lead');
const jane = addNewContact('Jane Smith', 'jane@example.com', 'lead');
const bob = addNewContact('Bob Johnson', 'bob@example.com', 'customer');

// Record communications
recordNewCommunication(john.id, 'email', 'Initial outreach email', 'outbound');
recordNewCommunication(john.id, 'call', 'Follow-up call, interested in demo', 'inbound');
recordNewCommunication(jane.id, 'email', 'Pricing inquiry', 'inbound');
recordNewCommunication(bob.id, 'meeting', 'Quarterly business review', 'outbound');

// Promote lead to customer
console.log('\n📈 Promoting John to customer...');
promoteLeadToCustomer(john.id);

// Show current state
console.log('\n📊 Current CRM state:');
console.log('All contacts:', contactsStream.get().map(c => `${c.name} (${c.type})`));
console.log('Contact activities:', 
  contactActivityStream.get().map(c => 
    `${c.name}: ${c.communications.length} communications`
  )
);

module.exports = {
  // Export for interactive use
  contactsStream,
  communicationsStream,
  addNewContact,
  recordNewCommunication,
  promoteLeadToCustomer
};