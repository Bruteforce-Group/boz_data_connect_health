/**
 * Setup API-based monitoring for network devices
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const UnifiController = require('./unifi-controller');
const OPNsenseApi = require('./opnsense-api');

// Check if config.js exists, if not, alert the user
const configPath = path.join(__dirname, 'config.js');
if (!fs.existsSync(configPath)) {
  console.error('Error: config.js not found!');
  console.log('Please copy config-template.js to config.js and fill in your credentials.');
  console.log(`cp ${path.join(__dirname, 'config-template.js')} ${configPath}`);
  process.exit(1);
}

// Load configuration
const config = require('./config');

async function setupUnifiMonitoring() {
  if (!config.unifi || !config.unifi.enabled) {
    console.log('UniFi monitoring is disabled in config.js');
    return;
  }

  try {
    console.log('Setting up UniFi/UDM Pro monitoring...');
    const unifi = new UnifiController(config.unifi);
    
    // Test connection by logging in
    await unifi.login();
    console.log('✅ UniFi login successful');
    
    // Add API-monitored resources
    const resources = [];
    
    // 1. UDM Pro System Health
    resources.push({
      name: 'UDM Pro - System Health',
      type: 'api',
      apiType: 'unifi',
      endpoint: 'health',
      checkInterval: 60, // Check every 60 seconds
      description: 'Overall UDM Pro system health and status'
    });

    // 2. UDM Pro - Connected Clients
    resources.push({
      name: 'UDM Pro - Client Connections',
      type: 'api',
      apiType: 'unifi',
      endpoint: 'clients',
      checkInterval: 120, // Check every 2 minutes
      description: 'Client devices connected to the UDM Pro'
    });
    
    // 3. UDM Pro - WAN Status
    resources.push({
      name: 'UDM Pro - WAN Interface',
      type: 'api',
      apiType: 'unifi',
      endpoint: 'wan',
      checkInterval: 30, // Check every 30 seconds
      description: 'WAN interface status and throughput'
    });
    
    // Get VLAN networks
    const vlans = await unifi.getVlans();
    console.log(`Found ${vlans.length} VLANs`);
    
    // Add each VLAN as a monitored resource
    for (const vlan of vlans) {
      resources.push({
        name: `UDM Pro - VLAN ${vlan.vlan} (${vlan.name})`,
        type: 'api',
        apiType: 'unifi',
        endpoint: 'vlan',
        vlanId: vlan.vlan,
        checkInterval: 60,
        description: `VLAN ${vlan.vlan} network status and clients`
      });
    }
    
    // Add resources to the monitoring system
    console.log(`Adding ${resources.length} UniFi monitored resources...`);
    for (const resource of resources) {
      try {
        // This would normally add to your database or state
        // For now we'll just print them
        console.log(`Would add: ${resource.name}`);
        
        // For the purposes of our demo app, let's add them as standard ping/HTTP resources
        // In a real implementation, we'd create a custom API resource type
        let monitorableResource;
        
        if (resource.endpoint === 'wan') {
          // WAN monitoring
          monitorableResource = {
            name: resource.name,
            url: 'https://1.1.1.1', // Check internet connectivity
            type: 'external',
            description: resource.description
          };
        } else if (resource.endpoint === 'vlan' && resource.vlanId) {
          // VLAN monitoring
          monitorableResource = {
            name: resource.name,
            host: `192.168.${resource.vlanId}.1`, // Assuming standard VLAN IP scheme
            type: 'internal',
            description: resource.description
          };
        }
        
        if (monitorableResource) {
          const response = await axios.post('http://localhost:5050/api/resources', monitorableResource);
          console.log(`Added ${monitorableResource.name}:`, response.data);
        }
      } catch (err) {
        console.error(`Failed to add resource ${resource.name}:`, err.message);
      }
    }
    
  } catch (error) {
    console.error('Error setting up UniFi monitoring:', error.message);
  }
}

async function setupOPNsenseMonitoring() {
  if (!config.opnsense || !config.opnsense.enabled) {
    console.log('OPNsense monitoring is disabled in config.js');
    return;
  }

  try {
    console.log('Setting up OPNsense monitoring...');
    const opnsense = new OPNsenseApi(config.opnsense);
    
    // Test connection
    const systemInfo = await opnsense.getSystemInfo();
    console.log('✅ OPNsense connection successful');
    console.log(`Connected to OPNsense version: ${systemInfo.product_version}`);
    
    // Add API-monitored resources
    const resources = [];
    
    // 1. OPNsense System Health
    resources.push({
      name: 'OPNsense - System Health',
      type: 'api',
      apiType: 'opnsense',
      endpoint: 'health',
      checkInterval: 60,
      description: 'OPNsense system health metrics'
    });
    
    // 2. OPNsense Gateway Status
    resources.push({
      name: 'OPNsense - Gateway Status',
      type: 'api',
      apiType: 'opnsense',
      endpoint: 'gateway',
      checkInterval: 30,
      description: 'Internet gateway status and metrics'
    });
    
    // 3. OPNsense - Firewall Status
    resources.push({
      name: 'OPNsense - Firewall Rules',
      type: 'api',
      apiType: 'opnsense',
      endpoint: 'firewall',
      checkInterval: 300, // Every 5 minutes
      description: 'Firewall rules status and activity'
    });
    
    // Get interface information
    const interfaces = await opnsense.getInterfaceStatus();
    console.log(`Found ${Object.keys(interfaces).length} interfaces`);
    
    // Add each interface as a monitored resource
    for (const [ifName, ifData] of Object.entries(interfaces)) {
      resources.push({
        name: `OPNsense - Interface ${ifName}`,
        type: 'api',
        apiType: 'opnsense',
        endpoint: 'interface',
        interfaceName: ifName,
        checkInterval: 60,
        description: `Network interface ${ifName} status and metrics`
      });
    }
    
    // Add resources to the monitoring system
    console.log(`Adding ${resources.length} OPNsense monitored resources...`);
    for (const resource of resources) {
      try {
        // This would normally add to your database or state
        // For now we'll just print them
        console.log(`Would add: ${resource.name}`);
        
        // For the purposes of our demo app, let's add them as standard ping/HTTP resources
        // In a real implementation, we'd create a custom API resource type
        let monitorableResource;
        
        if (resource.endpoint === 'gateway') {
          // Gateway/WAN monitoring
          monitorableResource = {
            name: resource.name,
            url: 'https://8.8.8.8', // Check internet connectivity via Google DNS
            type: 'external',
            description: resource.description
          };
        } else if (resource.endpoint === 'interface' && resource.interfaceName) {
          // Interface monitoring - assuming the OPNsense is reachable
          monitorableResource = {
            name: resource.name,
            host: '192.168.254.1', // OPNsense main IP
            type: 'internal',
            description: resource.description
          };
        } else if (resource.endpoint === 'health') {
          // System health monitoring
          monitorableResource = {
            name: resource.name,
            host: '192.168.254.1', // OPNsense main IP
            type: 'internal',
            description: resource.description
          };
        }
        
        if (monitorableResource) {
          const response = await axios.post('http://localhost:5050/api/resources', monitorableResource);
          console.log(`Added ${monitorableResource.name}:`, response.data);
        }
      } catch (err) {
        console.error(`Failed to add resource ${resource.name}:`, err.message);
      }
    }
    
  } catch (error) {
    console.error('Error setting up OPNsense monitoring:', error.message);
  }
}

async function main() {
  try {
    await setupUnifiMonitoring();
    await setupOPNsenseMonitoring();
    console.log('\nAll monitoring setup complete!');
    
    console.log('\nTo fully implement API-based monitoring:');
    console.log('1. Update the server.js file to add a new resource type: "api"');
    console.log('2. Implement the API check logic in the /api/resources endpoint');
    console.log('3. Display API metrics in the UI');
  } catch (error) {
    console.error('Error in setup:', error);
  }
}

main();