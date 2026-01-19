// Admin service - API pozivi za admin funkcionalnosti

import api from './api';

// ========== TIPOVI ==========
// Tipovi za admin podatke

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'STYLIST' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface AdminStylist {
  userId: number;
  name: string;
  email: string;
  phone?: string;
  stylistId: number;
  rating: string;
  totalReviews: number;
  bio?: string;
  yearsOfExperience: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdminAppointment {
  id: number;
  date: string;
  time: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  price: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  stylist: {
    id: number;
    name: string;
    email: string;
    rating: string;
  };
  service: {
    id: number;
    name: string;
    duration: number;
    category: string;
  };
}

export interface AdminStats {
  users: {
    total: number;
  };
  stylists: {
    active: number;
  };
  appointments: {
    total: number;
    byStatus: Array<{ status: string; count: string }>;
  };
  revenue: {
    total: number;
  };
  popularServices: Array<{
    name: string;
    category: string;
    count: string;
    revenue: string;
  }>;
}

export interface CreateStylistRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  bio?: string;
  yearsOfExperience?: number;
}

// ========== API FUNKCIJE ==========

// GET /api/admin/users - Vrati sve korisnike
export const getUsers = async (): Promise<AdminUser[]> => {
  const response = await api.get<AdminUser[]>('/admin/users');
  return response.data;
};

// GET /api/admin/users/:id - Vrati jednog korisnika
export const getUser = async (id: number): Promise<AdminUser> => {
  const response = await api.get<AdminUser>(`/admin/users/${id}`);
  return response.data;
};

// GET /api/admin/stylists - Vrati sve frizere
export const getStylists = async (): Promise<AdminStylist[]> => {
  const response = await api.get<AdminStylist[]>('/admin/stylists');
  return response.data;
};

// POST /api/admin/stylists - Kreiraj novog frizera
export const createStylist = async (data: CreateStylistRequest): Promise<{ user: AdminUser; stylist: any }> => {
  const response = await api.post('/admin/stylists', data);
  return response.data;
};

// PUT /api/admin/stylists/:id - Ažuriraj frizera
export const updateStylist = async (id: number, data: Partial<CreateStylistRequest & { isActive?: boolean }>): Promise<AdminStylist> => {
  const response = await api.put<AdminStylist>(`/admin/stylists/${id}`, data);
  return response.data;
};

// GET /api/admin/appointments - Vrati sve rezervacije
export const getAppointments = async (): Promise<AdminAppointment[]> => {
  const response = await api.get<AdminAppointment[]>('/admin/appointments');
  return response.data;
};

// GET /api/admin/stats - Vrati statistike
export const getStats = async (): Promise<AdminStats> => {
  const response = await api.get<AdminStats>('/admin/stats');
  return response.data;
};

// PUT /api/admin/users/:id - Ažuriraj korisnika
export const updateUser = async (id: number, data: Partial<AdminUser & { role?: string }>): Promise<{ message: string }> => {
  const response = await api.put(`/admin/users/${id}`, data);
  return response.data;
};

// DELETE /api/admin/users/:id - Obriši korisnika
export const deleteUser = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

// DELETE /api/admin/stylists/:id - Obriši frizera
export const deleteStylist = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete(`/admin/stylists/${id}`);
  return response.data;
};

