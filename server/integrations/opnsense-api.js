/**
 * OPNsense API Integration
 * 
 * This module handles API requests to OPNsense firewall
 */

const axios = require('axios');
const https = require('https');

class OPNsenseApi {
  constructor(config) {
    this.baseUrl = config.baseUrl; // e.g. 'https://192.168.254.1'
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.httpsAgent = new https.Agent({ rejectUnauthorized: false }); // Ignore self-signed certificate errors
  }

  /**
   * Make an authenticated request to the OPNsense API
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const auth = {
        username: this.apiKey,
        password: this.apiSecret
      };
      
      const options = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        auth,
        headers: {
          'Content-Type': 'application/json'
        },
        httpsAgent: this.httpsAgent
      };
      
      if (data && (method === 'POST' || method === 'PUT')) {
        options.data = data;
      }
      
      const response = await axios(options);
      return response.data;
    } catch (error) {
      console.error(`OPNsense API request failed (${endpoint}):`, error.message);
      throw new Error(`OPNsense API request failed: ${error.message}`);
    }
  }

  /**
   * Get system information
   */
  async getSystemInfo() {
    return this.makeRequest('/api/core/system/info');
  }

  /**
   * Get system health data
   */
  async getSystemHealth() {
    return this.makeRequest('/api/diagnostics/system/health');
  }

  /**
   * Get interface status
   */
  async getInterfaceStatus() {
    return this.makeRequest('/api/diagnostics/interface/getInterfaceStatistics');
  }

  /**
   * Get gateway status
   */
  async getGatewayStatus() {
    return this.makeRequest('/api/routes/gateway/status');
  }

  /**
   * Get firewall status and information
   */
  async getFirewallInfo() {
    return this.makeRequest('/api/firewall/filter/searchRule');
  }

  /**
   * Get detailed interface configuration
   */
  async getInterfaceConfig() {
    return this.makeRequest('/api/interfaces/overview/index');
  }

  /**
   * Get traffic statistics
   */
  async getTrafficStats() {
    return this.makeRequest('/api/diagnostics/traffic/interface');
  }
}

module.exports = OPNsenseApi;