// API utility to handle base URL
// In development, prefer Vite proxy via relative /api to avoid DNS issues
const API_BASE = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || '/api');

export const apiUrl = (path) => {
  // If path already includes /api, remove it
  let cleanPath = path.replace(/^\/api\//, '');
  // Remove leading slash
  cleanPath = cleanPath.replace(/^\//, '');
  return `${API_BASE}/${cleanPath}`;
};

export default apiUrl;
