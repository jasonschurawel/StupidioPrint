// API configuration utilities
// Automatically detects the correct API base URL for both localhost and LAN access

/**
 * Get the correct API base URL based on current hostname
 * - If accessing via localhost: use localhost:3001
 * - If accessing via LAN IP: use same IP with port 3001
 */
export const getApiBaseUrl = (): string => {
  const hostname = window.location.hostname;
  
  // If we're on localhost, use localhost for API
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // If we're on a LAN IP, use the same IP for API
  return `http://${hostname}:3001`;
};

/**
 * Make API calls to the print server with better error handling
 */
export const apiCall = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  console.log(`Making API call to: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      // Add some headers that might help with CORS
      headers: {
        ...options?.headers,
      }
    });
    
    if (!response.ok) {
      console.error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error(`Network error calling ${url}:`, error);
    throw error;
  }
};
