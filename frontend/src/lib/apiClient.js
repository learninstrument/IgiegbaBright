export const fetchApi = async (path, options = {}) => {
  const baseUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') 
    : '';
    
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const endpoint = `${baseUrl}/api${normalizedPath}`;

  console.log(`[API Client] Attempting request to: ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      cache: 'no-store',
      ...options
    });
    return response;
  } catch (error) {
    console.error(`[API Client] Network connection failed to ${endpoint}:`, error);
    throw error;
  }
}
