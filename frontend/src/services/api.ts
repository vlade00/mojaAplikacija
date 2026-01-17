// Axios instance za API pozive

import axios from 'axios';

// Base URL za backend API
const API_BASE_URL = 'http://localhost:3000/api';

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
      // Token je istekao ili pogrešan - obriši ga
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect na login (biće dodato kasnije)
    }
    return Promise.reject(error);
  }
);

export default api;

