const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'DELETE'], // Allow these methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allow these headers
}));
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// Path to the resources data file
const DATA_DIR = path.join(__dirname, 'data');
const RESOURCES_FILE = path.join(DATA_DIR, 'resources.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default resources if no saved data exists
const defaultResources = [
  { id: 1, name: 'Google', url: 'https://www.google.com', type: 'external', history: [] },
  { id: 2, name: 'GitHub', url: 'https://github.com', type: 'external', history: [] },
  { id: 3, name: 'Local API', url: 'http://localhost:3001/api', type: 'internal', history: [] },
  { id: 4, name: 'Database Server', host: '127.0.0.1', type: 'internal', history: [] }
];

// Load resources from file or use defaults
let resources = [];
try {
  if (fs.existsSync(RESOURCES_FILE)) {
    const data = fs.readFileSync(RESOURCES_FILE, 'utf8');
    resources = JSON.parse(data);
    console.log(`Loaded ${resources.length} resources from ${RESOURCES_FILE}`);
  } else {
    resources = defaultResources;
    console.log('Using default resources (no saved data found)');
    // Save default resources to file
    fs.writeFileSync(RESOURCES_FILE, JSON.stringify(resources, null, 2));
  }
} catch (error) {
  console.error('Error loading resources:', error);
  resources = defaultResources;
}

// Function to save resources to file
const saveResources = () => {
  try {
    fs.writeFileSync(RESOURCES_FILE, JSON.stringify(resources, null, 2));
    console.log(`Saved ${resources.length} resources to ${RESOURCES_FILE}`);
  } catch (error) {
    console.error('Error saving resources:', error);
  }
};

// Maximum history entries to keep per resource
const MAX_HISTORY_LENGTH = 20;

// Helper function to ping internal resources
const pingHost = promisify(exec);

// Helper function to generate unique IDs
const generateId = () => {
  const maxId = resources.length > 0 ? Math.max(...resources.map(r => r.id)) : 0;
  return maxId + 1;
};

// Check status of all resources
app.get('/api/resources', async (req, res) => {
  try {
    const resourceResults = await Promise.all(
      resources.map(async (resource) => {
        let status = 'red';
        let latency = null;
        let message = '';
        const timestamp = new Date();

        try {
          if (resource.url) {
            // For resources with URLs
            const startTime = Date.now();
            const response = await axios.get(resource.url, { timeout: 5000 });
            const endTime = Date.now();
            latency = endTime - startTime;

            if (response.status >= 200 && response.status < 300) {
              status = latency > 500 ? 'orange' : 'green';
            }
          } else if (resource.host) {
            // For internal hosts using ping
            const startTime = Date.now();
            const { stdout } = await pingHost(`ping -c 1 ${resource.host}`);
            const endTime = Date.now();
            latency = endTime - startTime;

            if (stdout.includes('bytes from')) {
              status = latency > 200 ? 'orange' : 'green';
            }
          }
        } catch (error) {
          message = error.message;
          status = 'red';
        }

        // Find the resource in our resources array and update its history
        const resourceIndex = resources.findIndex(r => r.id === resource.id);
        if (resourceIndex !== -1) {
          // Add new status to history
          const historyEntry = {
            status,
            latency,
            timestamp: timestamp.toISOString(),
          };
          
          // Add to the beginning of the array to keep newest first
          resources[resourceIndex].history.unshift(historyEntry);
          
          // Trim history if it exceeds maximum length
          if (resources[resourceIndex].history.length > MAX_HISTORY_LENGTH) {
            resources[resourceIndex].history = resources[resourceIndex].history.slice(0, MAX_HISTORY_LENGTH);
          }
          
          // Save updated resources to file - but not on every check to reduce disk I/O
          // Instead, save every 10 minutes or when significant changes occur
          const now = Date.now();
          const TEN_MINUTES = 10 * 60 * 1000;
          
          if (!app.locals.lastSave || (now - app.locals.lastSave) > TEN_MINUTES) {
            saveResources();
            app.locals.lastSave = now;
          }
        }

        // Return resource with status and history
        return {
          ...resource,
          status,
          latency,
          message,
          timestamp: timestamp.toISOString()
        };
      })
    );

    res.json(resourceResults);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a new resource
app.post('/api/resources', (req, res) => {
  try {
    const newResource = req.body;
    
    // Validate required fields
    if (!newResource.name || (!newResource.url && !newResource.host) || !newResource.type) {
      return res.status(400).json({ 
        message: 'Missing required fields. Please provide name, url or host, and type.' 
      });
    }
    
    // Ensure type is valid
    if (!['external', 'internal'].includes(newResource.type)) {
      return res.status(400).json({ 
        message: 'Type must be either "external" or "internal".' 
      });
    }

    // Add ID and empty history to the new resource
    const resourceWithId = {
      ...newResource,
      id: generateId(),
      history: []
    };
    
    // Add to resources array
    resources.push(resourceWithId);
    
    // Save updated resources to file
    saveResources();
    
    res.status(201).json(resourceWithId);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a resource
app.delete('/api/resources/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if resource exists
    const resourceIndex = resources.findIndex(r => r.id === id);
    if (resourceIndex === -1) {
      return res.status(404).json({ message: `Resource with ID ${id} not found` });
    }
    
    // Remove from array
    resources = resources.filter(r => r.id !== id);
    
    // Save updated resources to file
    saveResources();
    
    res.json({ message: `Resource with ID ${id} deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});