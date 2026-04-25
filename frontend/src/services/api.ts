// Axios instance za API pozive

import axios from 'axios';

// Produkcija: u .env postavi REACT_APP_API_URL (npr. https://tvoj-backend.up.railway.app/api)
// Lokalno: ne mora ništa — koristi se podrazumevano ispod.
function normalizeApiBase(): { apiBase: string; staticBase: string } {
  let raw = (process.env.REACT_APP_API_URL || 'http://localhost:3000/api').trim();
  raw = raw.replace(/\/+$/, '');
  const apiBase = raw.endsWith('/api') ? raw : `${raw}/api`;
  const staticBase = apiBase.replace(/\/api\/?$/i, '') || 'http://localhost:3000';
  return { apiBase, staticBase };
}

const { apiBase: API_BASE_URL, staticBase: STATIC_BASE_URL_INTERNAL } = normalizeApiBase();

// Base URL za statičke fajlove (avatars) — isti host kao API, bez /api
export const STATIC_BASE_URL = STATIC_BASE_URL_INTERNAL;

// Kreiraj axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dodaj token u header za svaki zahtev (ako postoji)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ne postavljaj Content-Type za FormData (browser će automatski dodati sa boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Obradi odgovore i greške
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token je istekao ili pogrešan - obriši ga samo ako nije login/register endpoint
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect na login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

