/**
 * Test script to verify connection to UDM Pro
 * 
 * Run this script to test if your UDM Pro credentials work
 */

const UnifiController = require('./unifi-controller');
const config = require('./config');

async function testUDMConnection() {
  console.log('Testing connection to UDM Pro...');
  
  // Check if password is set
  if (!config.unifi.password || config.unifi.password.trim() === '') {
    console.error('Error: UDM Pro password is not set');
    console.log('Please set the UNIFI_PASSWORD in your .env file');
    return;
  }
  
  try {
    console.log(`Connecting to UDM Pro at ${config.unifi.baseUrl}`);
    const unifi = new UnifiController(config.unifi);
    
    // Try logging in
    await unifi.login();
    console.log('✅ Login successful!');
    
    // If we got here, login was successful
    console.log('\nTesting API endpoints...');
    
    try {
      console.log('\nFetching device information...');
      const devices = await unifi.getDevices();
      console.log(`✅ Found ${devices.data.length} devices`);
      // Display the UDM Pro itself
      const udmPro = devices.data.find(d => 
        d.type === 'udm-pro' || d.model === 'UDM-Pro' || d.name === 'UDM-Pro'
      );
      
      if (udmPro) {
        console.log('UDM Pro details:');
        console.log(`  Model: ${udmPro.model}`);
        console.log(`  Firmware: ${udmPro.version}`);
        console.log(`  IP: ${udmPro.ip}`);
        console.log(`  Uptime: ${Math.floor(udmPro.uptime / 3600)} hours`);
      }
    } catch (error) {
      console.error('❌ Error fetching devices:', error.message);
    }
    
    try {
      console.log('\nFetching network information...');
      const networks = await unifi.getNetworks();
      console.log(`✅ Found ${networks.data.length} networks`);
      
      // Display VLANs
      const vlans = networks.data.filter(net => net.vlan_enabled);
      if (vlans.length > 0) {
        console.log('VLANs:');
        vlans.forEach(vlan => {
          console.log(`  VLAN ${vlan.vlan}: ${vlan.name} (${vlan.ip_subnet})`);
        });
      }
    } catch (error) {
      console.error('❌ Error fetching networks:', error.message);
    }
    
    try {
      console.log('\nFetching client information...');
      const clients = await unifi.getClients();
      console.log(`✅ Found ${clients.data.length} connected clients`);
    } catch (error) {
      console.error('❌ Error fetching clients:', error.message);
    }
    
    // Declare a variable to track if we found the UDM Pro
    let foundUdmPro = false;
    
    try {
      const devices = await unifi.getDevices();
      const udmPro = devices.data.find(d => 
        d.type === 'udm-pro' || d.model === 'UDM-Pro' || d.name === 'UDM-Pro'
      );
      foundUdmPro = !!udmPro;
    } catch (e) {
      // Ignore errors here
    }
    
    console.log('\nAPI connection test complete!');
    if (foundUdmPro) {
      console.log('UDM Pro API integration is working properly.');
    } else {
      console.log('API connection successful, but UDM Pro device not found or could not be identified.');
      console.log('This might be due to a different UniFi device or API structure.');
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Verify your UDM Pro IP address is correct in config.js');
    console.log('2. Ensure your username and password are correct');
    console.log('3. Check that your UDM Pro is reachable on the network');
    console.log('4. Try accessing the UDM Pro UI in your browser to verify it\'s online');
  }
}

// Run the test
testUDMConnection();