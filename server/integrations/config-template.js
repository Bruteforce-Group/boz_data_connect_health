/**
 * API Integration Configuration Template
 * 
 * Copy this file to config.js and fill in your actual credentials
 */

module.exports = {
  // UniFi Controller Configuration
  unifi: {
    enabled: true,
    baseUrl: 'https://192.168.1.1:8443', // URL to your UDM Pro/UniFi Controller
    username: 'your-unifi-username',
    password: 'your-unifi-password',
    site: 'default' // Usually 'default' unless you have multiple sites
  },
  
  // OPNsense Configuration
  opnsense: {
    enabled: true,
    baseUrl: 'https://192.168.254.1', // URL to your OPNsense firewall
    apiKey: 'your-opnsense-api-key',
    apiSecret: 'your-opnsense-api-secret'
  }
};