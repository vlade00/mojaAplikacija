// Auth service - API pozivi za autentifikaciju

import api from './api';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types';

// POST /api/auth/login - Prijava korisnika
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
};

// POST /api/auth/register - Registracija korisnika
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
};

// Logout - briše token i user iz localStorage
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Proveri da li je korisnik ulogovan
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

// Uzmi token iz localStorage
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Uzmi user iz localStorage
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

