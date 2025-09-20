# Resource Health Monitor

A simple monitoring tool that displays the health status of internal and external resources with visual indicators:
- 🟢 Green: Connection is good
- 🟠 Orange: Connection has high latency
- 🔴 Red: Cannot reach resource

## Features

- Real-time monitoring of internal and external resources
- Automatic refreshes every 30 seconds
- Manual refresh button for immediate status updates
- Add new resources directly from the UI
- Remove resources that are no longer needed
- Visual status indicators for quick assessment
- Separate views for internal and external resources
- Latency measurements for performance tracking

## Project Structure

```
.
├── client/             # React frontend
│   ├── public/
│   └── src/
│       ├── components/ # React components
│       └── App.js      # Main application
└── server/             # Express backend
    └── server.js       # API endpoints
```

## Running the Application

### Backend Server

```bash
cd server
npm install
npm start
```

The server will start on http://localhost:5050.

### Frontend Application

```bash
cd client
npm install
npm start
```

The client will start on http://localhost:3000.

## Managing Resources

### Adding Resources

You can add resources in three ways:

1. **From the UI**: Click the "+ Add Resource" button on the main interface and fill out the form.

2. **Using API Integrations**: We provide integration scripts for network devices:
   ```bash
   # For UDM Pro network devices and VLANs
   cd server
   node integrations/setup-vlan-monitoring.js
   
   # For external resources like Google, AWS, etc.
   node server/add-external-resources.js
   ```

3. **Directly in the server code**: Edit the `resources` array in `server/server.js`:
   ```javascript
   let resources = [
     { id: 1, name: 'Google', url: 'https://www.google.com', type: 'external' },
     // Add more resources here
   ];
   ```

### Resource Types

- **External Resources**: Websites, web APIs, or any external HTTP/HTTPS services
  - Required fields: `name`, `url`, `type: 'external'`

- **Internal Resources**: Local network services, databases, or servers
  - Required fields: `name`, `host`, `type: 'internal'`

### Removing Resources

Click the "Remove" button on any resource card to delete it from the monitor.

## Security

This application follows security best practices for handling credentials:

1. **Environment Variables**: All sensitive credentials are stored in `.env` files, not in code
2. **GitIgnore Protection**: The `.env` file is added to `.gitignore` to prevent accidental commits
3. **Template Provided**: An `.env.example` file is provided as a template

### Setting Up API Credentials

To set up API credentials for network device monitoring:

1. Copy the example environment file:
   ```bash
   cp server/.env.example server/.env
   ```

2. Edit the `.env` file with your credentials:
   ```
   # For UDM Pro / UniFi Network
   UNIFI_PASSWORD=your_password_here
   
   # For OPNsense (if using)
   OPNSENSE_API_KEY=your_api_key_here
   OPNSENSE_API_SECRET=your_api_secret_here
   ```

3. Test your configuration:
   ```bash
   node server/integrations/test-udm-connection.js
   ```