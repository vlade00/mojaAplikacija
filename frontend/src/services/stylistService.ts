// Stylist service - API pozivi za frizere

import api from './api';

export interface Stylist {
  id: number;
  name: string;
  email: string;
  rating: string;
  totalReviews: number;
  bio?: string;
  yearsOfExperience: number;
}

export interface StylistWithServices extends Stylist {
  services?: Array<{
    id: number;
    name: string;
    price: string;
  }>;
}

// GET /api/stylists - Vrati sve frizere
export const getStylists = async (): Promise<Stylist[]> => {
  const response = await api.get<Stylist[]>('/stylists');
  return response.data;
};

// GET /api/stylists/:id - Vrati jednog frizera
export const getStylist = async (id: number): Promise<Stylist> => {
  const response = await api.get<Stylist>(`/stylists/${id}`);
  return response.data;
};

// GET /api/stylists/:id/services - Vrati usluge koje radi frizer
export const getStylistServices = async (id: number): Promise<Array<{ id: number; name: string; price: string }>> => {
  const response = await api.get(`/stylists/${id}/services`);
  return response.data;
};

