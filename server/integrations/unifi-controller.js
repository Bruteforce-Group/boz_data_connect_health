/**
 * UniFi Controller API Integration for UDM Pro
 * 
 * This module handles authentication and data retrieval from a UniFi Controller
 */

const axios = require('axios');
const https = require('https');

class UnifiController {
  constructor(config) {
    this.baseUrl = config.baseUrl; // e.g. 'https://192.168.1.1:8443'
    this.username = config.username;
    this.password = config.password;
    this.site = config.site || 'default';
    this.httpsAgent = new https.Agent({ rejectUnauthorized: false }); // Ignore self-signed certificate errors
    this.cookies = null;
    this.lastLogin = null;
    this.loginExpiryMs = 60 * 60 * 1000; // 1 hour
  }

  async login() {
    try {
      // UDM Pro uses the Network Application API
      const response = await axios.post(
        `${this.baseUrl}/api/auth/login`,
        { username: this.username, password: this.password },
        { 
          headers: { 'Content-Type': 'application/json' },
          httpsAgent: this.httpsAgent,
          withCredentials: true
        }
      );
      
      // Store cookies for future requests
      this.cookies = response.headers['set-cookie'];
      this.lastLogin = Date.now();
      
      console.log('Successfully logged in to UDM Pro');
      return true;
    } catch (error) {
      console.error('UniFi login error:', error.message);
      
      // Try alternate login endpoint for newer UDM firmware
      try {
        console.log('Trying alternate login endpoint...');
        const altResponse = await axios.post(
          `${this.baseUrl}/api/login`,
          { username: this.username, password: this.password },
          { 
            headers: { 'Content-Type': 'application/json' },
            httpsAgent: this.httpsAgent,
            withCredentials: true
          }
        );
        
        // Store cookies for future requests
        this.cookies = altResponse.headers['set-cookie'];
        this.lastLogin = Date.now();
        
        console.log('Successfully logged in to UDM Pro using alternate endpoint');
        return true;
      } catch (altError) {
        console.error('Alternative login also failed:', altError.message);
        throw new Error(`UniFi login failed on both endpoints. Last error: ${altError.message}`);
      }
    }
  }

  async ensureLoggedIn() {
    const isExpired = !this.lastLogin || (Date.now() - this.lastLogin > this.loginExpiryMs);
    
    if (!this.cookies || isExpired) {
      await this.login();
    }
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    await this.ensureLoggedIn();
    
    try {
      const options = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          Cookie: this.cookies.join('; ')
        },
        httpsAgent: this.httpsAgent,
        withCredentials: true
      };
      
      if (data && (method === 'POST' || method === 'PUT')) {
        options.data = data;
      }
      
      const response = await axios(options);
      return response.data;
    } catch (error) {
      console.error(`UniFi API request failed (${endpoint}):`, error.message);
      throw new Error(`UniFi API request failed: ${error.message}`);
    }
  }

  // Get device information
  async getDevices() {
    try {
      // Try new API endpoint for UDM Pro
      return this.makeRequest(`/proxy/network/api/s/${this.site}/stat/device`);
    } catch (error) {
      console.log('Falling back to legacy endpoint for devices');
      return this.makeRequest(`/api/s/${this.site}/stat/device`);
    }
  }

  // Get UDM Pro health data
  async getHealth() {
    try {
      // Try new API endpoint for UDM Pro
      return this.makeRequest(`/proxy/network/api/s/${this.site}/stat/health`);
    } catch (error) {
      console.log('Falling back to legacy endpoint for health');
      return this.makeRequest(`/api/s/${this.site}/stat/health`);
    }
  }
  
  // Get network information
  async getNetworks() {
    try {
      // Try new API endpoint for UDM Pro
      return this.makeRequest(`/proxy/network/api/s/${this.site}/rest/networkconf`);
    } catch (error) {
      console.log('Falling back to legacy endpoint for networks');
      return this.makeRequest(`/api/s/${this.site}/rest/networkconf`);
    }
  }

  // Get clients connected to the network
  async getClients() {
    try {
      // Try new API endpoint for UDM Pro
      return this.makeRequest(`/proxy/network/api/s/${this.site}/stat/sta`);
    } catch (error) {
      console.log('Falling back to legacy endpoint for clients');
      return this.makeRequest(`/api/s/${this.site}/stat/sta`);
    }
  }

  // Get WAN status and throughput
  async getWanStatus() {
    // Get the UDM Pro device first
    const devices = await this.getDevices();
    const udmPro = devices.data.find(d => 
      d.type === 'udm-pro' || d.model === 'UDM-Pro' || d.name === 'UDM-Pro'
    );
    
    if (!udmPro) {
      throw new Error('UDM Pro device not found');
    }
    
    // Return WAN-related data
    const interfaces = udmPro.ethernet_table || [];
    const wanInterface = interfaces.find(i => i.name === 'wan' || i.name.includes('WAN'));
    
    return {
      wan: wanInterface || null,
      uptime: udmPro.uptime,
      status: udmPro.state,
      lastSeen: udmPro.last_seen,
      ip: udmPro.ip
    };
  }
  
  // Get all VLAN information
  async getVlans() {
    const networks = await this.getNetworks();
    return networks.data.filter(net => net.vlan_enabled);
  }
}

module.exports = UnifiController;