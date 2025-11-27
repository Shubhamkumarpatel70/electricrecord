const TOKEN_KEY = 'electricity_token';
const USER_KEY = 'electricity_user';
const REFRESH_KEY = 'electricity_refresh';

/**
 * Store authentication data in localStorage
 * @param {string} token - JWT token
 * @param {Object} user - User object
 * @param {string} refreshToken - Optional refresh token
 */
export function storeAuth(token, user, refreshToken = null) {
  try {
    // Store token with expiration check
    const tokenData = {
      value: token,
      timestamp: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };
    
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData));
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    if (refreshToken) {
      localStorage.setItem(REFRESH_KEY, refreshToken);
    }
    
    // Set up token refresh timer
    setupTokenRefresh(tokenData.expiresAt);
    
  } catch (error) {
    console.error('Failed to store authentication data:', error);
    // Fallback to sessionStorage if localStorage fails
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (fallbackError) {
      console.error('Failed to store in sessionStorage as well:', fallbackError);
    }
  }
}

/**
 * Get stored JWT token
 * @returns {string|null} JWT token or null if not found/expired
 */
export function getToken() {
  try {
    const tokenData = localStorage.getItem(TOKEN_KEY);
    if (!tokenData) {
      // Check sessionStorage as fallback
      return sessionStorage.getItem(TOKEN_KEY);
    }
    
    const parsed = JSON.parse(tokenData);
    
    // Check if token is expired
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      console.warn('Token has expired, clearing authentication');
      clearAuth();
      return null;
    }
    
    return parsed.value;
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
}

/**
 * Get stored user data
 * @returns {Object|null} User object or null if not found
 */
export function getStoredUser() {
  try {
    const userData = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (!userData) return null;
    
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export function isAuthenticated() {
  const token = getToken();
  const user = getStoredUser();
  return !!(token && user);
}

/**
 * Check if user has admin role
 * @returns {boolean} True if admin, false otherwise
 */
export function isAdmin() {
  const user = getStoredUser();
  return user && user.role === 'admin';
}

/**
 * Check if token is about to expire (within 1 hour)
 * @returns {boolean} True if token expires soon, false otherwise
 */
export function isTokenExpiringSoon() {
  try {
    const tokenData = localStorage.getItem(TOKEN_KEY);
    if (!tokenData) return false;
    
    const parsed = JSON.parse(tokenData);
    if (!parsed.expiresAt) return false;
    
    const oneHour = 60 * 60 * 1000;
    return (parsed.expiresAt - Date.now()) < oneHour;
  } catch (error) {
    return false;
  }
}

/**
 * Clear all authentication data
 */
export function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REFRESH_KEY);
    
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    
    // Clear any timers
    if (window.tokenRefreshTimer) {
      clearTimeout(window.tokenRefreshTimer);
      window.tokenRefreshTimer = null;
    }
    
    console.log('Authentication data cleared');
  } catch (error) {
    console.error('Error clearing authentication data:', error);
  }
}

/**
 * Refresh authentication token
 * @returns {Promise<boolean>} True if refresh successful, false otherwise
 */
export async function refreshAuth() {
  try {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) {
      console.warn('No refresh token available');
      return false;
    }
    
    // Make API call to refresh token
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      storeAuth(data.token, data.user, data.refreshToken);
      return true;
    } else {
      console.warn('Token refresh failed');
      clearAuth();
      return false;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    clearAuth();
    return false;
  }
}

/**
 * Setup automatic token refresh
 * @param {number} expiresAt - Token expiration timestamp
 */
function setupTokenRefresh(expiresAt) {
  if (window.tokenRefreshTimer) {
    clearTimeout(window.tokenRefreshTimer);
  }
  
  const timeUntilExpiry = expiresAt - Date.now();
  const refreshTime = Math.max(timeUntilExpiry - (60 * 60 * 1000), 0); // Refresh 1 hour before expiry
  
  window.tokenRefreshTimer = setTimeout(async () => {
    console.log('Attempting to refresh token...');
    const success = await refreshAuth();
    if (!success) {
      console.warn('Token refresh failed, user will need to login again');
    }
  }, refreshTime);
}

/**
 * Update stored user data
 * @param {Object} updates - User data updates
 */
export function updateStoredUser(updates) {
  try {
    const currentUser = getStoredUser();
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, ...updates };
    
    if (localStorage.getItem(USER_KEY)) {
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    } else if (sessionStorage.getItem(USER_KEY)) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
  } catch (error) {
    console.error('Error updating stored user data:', error);
  }
}

/**
 * Get token expiration time
 * @returns {Date|null} Token expiration date or null if not found
 */
export function getTokenExpiration() {
  try {
    const tokenData = localStorage.getItem(TOKEN_KEY);
    if (!tokenData) return null;
    
    const parsed = JSON.parse(tokenData);
    return parsed.expiresAt ? new Date(parsed.expiresAt) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if authentication is stored in localStorage or sessionStorage
 * @returns {string} 'localStorage', 'sessionStorage', or 'none'
 */
export function getStorageType() {
  if (localStorage.getItem(TOKEN_KEY)) return 'localStorage';
  if (sessionStorage.getItem(TOKEN_KEY)) return 'sessionStorage';
  return 'none';
}

// Export constants for external use
export const AUTH_KEYS = {
  TOKEN: TOKEN_KEY,
  USER: USER_KEY,
  REFRESH: REFRESH_KEY
}; 