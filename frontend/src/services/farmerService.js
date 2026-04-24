// Dedicated farmer service with hardcoded production URL
const BACKEND_URL = 'https://cheptiret-coop-mvp-backend-production.up.railway.app/api';

class FarmerService {
  constructor() {
    this.baseURL = BACKEND_URL;
  }

  async getFarmers() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/farmers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async addFarmer(farmerData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/farmers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(farmerData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to add farmer');
    }
    return response.json();
  }

  async updateFarmer(farmerId, farmerData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/farmers/${farmerId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(farmerData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update farmer');
    }
    return response.json();
  }

  async resetPin(farmerId, newPin) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/farmers/${farmerId}/reset-pin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ new_pin: newPin })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to reset PIN');
    }
    return response.json();
  }
}

export default new FarmerService();
