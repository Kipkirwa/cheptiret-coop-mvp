export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  let cleaned = phone.toString().replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  return cleaned;
};

export const formatDate = (date, includeTime = false) => {
  if (!date) return '';
  
  const d = new Date(date);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' })
  };
  
  return d.toLocaleDateString('en-KE', options);
};

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Ksh 0.00';
  
  return `Ksh ${Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

export const formatLiters = (liters) => {
  if (liters === null || liters === undefined || isNaN(liters)) return '0.0 L';
  
  return `${Number(liters).toFixed(1)} L`;
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^(254|0)[71][0-9]{8}$/;
  return phoneRegex.test(phone);
};

export const isValidFarmerId = (farmerId) => {
  const farmerIdRegex = /^CPT-[0-9]{4}$/;
  return farmerIdRegex.test(farmerId);
};

export const isValidLiters = (liters) => {
  const num = Number(liters);
  return !isNaN(num) && num >= 0.1 && num <= 100;
};

export const calculateTotalLiters = (collections) => {
  if (!collections || !Array.isArray(collections) || !collections.length) return 0;
  
  return collections.reduce((sum, collection) => {
    const liters = Number(collection.liters) || 0;
    return sum + liters;
  }, 0);
};

export const calculatePayment = (liters, pricePerLiter) => {
  const l = Number(liters) || 0;
  const p = Number(pricePerLiter) || 0;
  return l * p;
};

export const groupCollectionsByDate = (collections) => {
  if (!collections || !Array.isArray(collections)) return {};
  
  return collections.reduce((groups, collection) => {
    const date = collection.collection_date || collection.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(collection);
    return groups;
  }, {});
};

export const getErrorMessage = (error) => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
};

export const getFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting from storage:', error);
    return null;
  }
};

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from storage:', error);
  }
};