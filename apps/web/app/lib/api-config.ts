/**
 * API Configuration
 * 
 * Centralized API URL configuration using environment variables.
 * Falls back to localhost:3001 for development.
 */

export const getApiUrl = (): string => {
  // Use environment variable if available (for production/deployment)
  if (typeof window !== 'undefined') {
    // Client-side: use environment variable or fallback
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  } else {
    // Server-side: use environment variable or fallback
    return process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
  }
};

// Export constant for direct use
export const API_URL = getApiUrl();

// Helper function to build full API endpoint URL
export const apiEndpoint = (path: string): string => {
  const baseUrl = API_URL.replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
