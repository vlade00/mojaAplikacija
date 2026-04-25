// Stylist Panel - Panel za frizere

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getStylistProfile,
  getStylistAppointments,
  updateAppointmentStatus,
  StylistProfile,
  StylistAppointment,
} from '../services/stylistPanelService';
import { getStylistReviews, Review } from '../services/reviewService';

const StylistPanel: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<StylistProfile | null>(null);
  const [appointments, setAppointments] = useState<StylistAppointment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const STYLIST_APPOINTMENTS_LIMIT = 4;

  useEffect(() => {
    loadProfile();
    loadAppointments();
  }, []);

  useEffect(() => {
    setShowAllAppointments(false);
  }, [searchTerm, statusFilter]);

  // Osveži review-e kada se profil učita
  useEffect(() => {
    if (profile?.stylistId) {
      console.log('[StylistPanel] Profile changed, loading reviews for stylistId:', profile.stylistId);
      loadReviewsForStylist(profile.stylistId);
    }
  }, [profile?.stylistId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getStylistProfile();
      setProfile(data);
      console.log('[StylistPanel] Profile loaded:', data);
      // Review-e će učitati useEffect kada se profile state ažurira
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      setAppointmentsLoading(true);
      const data = await getStylistAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const loadReviews = async () => {
    if (!profile?.stylistId) {
      console.warn('[StylistPanel] Cannot load reviews: no stylistId in profile');
      return;
    }
    await loadReviewsForStylist(profile.stylistId);
  };

  const loadReviewsForStylist = async (stylistId: number) => {
    try {
      setReviewsLoading(true);
      console.log('[StylistPanel] Fetching reviews for stylistId:', stylistId);
      const data = await getStylistReviews(stylistId);
      console.log('[StylistPanel] Reviews loaded:', data.length, 'reviews');
      setReviews(data);
    } catch (error) {
      console.error('[StylistPanel] Error loading reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId: number, newStatus: string) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      await loadAppointments();
      alert('Status rezervacije je uspešno ažuriran');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Greška pri ažuriranju statusa rezervacije');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      PENDING: 'Čeka potvrdu',
      CONFIRMED: 'Potvrđeno',
      COMPLETED: 'Završeno',
      CANCELLED: 'Otkazano',
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      CONFIRMED: 'bg-green-100 text-green-700',
      COMPLETED: 'bg-blue-100 text-blue-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredAppointments = useMemo(() => {
    const filtered = appointments.filter((appointment) => {
      const matchesSearch =
        appointment.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appointment.customer.email &&
          appointment.customer.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || appointment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [appointments, searchTerm, statusFilter]);

  const visibleAppointments = showAllAppointments
    ? filteredAppointments
    : filteredAppointments.slice(0, STYLIST_APPOINTMENTS_LIMIT);

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'PENDING').length,
    confirmed: appointments.filter((a) => a.status === 'CONFIRMED').length,
    completed: appointments.filter((a) => a.status === 'COMPLETED').length,
    revenue: appointments
      .filter((a) => a.status === 'COMPLETED')
      .reduce((sum, a) => sum + parseFloat(a.price), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
          <p className="text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 mx-6 mt-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
              <i className="fas fa-user-tie"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">HairStudio</h2>
              <p className="text-sm text-gray-500">Frizer Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="px-6 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>Odjavi se
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        {/* Profile Card */}
        {profile && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {profile.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2)}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{profile.name}</h3>
                <div className="flex items-center gap-4 mb-3">
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <i className="fas fa-star text-yellow-400"></i>
                    <span className="font-semibold text-gray-900">
                      {profile.rating ? parseFloat(profile.rating).toFixed(1) : '0.0'}
                    </span>
                    <span className="text-gray-500">({profile.totalReviews} ocena)</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    <i className="fas fa-briefcase mr-1 text-indigo-500"></i>
                    {profile.yearsOfExperience} godina iskustva
                  </p>
                </div>
                {profile.bio && <p className="text-gray-700 mb-2">{profile.bio}</p>}
                <div className="flex gap-2 text-sm text-gray-600">
                  <p>
                    <i className="fas fa-envelope mr-1 text-indigo-500"></i>
                    {profile.email}
                  </p>
                  {profile.phone && (
                    <p>
                      <i className="fas fa-phone mr-1 text-indigo-500"></i>
                      {profile.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-indigo-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ukupno rezervacija</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-calendar text-indigo-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Čeka potvrdu</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-clock text-yellow-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Potvrđeno</p>
                <p className="text-3xl font-bold text-gray-900">{stats.confirmed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-check-circle text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Završeno</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-check-double text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ukupan prihod</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.revenue)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-money-bill-wave text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Section - POMERENO GORE */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <i className="fas fa-calendar-check text-indigo-600"></i>
              Moje rezervacije
            </h3>
            <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-semibold text-sm">
              {filteredAppointments.length} rezervacija
            </span>
          </div>

          {/* Search and Filter */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="fas fa-search mr-2 text-indigo-500"></i>Pretraga
              </label>
              <input
                type="text"
                placeholder="Pretraži po klijentu ili usluzi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="fas fa-filter mr-2 text-indigo-500"></i>Filtriraj po statusu
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
              >
                <option value="ALL">Svi statusi</option>
                <option value="PENDING">Čeka potvrdu</option>
                <option value="CONFIRMED">Potvrđeno</option>
                <option value="COMPLETED">Završeno</option>
                <option value="CANCELLED">Otkazano</option>
              </select>
            </div>
          </div>

          {/* Appointments List */}
          {appointmentsLoading ? (
            <div className="text-center py-12">
              <i className="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
              <p className="text-gray-600">Učitavanje rezervacija...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-calendar-times text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-600">Nema rezervacija</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Datum i vreme</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Klijent</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Usluga</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Cena</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAppointments.map((appointment) => (
                    <tr key={appointment.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {new Date(appointment.date).toLocaleDateString('sr-RS', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-gray-600">{appointment.time}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">{appointment.customer.name}</p>
                          <p className="text-sm text-gray-600">{appointment.customer.email}</p>
                          {appointment.customer.phone && (
                            <p className="text-sm text-gray-600">{appointment.customer.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">{appointment.service.name}</p>
                          <p className="text-sm text-gray-600">{appointment.service.category}</p>
                          <p className="text-xs text-gray-500">{appointment.service.duration} min</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={appointment.status}
                          onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${getStatusBadge(
                            appointment.status
                          )} border-transparent hover:border-gray-300 transition cursor-pointer`}
                        >
                          <option value="PENDING">Čeka potvrdu</option>
                          <option value="CONFIRMED">Potvrđeno</option>
                          <option value="COMPLETED">Završeno</option>
                          <option value="CANCELLED">Otkazano</option>
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(parseFloat(appointment.price))}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        {appointment.notes && (
                          <button
                            title={appointment.notes}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
                          >
                            <i className="fas fa-sticky-note mr-1"></i>Napomene
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAppointments.length > STYLIST_APPOINTMENTS_LIMIT && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAllAppointments((v) => !v)}
                    className="px-6 py-3 bg-indigo-100 text-indigo-800 rounded-xl font-semibold hover:bg-indigo-200 transition"
                  >
                    {showAllAppointments ? (
                      <>
                        <i className="fas fa-chevron-up mr-2"></i>
                        Prikaži manje (prvih {STYLIST_APPOINTMENTS_LIMIT})
                      </>
                    ) : (
                      <>
                        <i className="fas fa-chevron-down mr-2"></i>
                        Prikaži sve ({filteredAppointments.length - STYLIST_APPOINTMENTS_LIMIT} više)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reviews Section - POMERENO NA DNO */}
        {profile && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              <i className="fas fa-star text-yellow-400 mr-2"></i>
              Ocene i komentari ({reviews.length})
            </h3>
            {reviewsLoading ? (
              <div className="text-center py-8">
                <i className="fas fa-spinner fa-spin text-2xl text-indigo-600 mb-2"></i>
                <p className="text-gray-600">Učitavanje ocena...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-star text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-600">Još nema ocena</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-2 border-gray-100 rounded-xl p-5 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-xl flex items-center justify-center text-white font-bold">
                          {review.customer.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{review.customer.name}</p>
                          <p className="text-sm text-gray-600">{review.appointment.service}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('sr-RS', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i
                            key={star}
                            className={`fas fa-star ${
                              star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          ></i>
                        ))}
                        <span className="ml-2 font-bold text-gray-900">{review.rating}/5</span>
                      </div>
                    </div>
                    {review.comment && (
                      <div className="bg-gray-50 rounded-lg p-4 mt-3">
                        <p className="text-gray-700 italic">"{review.comment}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StylistPanel;

