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

// PUT /api/auth/profile - Ažuriraj profil korisnika
export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export const updateProfile = async (data: UpdateProfileRequest): Promise<any> => {
  const response = await api.put<any>('/auth/profile', data);
  return response.data;
};

// PUT /api/auth/change-password - Promeni lozinku korisnika
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const changePassword = async (data: ChangePasswordRequest): Promise<any> => {
  const response = await api.put<any>('/auth/change-password', data);
  return response.data;
};

// POST /api/auth/upload-avatar - Upload avatar slike
export const uploadAvatar = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  // Ne postavljaj Content-Type - axios interceptor će automatski ukloniti za FormData
  const response = await api.post<any>('/auth/upload-avatar', formData);
  return response.data;
};

