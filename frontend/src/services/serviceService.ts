// Service service - API pozivi za usluge

import api from './api';

export interface Service {
  id: number;
  name: string;
  description?: string;
  duration: number;
  price: string;
  category: 'MENS_HAIRCUT' | 'BEARD' | 'WOMENS_HAIRCUT' | 'COLORING' | 'CARE';
  isActive: boolean;
}

// GET /api/services - Vrati sve usluge
export const getServices = async (): Promise<Service[]> => {
  const response = await api.get<Service[]>('/services');
  return response.data;
};

// GET /api/services/:id - Vrati jednu uslugu
export const getService = async (id: number): Promise<Service> => {
  const response = await api.get<Service>(`/services/${id}`);
  return response.data;
};

// GET /api/services/category/:category - Vrati usluge po kategoriji
export const getServicesByCategory = async (category: string): Promise<Service[]> => {
  const response = await api.get<Service[]>(`/services/category/${category}`);
  return response.data;
};

