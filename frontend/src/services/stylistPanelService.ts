// Stylist Panel service - API pozivi za frizer panel

import api from './api';

export interface StylistProfile {
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
}

export interface StylistAppointment {
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
  service: {
    id: number;
    name: string;
    duration: number;
    category: string;
  };
}

// GET /api/stylist/me - Vrati profil ulogovanog frizera
export const getStylistProfile = async (): Promise<StylistProfile> => {
  const response = await api.get<StylistProfile>('/stylist/me');
  return response.data;
};

// GET /api/stylist/me/appointments - Vrati rezervacije ulogovanog frizera
export const getStylistAppointments = async (): Promise<StylistAppointment[]> => {
  const response = await api.get<StylistAppointment[]>('/stylist/me/appointments');
  return response.data;
};

// PUT /api/stylist/appointments/:id/status - Ažuriraj status rezervacije
export const updateAppointmentStatus = async (appointmentId: number, status: string): Promise<any> => {
  const response = await api.put(`/stylist/appointments/${appointmentId}/status`, { status });
  return response.data;
};

