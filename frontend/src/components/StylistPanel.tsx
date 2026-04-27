// Stylist Panel - Panel za frizere

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
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

  const appointmentDateYmd = (dateVal: string) => {
    const s = String(dateVal ?? '');
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : s.slice(0, 10);
  };

  const formatAppointmentDisplayDate = (dateVal: string) => {
    const ymd = appointmentDateYmd(dateVal);
    const d = new Date(`${ymd}T12:00:00`);
    if (Number.isNaN(d.getTime())) return ymd;
    return d.toLocaleDateString('sr-RS', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatAppointmentTime = (timeVal: string) => {
    const s = String(timeVal ?? '');
    const m = s.match(/(\d{1,2}):(\d{2})/);
    if (!m) return s.slice(0, 5);
    return `${m[1].padStart(2, '0')}:${m[2]}`;
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
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 mx-4 sm:mx-6 mt-4 sm:mt-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl shadow-lg">
              <i className="fas fa-user-tie"></i>
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">HairStudio</h2>
              <p className="text-sm text-gray-500">Frizer Panel</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:justify-end w-full sm:w-auto">
            <div className="text-left sm:text-right min-w-0">
              <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-sm text-gray-600 break-all">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="w-full sm:w-auto shrink-0 px-4 sm:px-6 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Odjavi se</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-6">
        {/* Profile Card */}
        {profile && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
              <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg">
                {profile.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2)}
              </div>
              <div className="flex-1 min-w-0 w-full">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{profile.name}</h3>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 mb-3 text-sm text-gray-600">
                  <p className="flex items-center gap-1">
                    <i className="fas fa-star text-yellow-400"></i>
                    <span className="font-semibold text-gray-900">
                      {profile.rating ? parseFloat(profile.rating).toFixed(1) : '0.0'}
                    </span>
                    <span className="text-gray-500">({profile.totalReviews} ocena)</span>
                  </p>
                  <p>
                    <i className="fas fa-briefcase mr-1 text-indigo-500"></i>
                    {profile.yearsOfExperience} godina iskustva
                  </p>
                </div>
                {profile.bio && <p className="text-gray-700 mb-2 text-sm sm:text-base">{profile.bio}</p>}
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 text-sm text-gray-600">
                  <p className="break-all">
                    <i className="fas fa-envelope mr-1 text-indigo-500"></i>
                    {profile.email}
                  </p>
                  {profile.phone && (
                    <p className="shrink-0">
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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 border-indigo-500 min-w-0">
            <div className="flex justify-between items-center gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 leading-tight">Ukupno rezervacija</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">{stats.total}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-indigo-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-calendar text-indigo-600 text-lg sm:text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 border-yellow-500 min-w-0">
            <div className="flex justify-between items-center gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 leading-tight">Čeka potvrdu</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-yellow-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-clock text-yellow-600 text-lg sm:text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 border-green-500 min-w-0">
            <div className="flex justify-between items-center gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 leading-tight">Potvrđeno</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">{stats.confirmed}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-green-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-check-circle text-green-600 text-lg sm:text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 border-blue-500 min-w-0">
            <div className="flex justify-between items-center gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 leading-tight">Završeno</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">{stats.completed}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-blue-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-check-double text-blue-600 text-lg sm:text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 border-purple-500 min-w-0 col-span-2 lg:col-span-1">
            <div className="flex justify-between items-center gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 leading-tight">Ukupan prihod</p>
                <p className="text-base sm:text-2xl font-bold text-gray-900 break-words leading-tight">
                  {formatCurrency(stats.revenue)}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-purple-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-money-bill-wave text-purple-600 text-lg sm:text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Section */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 min-w-0">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3 min-w-0">
              <i className="fas fa-calendar-check text-indigo-600 shrink-0"></i>
              <span>Moje rezervacije</span>
            </h3>
            <span className="px-3 sm:px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-semibold text-sm w-fit shrink-0">
              {filteredAppointments.length} rezervacija
            </span>
          </div>

          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
            <>
              <div className="md:hidden space-y-4">
                {visibleAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border-2 border-gray-100 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-2 border-b border-gray-100 pb-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">
                          {formatAppointmentDisplayDate(appointment.date)}
                        </p>
                        <p className="text-sm text-gray-600">{formatAppointmentTime(appointment.time)}</p>
                      </div>
                      <p className="font-semibold text-indigo-700 whitespace-nowrap tabular-nums shrink-0">
                        {formatCurrency(parseFloat(appointment.price))}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                        Klijent
                      </p>
                      <p className="font-semibold text-gray-900 break-words">{appointment.customer.name}</p>
                      <p className="text-sm text-gray-600 break-all">{appointment.customer.email}</p>
                      {appointment.customer.phone && (
                        <p className="text-sm text-gray-600">{appointment.customer.phone}</p>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                        Usluga
                      </p>
                      <p className="font-semibold text-gray-900 break-words">{appointment.service.name}</p>
                      <p className="text-sm text-gray-600">
                        {appointment.service.duration} min · {appointment.service.category}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                      <select
                        value={appointment.status}
                        onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                        className={`w-full px-3 py-2.5 rounded-xl text-sm font-semibold border-2 ${getStatusBadge(
                          appointment.status
                        )} border-transparent`}
                      >
                        <option value="PENDING">Čeka potvrdu</option>
                        <option value="CONFIRMED">Potvrđeno</option>
                        <option value="COMPLETED">Završeno</option>
                        <option value="CANCELLED">Otkazano</option>
                      </select>
                    </div>
                    {appointment.notes && (
                      <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                        <span className="font-semibold text-gray-600">Napomene: </span>
                        <span className="break-words">{appointment.notes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Datum i vreme</th>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Klijent</th>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Usluga</th>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Cena</th>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Akcije</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleAppointments.map((appointment) => (
                      <tr key={appointment.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-3 align-top">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {formatAppointmentDisplayDate(appointment.date)}
                            </p>
                            <p className="text-sm text-gray-600">{formatAppointmentTime(appointment.time)}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3 align-top max-w-[200px]">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 break-words">{appointment.customer.name}</p>
                            <p className="text-sm text-gray-600 break-all">{appointment.customer.email}</p>
                            {appointment.customer.phone && (
                              <p className="text-sm text-gray-600">{appointment.customer.phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 break-words">{appointment.service.name}</p>
                            <p className="text-sm text-gray-600">{appointment.service.category}</p>
                            <p className="text-xs text-gray-500">{appointment.service.duration} min</p>
                          </div>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <select
                            value={appointment.status}
                            onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                            className={`max-w-full px-2 py-1 rounded-full text-sm font-semibold border-2 ${getStatusBadge(
                              appointment.status
                            )} border-transparent hover:border-gray-300 transition cursor-pointer`}
                          >
                            <option value="PENDING">Čeka potvrdu</option>
                            <option value="CONFIRMED">Potvrđeno</option>
                            <option value="COMPLETED">Završeno</option>
                            <option value="CANCELLED">Otkazano</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 align-top whitespace-nowrap tabular-nums">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(parseFloat(appointment.price))}
                          </p>
                        </td>
                        <td className="py-3 px-3 align-top">
                          {appointment.notes && (
                            <button
                              type="button"
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
              </div>
              {filteredAppointments.length > STYLIST_APPOINTMENTS_LIMIT && (
                <div className="mt-4 flex justify-center px-1">
                  <button
                    type="button"
                    onClick={() => setShowAllAppointments((v) => !v)}
                    className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-indigo-100 text-indigo-800 rounded-xl font-semibold hover:bg-indigo-200 transition text-center text-sm sm:text-base"
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
            </>
          )}
        </div>

        {/* Reviews Section - POMERENO NA DNO */}
        {profile && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex flex-wrap items-center gap-2">
              <i className="fas fa-star text-yellow-400"></i>
              <span>Ocene i komentari ({reviews.length})</span>
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
                    className="border-2 border-gray-100 rounded-xl p-4 sm:p-5 hover:shadow-md transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-xl flex items-center justify-center text-white text-sm sm:text-base font-bold">
                          {review.customer.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .substring(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 break-words">{review.customer.name}</p>
                          <p className="text-sm text-gray-600 break-words">{review.appointment.service}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('sr-RS', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 sm:justify-end shrink-0">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i
                            key={star}
                            className={`fas fa-star text-sm sm:text-base ${
                              star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          ></i>
                        ))}
                        <span className="ml-1 sm:ml-2 font-bold text-gray-900">{review.rating}/5</span>
                      </div>
                    </div>
                    {review.comment && (
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mt-2 sm:mt-3">
                        <p className="text-gray-700 italic break-words">"{review.comment}"</p>
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

