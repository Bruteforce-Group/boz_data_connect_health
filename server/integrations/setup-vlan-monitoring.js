/**
 * Setup monitoring for VLANs detected from the UDM Pro
 */

const UnifiController = require('./unifi-controller');
const axios = require('axios');
const config = require('./config');

async function setupVlanMonitoring() {
  try {
    console.log('Setting up VLAN monitoring resources...');
    
    // Check if UniFi integration is enabled
    if (!config.unifi.enabled || !config.unifi.password) {
      console.error('UniFi integration is disabled or password not set in .env file');
      console.log('Please set UNIFI_ENABLED=true and UNIFI_PASSWORD in your .env file');
      return;
    }
    
    // Initialize UniFi controller
    const unifi = new UnifiController(config.unifi);
    
    // Login to UniFi controller
    await unifi.login();
    console.log('✅ Successfully logged in to UDM Pro');
    
    // Get VLAN networks
    const networks = await unifi.getNetworks();
    const vlans = networks.data.filter(net => net.vlan_enabled);
    
    if (vlans.length === 0) {
      console.log('No VLANs found on your UDM Pro');
      return;
    }
    
    console.log(`Found ${vlans.length} VLANs to monitor:`);
    for (const vlan of vlans) {
      console.log(`  VLAN ${vlan.vlan}: ${vlan.name} (${vlan.ip_subnet})`);
      
      // Extract subnet info
      const subnetParts = vlan.ip_subnet.split('/');
      const subnetIp = subnetParts[0];
      const ipParts = subnetIp.split('.');
      
      // Create monitoring resources for this VLAN
      try {
        // Add VLAN gateway monitoring
        const gatewayResource = {
          name: `VLAN ${vlan.vlan} - ${vlan.name} - Gateway`,
          host: subnetIp, // Gateway IP (e.g., 192.168.10.1)
          type: 'internal',
          description: `Gateway for VLAN ${vlan.vlan} (${vlan.name})`
        };
        
        // Check if this VLAN resource already exists
        const existingResources = await axios.get('http://localhost:5050/api/resources');
        const resourceExists = existingResources.data.some(r => 
          r.name === gatewayResource.name || 
          (r.host === gatewayResource.host && r.type === 'internal')
        );
        
        if (!resourceExists) {
          // Add the resource to the monitor
          const response = await axios.post('http://localhost:5050/api/resources', gatewayResource);
          console.log(`✅ Added ${gatewayResource.name}`);
        } else {
          console.log(`ℹ️ Resource ${gatewayResource.name} already exists, skipping`);
        }
        
      } catch (err) {
        console.error(`Failed to add VLAN ${vlan.vlan} resource:`, err.message);
      }
    }
    
    console.log('\nAll VLAN monitoring resources have been created.');
    console.log('You can view them in your monitoring dashboard.');
    
  } catch (error) {
    console.error('Error setting up VLAN monitoring:', error.message);
  }
}

// Run the script
setupVlanMonitoring();