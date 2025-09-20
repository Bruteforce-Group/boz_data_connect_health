const axios = require('axios');

async function addNetworkDevices() {
  try {
    // UDM Pro interfaces - Basic ping monitoring for now
    // For API access, we would need to add UniFi API integration
    const udmProInterfaces = [
      { name: 'UDM Pro - Main Interface', host: '192.168.1.1', type: 'internal' },
      { name: 'UDM Pro - VLAN 10 (IoT)', host: '192.168.10.1', type: 'internal' },
      { name: 'UDM Pro - VLAN 20 (Guest)', host: '192.168.20.1', type: 'internal' },
      { name: 'UDM Pro - VLAN 30 (Security)', host: '192.168.30.1', type: 'internal' },
      { name: 'UDM Pro - WAN Status', url: 'https://1.1.1.1', type: 'external' }
    ];

    // OPNSense interfaces - Basic ping monitoring for now
    // For API access, we would need to add OPNSense API integration
    const opnSenseInterfaces = [
      { name: 'OPNSense - Main Interface', host: '192.168.254.1', type: 'internal' },
      { name: 'OPNSense - WAN Status', url: 'https://8.8.8.8', type: 'external' }
    ];

    // Get existing resources
    const existingResourcesResponse = await axios.get('http://localhost:5050/api/resources');
    const existingResources = existingResourcesResponse.data;
    
    console.log('Adding UDM Pro interfaces...');
    for (const interface of udmProInterfaces) {
      // Check if this interface already exists
      const resourceExists = existingResources.some(r => 
        r.name === interface.name || 
        (interface.host && r.host === interface.host && r.type === interface.type) ||
        (interface.url && r.url === interface.url && r.type === interface.type)
      );
      
      if (!resourceExists) {
        const response = await axios.post('http://localhost:5050/api/resources', interface);
        console.log(`Added ${interface.name}:`, response.data);
      } else {
        console.log(`Resource ${interface.name} already exists, skipping`);
      }
    }

    console.log('Adding OPNSense interfaces...');
    for (const interface of opnSenseInterfaces) {
      // Check if this interface already exists
      const resourceExists = existingResources.some(r => 
        r.name === interface.name || 
        (interface.host && r.host === interface.host && r.type === interface.type) ||
        (interface.url && r.url === interface.url && r.type === interface.type)
      );
      
      if (!resourceExists) {
        const response = await axios.post('http://localhost:5050/api/resources', interface);
        console.log(`Added ${interface.name}:`, response.data);
      } else {
        console.log(`Resource ${interface.name} already exists, skipping`);
      }
    }

    console.log('Done adding network devices.');
    
    console.log('\nFor enhanced monitoring using APIs:');
    console.log('- UDM Pro: Requires UniFi Controller API credentials');
    console.log('- OPNSense: Requires API key and secret from the OPNSense dashboard');
    console.log('\nWould you like to configure API access for these devices?');
    
  } catch (error) {
    console.error('Error adding network devices:', error.response?.data || error.message);
  }
}

addNetworkDevices();