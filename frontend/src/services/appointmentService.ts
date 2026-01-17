// Appointment service - API pozivi za rezervacije

import api from './api';

export interface Appointment {
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
    totalReviews: number;
  };
  service: {
    id: number;
    name: string;
    duration: number;
    category: string;
  };
}

export interface CreateAppointmentRequest {
  stylistId: number;
  serviceId: number;
  date: string;
  time: string;
  notes?: string;
}

// GET /api/appointments - Vrati sve rezervacije
export const getAppointments = async (): Promise<Appointment[]> => {
  const response = await api.get<Appointment[]>('/appointments');
  return response.data;
};

// GET /api/appointments/:id - Vrati jednu rezervaciju
export const getAppointment = async (id: number): Promise<Appointment> => {
  const response = await api.get<Appointment>(`/appointments/${id}`);
  return response.data;
};

// POST /api/appointments - Kreiraj rezervaciju
export const createAppointment = async (data: CreateAppointmentRequest): Promise<Appointment> => {
  const response = await api.post<Appointment>('/appointments', data);
  return response.data;
};

// PUT /api/appointments/:id - Ažuriraj rezervaciju
export const updateAppointment = async (id: number, data: Partial<CreateAppointmentRequest & { status?: string }>): Promise<Appointment> => {
  const response = await api.put<Appointment>(`/appointments/${id}`, data);
  return response.data;
};

// DELETE /api/appointments/:id - Obriši rezervaciju
export const deleteAppointment = async (id: number): Promise<void> => {
  await api.delete(`/appointments/${id}`);
};

