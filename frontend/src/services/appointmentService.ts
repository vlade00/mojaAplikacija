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
export const getAppointments = async (forceRefresh = false): Promise<Appointment[]> => {
  // Dodaj cache-busting parametar ako je potrebno forsirano osvežavanje
  const url = forceRefresh ? `/appointments?_t=${Date.now()}` : '/appointments';
  const response = await api.get<Appointment[]>(url);
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

// GET /api/appointments/available/:stylistId - Vrati dostupna vremena za frizera
export const getAvailableTimes = async (stylistId: number, date: string): Promise<{ availableTimes: string[]; bookedTimes: string[] }> => {
  console.log('[getAvailableTimes] Calling API:', { stylistId, date });
  try {
    const response = await api.get<{ availableTimes: string[]; bookedTimes: string[] }>(`/appointments/available/${stylistId}`, {
      params: { date }
    });
    console.log('[getAvailableTimes] API Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[getAvailableTimes] API Error:', error);
    console.error('[getAvailableTimes] Error response:', error.response?.data);
    throw error;
  }
};

