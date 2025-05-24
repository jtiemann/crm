const { PersistentCRM } = require('./persistent-crm');

async function demo() {
  console.log('🚀 Starting Persistent CRM Demo\n');
  
  const crm = new PersistentCRM('./demo-events.json');
  
  // Initialize (loads existing events if any)
  await crm.initialize();
  
  // Set up reactive logging
  crm.getLeadsStream().subscribe(leads => 
    console.log(`📝 Leads: ${leads.length}`)
  );
  
  crm.getCustomersStream().subscribe(customers => 
    console.log(`💰 Customers: ${customers.length}`)
  );
  
  // Check if we have existing data
  const existingContacts = crm.getContactsStream().get();
  if (existingContacts.length > 0) {
    console.log('\n📊 Existing data found:');
    console.log('Contacts:', existingContacts.map(c => `${c.name} (${c.type})`));
    
    const history = await crm.getEventHistory();
    console.log('\n📚 Event History:');
    history.forEach(event => 
      console.log(`  ${event.timestamp}: ${event.summary}`)
    );
  } else {
    console.log('\n📝 No existing data, creating demo contacts...');
    
    // Add some contacts
    await crm.addContact('John Doe', 'john@example.com', 'lead');
    await crm.addContact('Jane Smith', 'jane@example.com', 'lead');
    await crm.addContact('Bob Wilson', 'bob@example.com', 'customer');
    
    // Record communications
    const contacts = crm.getContactsStream().get();
    await crm.recordCommunication(contacts[0].id, 'email', 'Initial outreach email', 'outbound');
    await crm.recordCommunication(contacts[0].id, 'call', 'Follow-up call, interested!', 'inbound');
    await crm.recordCommunication(contacts[1].id, 'email', 'Pricing inquiry', 'inbound');
    
    // Promote a lead
    console.log('\n📈 Promoting John to customer...');
    await crm.promoteLeadToCustomer(contacts[0].id);
  }
  
  // Show final state
  console.log('\n📊 Final State:');
  const finalContacts = crm.getContactsStream().get();
  const finalComms = crm.getCommunicationsStream().get();
  
  console.log('Contacts:', finalContacts.map(c => `${c.name} (${c.type})`));
  console.log(`Total Communications: ${finalComms.length}`);
  
  // Show event statistics
  const events = crm.getEvents();
  console.log(`\n📈 Event Store: ${events.length} total events`);
  
  console.log('\n✅ Demo complete! Run again to see persistence in action.');
}

// Handle errors gracefully
demo().catch(error => {
  console.error('❌ Demo failed:', error.message);
  process.exit(1);
});

module.exports = { demo };