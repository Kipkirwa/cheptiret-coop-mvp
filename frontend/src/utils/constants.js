export const API_BASE_URL = process.env.REACT_APP_API_URL;

export const APP_NAME = process.env.REACT_APP_APP_NAME || 'Cheptiret Farmers Cooperative';
export const APP_VERSION = '1.0.0';

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  ROLE: 'role'
};

export const ROLES = {
  FARMER: 'farmer',
  TRANSPORTER: 'transporter',
  ADMIN: 'admin'
};

export const ENDPOINTS = {
  FARMER_LOGIN: '/auth/farmer-login',
  TRANSPORTER_LOGIN: '/auth/token',
  VERIFY_TOKEN: '/auth/verify',
  
  FARMERS: '/farmers',
  FARMER_BY_ID: (id) => `/farmers/${id}`,
  
  COLLECTIONS: '/collections',
  TODAY_COLLECTIONS: '/collections/today',
  FARMER_COLLECTIONS: (farmerId) => `/collections/farmer/${farmerId}`,
  RECORD_COLLECTION: '/collections/record',
  
  CURRENT_PRICE: '/prices/current',
  UPDATE_PRICE: '/prices/update',
  
  FARMER_STATS: '/admin/farmer-stats',
  COLLECTION_REPORT: '/admin/reports/collections',
  PAYMENT_REPORT: '/admin/reports/payments'
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
};

export const VALIDATION = {
  MIN_LITERS: 0.1,
  MAX_LITERS: 100,
  PHONE_REGEX: /^(254|0)[71][0-9]{8}$/,
  FARMER_ID_REGEX: /^CPT-[0-9]{4}$/,
  PIN_LENGTH: 4,
  MIN_PASSWORD_LENGTH: 6
};

export const COLLECTION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected'
};

export const TIMEOUTS = {
  API_REQUEST: 30000,
  NOTIFICATION: 5000,
  SESSION: 3600000
};

export const MESSAGES = {
  LOGIN_SUCCESS: 'Login successful! Redirecting...',
  RECORD_SAVED: 'Milk collection recorded successfully',
  PRICE_UPDATED: 'Milk price updated successfully',
  
  LOGIN_FAILED: 'Login failed. Please check your credentials',
  NETWORK_ERROR: 'Network error. Please check your internet connection',
  SERVER_ERROR: 'Server error. Please try again later',
  SESSION_EXPIRED: 'Your session has expired. Please login again',
  
  INVALID_PHONE: 'Please enter a valid phone number (e.g., 0712345678)',
  INVALID_FARMER_ID: 'Please enter a valid farmer ID (e.g., CPT-0001)',
  INVALID_LITERS: `Liters must be between ${VALIDATION.MIN_LITERS} and ${VALIDATION.MAX_LITERS}`,
  PIN_REQUIRED: 'PIN must be 4 digits',
  
  NO_RECORDS: 'No records found',
  LOADING: 'Loading...',
  OFFLINE: 'You are offline. Records will be saved locally'
};