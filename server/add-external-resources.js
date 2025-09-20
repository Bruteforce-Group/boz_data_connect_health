const axios = require('axios');

async function addExternalResources() {
  try {
    const externalResources = [
      { name: 'Google', url: 'https://www.google.com' },
      { name: 'Cloudflare DNS', url: 'https://1.1.1.1' },
      { name: 'Amazon AWS', url: 'https://aws.amazon.com' },
      { name: 'Microsoft Azure', url: 'https://azure.microsoft.com' },
      { name: 'GitHub', url: 'https://github.com' },
      { name: 'NPM Registry', url: 'https://registry.npmjs.org' },
      { name: 'Stack Overflow', url: 'https://stackoverflow.com' },
      { name: 'Docker Hub', url: 'https://hub.docker.com' }
    ];

    // Get existing resources
    const existingResourcesResponse = await axios.get('http://localhost:5050/api/resources');
    const existingResources = existingResourcesResponse.data;
    
    console.log('Adding external resources...');
    
    for (const resource of externalResources) {
      // Format the resource with type
      const formattedResource = {
        name: resource.name,
        url: resource.url,
        type: 'external'
      };
      
      // Check if this resource already exists
      const resourceExists = existingResources.some(r => 
        r.name === formattedResource.name || 
        (r.url === formattedResource.url && r.type === formattedResource.type)
      );
      
      if (!resourceExists) {
        const response = await axios.post('http://localhost:5050/api/resources', formattedResource);
        console.log(`Added ${resource.name}:`, response.data);
      } else {
        console.log(`Resource ${resource.name} already exists, skipping`);
      }
    }

    console.log('Done adding external resources.');
  } catch (error) {
    console.error('Error adding resources:', error.response?.data || error.message);
  }
}

addExternalResources();