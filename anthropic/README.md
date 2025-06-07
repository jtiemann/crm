# Functional CRM Application

A reactive, event-sourced Customer Relationship Management (CRM) application built with Node.js, featuring real-time updates, persistence, and a functional programming approach.

## 🚀 Features

- **Event-Driven Architecture**: All state changes are captured as immutable events for complete audit trails
- **Reactive Streams**: Real-time data flow using custom observable streams
- **Persistent Storage**: Event sourcing with JSON file persistence
- **Web Interface**: Modern HTML5 UI with Server-Sent Events for live updates
- **RESTful API**: Complete HTTP API for programmatic access
- **Functional Design**: Pure functions, immutable data structures, and stream transformations

## 📋 Core Functionality

### Contact Management
- Add contacts (leads and customers)
- Update contact information
- Promote leads to customers
- Filter contacts by type

### Communication Tracking
- Record various communication types (email, call, meeting, note)
- Track communication direction (inbound/outbound)
- Edit existing communications with audit trail
- View communication history per contact

### Real-Time Updates
- Live dashboard statistics
- Automatic UI updates via Server-Sent Events
- Reactive data streams with automatic derivations

## 🏗️ Architecture

### Core Components

#### Streams (`streams.js`)
Custom observable implementation with:
- Subscription management
- Stream transformations (map, filter, merge)
- Reactive data flow

#### Event Store (`event-store.js`)
Event sourcing system featuring:
- Immutable event storage
- JSON persistence
- State reconstruction from events
- Event type definitions and creators

#### CRM Core (`crm-core.js`)
Pure functional business logic:
- Contact and communication factories
- Immutable state transformations
- Stream creation and management

#### Persistent CRM (`persistent-crm.js`)
Main application class combining:
- Event store integration
- Stream-based state management
- Async persistence operations

### Web Application

#### Server (`server.js`)
Express.js server providing:
- RESTful API endpoints
- Static file serving
- Server-Sent Events for real-time updates
- Error handling and validation

#### Web UI (`ui-connected.html`, `ui-connected.js`)
Modern web interface with:
- Responsive design
- Real-time data synchronization
- Form validation
- Modal dialogs for detailed views

## 🚦 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd functional-crm
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3001/ui-connected.html
```

## 📖 Usage

### Web Interface
- **Add Contacts**: Use the form to create new leads or customers
- **Record Communications**: Select a contact and add communication records
- **Promote Leads**: Convert leads to customers with one click
- **Edit Communications**: Modify existing communications (maintains audit trail)
- **View History**: Click history buttons to see event timelines

### API Endpoints

#### Contacts
```http
GET    /api/state           # Get complete application state
POST   /api/contacts        # Create new contact
PUT    /api/contacts/:id/promote  # Promote lead to customer
```

#### Communications
```http
POST   /api/communications  # Record new communication
PUT    /api/communications/:id     # Update communication
GET    /api/communications/:id/history  # Get communication history
```

#### Real-time Updates
```http
GET    /api/stream          # Server-Sent Events stream
GET    /api/events          # Get event history
```

### Example API Usage

**Create a contact:**
```bash
curl -X POST http://localhost:3001/api/contacts \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "type": "lead"}'
```

**Record communication:**
```bash
curl -X POST http://localhost:3001/api/communications \
  -H "Content-Type: application/json" \
  -d '{"contactId": 1, "type": "email", "content": "Initial outreach", "direction": "outbound"}'
```

## 🧪 Example Applications

The repository includes several example files demonstrating different aspects:

- `crm-example.js` - Basic usage with reactive logging
- `persistent-demo.js` - Event sourcing demonstration
- `ui-app.js` - Simple UI integration example

Run examples:
```bash
node crm-example.js
node persistent-demo.js
```

## 🗃️ Data Persistence

The application uses event sourcing for persistence:

- **Events File**: `web-crm-events.json` (created automatically)
- **Event Types**: Contact added/updated, Communication recorded/updated
- **State Reconstruction**: Application rebuilds state from events on startup
- **Audit Trail**: Complete history of all changes preserved

## 🔧 Development

### Project Structure
```
├── package.json           # Dependencies and scripts
├── server.js             # Express server and API
├── crm-core.js           # Core business logic
├── crm-streams.js        # Stream management layer
├── event-store.js        # Event sourcing implementation
├── persistent-crm.js     # Main CRM class
├── streams.js            # Observable stream implementation
├── counter.js            # ID generation utility
├── ui-connected.html     # Web interface
├── ui-connected.js       # Frontend JavaScript
└── README.md            # This file
```

### Key Design Principles

1. **Functional Programming**: Pure functions, immutable data, and composable operations
2. **Event Sourcing**: All changes captured as events for complete auditability
3. **Reactive Streams**: Data flows through observable streams with automatic updates
4. **Separation of Concerns**: Clear boundaries between data, business logic, and presentation

### Available Scripts
- `npm start` - Start the web server
- `npm run dev` - Start in development mode (same as start)

## 🔍 Monitoring and Debugging

- Console logging for all major operations
- Event history available via `/api/events`
- Real-time connection status in web UI
- Error handling with user-friendly messages

## 🤝 Contributing

This application demonstrates functional programming and event sourcing patterns in Node.js. Feel free to extend it with additional features like:

- User authentication
- Advanced filtering and search
- Data export capabilities
- Integration with external services
- Advanced analytics and reporting

## 📄 License

This project is provided as an educational example of functional programming and event sourcing patterns in JavaScript.