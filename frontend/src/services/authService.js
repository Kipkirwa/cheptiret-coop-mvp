import api from './api';
import { ENDPOINTS, STORAGE_KEYS, ROLES } from '../utils/constants';
import { saveToStorage, removeFromStorage, getFromStorage } from '../utils/helpers';
 
class AuthService {
  async farmerLogin(phone, pin) {
  try {
    const response = await api.post('/auth/farmer-login', { phone, pin });
    const data = response.data;
    console.log('Farmer login API response:', data);

    if (!data?.access_token) {
      return { success: false, message: 'Invalid response from server' };
    }

    // Save token
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.access_token);

    // Create user object from the response
    const user = {
      phone: data.phone ?? phone,
      role: 'farmer',
      name: data.name ?? 'Farmer',
      farmer_id: data.farmer_id ?? phone,
      id: data.id ?? null,
      has_smartphone: data.has_smartphone ?? true,
    };

    // Save user and role
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.ROLE, 'farmer');

    console.log('✅ Farmer login successful. Role saved:', localStorage.getItem(STORAGE_KEYS.ROLE));
    console.log('Stored user:', user);

    return { success: true, user, token: data.access_token };

  } catch (error) {
    console.error('Farmer login error:', error);
    return {
      success: false,
      message:
        error.response?.data?.detail ||
        error.message ||
        'Login failed. Please check your phone and PIN.',
    };
  }
}
 
  async transporterLogin(username, password) {
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
 
      const response = await api.post('/auth/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
 
      const data = response.data;
      console.log('🔐 Transporter login API response:', data);
 
      if (!data?.access_token) {
        return { success: false, message: 'Invalid response from server' };
      }
 
      // Read role from backend response
      const role = data.role || 'transporter';
 
      // Save token first
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.access_token);
 
      // Create user object
      const user = {
        username: username,
        role: role,
        name: data.name ?? username,
        id: data.id ?? null,
      };
 
      // Save user and role
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.ROLE, role);
 
      console.log('✅ Transporter login successful. Role saved:', role);
      console.log('Stored user:', user);
      console.log('Verification - Role in storage:', localStorage.getItem(STORAGE_KEYS.ROLE));
 
      return { success: true, user, token: data.access_token };
 
    } catch (error) {
      console.error('Transporter login error:', error);
      return {
        success: false,
        message:
          error.response?.data?.detail ||
          error.message ||
          'Login failed. Please check your username and password.',
      };
    }
  }
 
  logout() {
    removeFromStorage(STORAGE_KEYS.TOKEN);
    removeFromStorage(STORAGE_KEYS.USER);
    removeFromStorage(STORAGE_KEYS.ROLE);
    window.location.href = '/login';
  }
 
  getCurrentUser() {
    return getFromStorage(STORAGE_KEYS.USER);
  }
 
  getUserRole() {
    const role = localStorage.getItem(STORAGE_KEYS.ROLE);
    console.log('📌 authService.getUserRole() returning:', role);
    return role;
  }
 
  isAuthenticated() {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  }
 
  isFarmer() {
    return this.getUserRole() === ROLES.FARMER;
  }
 
  isTransporter() {
    return this.getUserRole() === ROLES.TRANSPORTER;
  }
 
  isAdmin() {
    return this.getUserRole() === ROLES.ADMIN;
  }
 
  async verifyToken() {
    try {
      const response = await api.get(ENDPOINTS.VERIFY_TOKEN);
      const data = response.data;
 
      if (data?.user) {
        saveToStorage(STORAGE_KEYS.USER, data.user);
      }
 
      return { success: true, user: data?.user };
 
    } catch (error) {
      this.logout();
      return { success: false, message: error.message || 'Token verification failed' };
    }
  }
}
 
const authService = new AuthService();
export default authService;
