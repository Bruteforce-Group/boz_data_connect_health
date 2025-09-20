const axios = require('axios');

async function addLocalResources() {
  try {
    // Define local resources
    const localResources = [
      {
        name: 'React Dev Server',
        url: 'http://localhost:3000',
        type: 'external'
      },
      {
        name: 'Express API Health',
        url: 'http://localhost:5050/health',
        type: 'external'
      }
    ];
    
    // Get existing resources
    const existingResourcesResponse = await axios.get('http://localhost:5050/api/resources');
    const existingResources = existingResourcesResponse.data;
    
    // Add each resource if it doesn't already exist
    for (const resource of localResources) {
      console.log(`Checking ${resource.name}...`);
      
      // Check if this resource already exists
      const resourceExists = existingResources.some(r => 
        r.name === resource.name || 
        (r.url === resource.url && r.type === resource.type)
      );
      
      if (!resourceExists) {
        const response = await axios.post('http://localhost:5050/api/resources', resource);
        console.log(`Added ${resource.name}:`, response.data);
      } else {
        console.log(`Resource ${resource.name} already exists, skipping`);
      }
    }

    console.log('Done adding resources.');
  } catch (error) {
    console.error('Error adding resources:', error.response?.data || error.message);
  }
}

addLocalResources();