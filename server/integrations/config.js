/**
 * API Integration Configuration
 * 
 * Loads credentials from environment variables for better security
 */

require('dotenv').config();

module.exports = {
  // UniFi Controller Configuration
  unifi: {
    enabled: process.env.UNIFI_ENABLED === 'true',
    baseUrl: process.env.UNIFI_URL || 'https://192.168.1.1',
    username: process.env.UNIFI_USERNAME || 'admin',
    password: process.env.UNIFI_PASSWORD || '',
    site: process.env.UNIFI_SITE || 'default'
  },
  
  // OPNsense Configuration
  opnsense: {
    enabled: process.env.OPNSENSE_ENABLED === 'true',
    baseUrl: process.env.OPNSENSE_URL || 'https://192.168.254.1',
    apiKey: process.env.OPNSENSE_API_KEY || '',
    apiSecret: process.env.OPNSENSE_API_SECRET || ''
  }
};