// Review service - API pozivi za ocenjivanje frizera

import api from './api';

export interface Review {
  id: number;
  rating: number;
  comment?: string;
  createdAt: string;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  appointment: {
    id: number;
    date: string;
    service: string;
  };
}

export interface CreateReviewRequest {
  appointmentId: number;
  rating: number;
  comment?: string;
}

export interface ReviewCheck {
  hasReview: boolean;
  review?: {
    id: number;
    rating: number;
    comment?: string;
    createdAt: string;
  };
}

// POST /api/reviews - Kreiraj review
export const createReview = async (data: CreateReviewRequest): Promise<{ review: any; message: string }> => {
  const response = await api.post('/reviews', data);
  return response.data;
};

// GET /api/reviews/stylist/:id - Vrati sve review-e za frizera
export const getStylistReviews = async (stylistId: number): Promise<Review[]> => {
  const response = await api.get<Review[]>(`/reviews/stylist/${stylistId}`);
  return response.data;
};

// GET /api/reviews/appointment/:id - Proveri da li rezervacija ima review
export const checkAppointmentReview = async (appointmentId: number): Promise<ReviewCheck> => {
  const response = await api.get<ReviewCheck>(`/reviews/appointment/${appointmentId}`);
  return response.data;
};

