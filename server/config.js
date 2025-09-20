/**
 * Configuration for network device integrations
 */

// Load environment variables for sensitive information
const config = {
  unifi: {
    // Connection settings
    url: process.env.UNIFI_URL,
    username: process.env.UNIFI_USERNAME,
    password: process.env.UNIFI_PASSWORD,
    site: process.env.UNIFI_SITE || 'default',
    // Additional options
    options: {
      rejectUnauthorized: true, // Strict SSL validation
      timeout: 5000 // Connection timeout in milliseconds
    }
  },
  opnsense: {
    // Connection settings
    url: process.env.OPNSENSE_URL,
    apiKey: process.env.OPNSENSE_API_KEY,
    apiSecret: process.env.OPNSENSE_API_SECRET,
    // Additional options
    options: {
      rejectUnauthorized: true, // Strict SSL validation
      timeout: 5000 // Connection timeout in milliseconds
    }
  },
  // Add other configuration sections as needed
  logging: {
    level: 'info' // Options: 'error', 'warn', 'info', 'debug'
  }
};

// Validate required UniFi configuration
if (!config.unifi.url) {
  console.error('Error: UniFi URL is not set in environment variables');
  console.error('Please set the UNIFI_URL environment variable');
}
if (!config.unifi.username) {
  console.error('Error: UniFi username is not set in environment variables');
  console.error('Please set the UNIFI_USERNAME environment variable');
}
if (!config.unifi.password) {
  console.error('Error: UniFi password is not set in environment variables');
  console.error('Please set the UNIFI_PASSWORD environment variable');
}

// Validate required OPNsense configuration
if (!config.opnsense.url) {
  console.error('Error: OPNsense URL is not set in environment variables');
  console.error('Please set the OPNSENSE_URL environment variable');
}
if (!config.opnsense.apiKey) {
  console.error('Error: OPNsense API key is not set in environment variables');
  console.error('Please set the OPNSENSE_API_KEY environment variable');
}
if (!config.opnsense.apiSecret) {
  console.error('Error: OPNsense API secret is not set in environment variables');
  console.error('Please set the OPNSENSE_API_SECRET environment variable');
}

module.exports = config;

