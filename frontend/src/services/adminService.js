// Admin API service with absolute HTTPS URL
const API_URL = 'https://cheptiret-coop-mvp-backend-production.up.railway.app/api';

class AdminService {
  constructor() {
    this.baseURL = API_URL;
  }

  async getFarmers() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/farmers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch farmers: ${response.status}`);
    }
    return response.json();
  }

  async addFarmer(farmerData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/farmers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(farmerData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update farmer');
    }
    return response.json();
  }

  async deleteFarmer(farmerId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/farmers/${farmerId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete farmer: ${response.status}`);
    }
    return response.json();
  }

  async resetPin(farmerId, newPin) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/farmers/${farmerId}/reset-pin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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

const adminService = new AdminService();
export default adminService;
