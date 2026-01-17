// Customer Dashboard - Glavna stranica za korisnike (CUSTOMER)

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAppointments, deleteAppointment, Appointment } from '../services/appointmentService';

const CustomerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Proveri da li je došao sa uspešnom rezervacijom
  useEffect(() => {
    if (searchParams.get('booking') === 'success') {
      setSuccessMessage('Uspešno ste kreirali rezervaciju!');
      // Obriši query parametar iz URL-a
      navigate('/dashboard', { replace: true });
      // Skriči poruku nakon 5 sekundi
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await getAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id: number) => {
    if (window.confirm('Da li ste sigurni da želite da otkažete rezervaciju?')) {
      try {
        await deleteAppointment(id);
        loadAppointments(); // Reload lista
      } catch (error: any) {
        alert(error.response?.data?.error || 'Greška pri otkazivanju rezervacije');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold text-sm">
            <i className="fas fa-check-circle mr-1"></i>Potvrđeno
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full font-semibold text-sm">
            <i className="fas fa-hourglass-half mr-1"></i>Čeka potvrdu
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">
            <i className="fas fa-check-double mr-1"></i>Završeno
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-semibold text-sm">
            <i className="fas fa-times-circle mr-1"></i>Otkazano
          </span>
        );
      default:
        return null;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 mx-6 mt-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
              <i className="fas fa-cut"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">HairStudio</h2>
              <p className="text-sm text-gray-500">Premium Salon</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-6 py-2 bg-indigo-100 text-indigo-700 rounded-xl font-semibold hover:bg-indigo-200 transition">
              <i className="fas fa-home mr-2"></i>Početna
            </button>
            <button className="px-6 py-2 text-gray-600 rounded-xl font-semibold hover:bg-gray-100 transition">
              <i className="fas fa-calendar mr-2"></i>Rezervacije
            </button>
            <button className="px-6 py-2 text-gray-600 rounded-xl font-semibold hover:bg-gray-100 transition">
              <i className="fas fa-user-circle mr-2"></i>Profil
            </button>
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
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-6">
            <div className="flex items-center gap-2">
              <i className="fas fa-check-circle"></i>
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-8 text-white shadow-2xl mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-3xl font-bold mb-2">Dobrodošli, {user?.name}! 👋</h3>
              <p className="text-xl opacity-90">
                Imate <span className="font-bold">{upcomingAppointments.length}</span> predstojeća zakazivanja
              </p>
            </div>
            <button
              onClick={() => navigate('/booking')}
              className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-bold text-lg hover:bg-gray-100 transition shadow-lg"
            >
              <i className="fas fa-plus mr-2"></i>Nova Rezervacija
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Appointments List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <span className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-calendar text-indigo-600"></i>
                  </span>
                  Predstojeća Zakazivanja
                </h3>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <i className="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
                  <p className="text-gray-600">Učitavanje rezervacija...</p>
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-calendar-times text-6xl text-gray-300 mb-4"></i>
                  <p className="text-gray-600 text-lg mb-2">Nemate predstojećih rezervacija</p>
                  <button
                    onClick={() => navigate('/booking')}
                    className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
                  >
                    <i className="fas fa-plus mr-2"></i>Zakaži Termin
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => {
                    const startTime = formatTime(appointment.time);
                    const endDate = new Date(`${appointment.date}T${appointment.time}`);
                    endDate.setMinutes(endDate.getMinutes() + appointment.service.duration);
                    const endTime = formatTime(endDate.toTimeString());

                    return (
                      <div
                        key={appointment.id}
                        className="border-2 border-gray-100 rounded-2xl p-6 shadow-md hover:shadow-lg transition"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-800 mb-1">
                              {appointment.service.name}
                            </h4>
                            <p className="text-gray-600 flex items-center gap-2">
                              <i className="fas fa-clock text-indigo-500"></i>
                              {formatDate(appointment.date)}, {startTime} - {endTime}
                            </p>
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {getInitials(appointment.stylist.name)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{appointment.stylist.name}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <i className="fas fa-star text-yellow-400"></i>
                              {appointment.stylist.rating} ({appointment.stylist.totalReviews} ocena)
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition">
                            <i className="fas fa-eye mr-2"></i>Detalji
                          </button>
                          {appointment.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleCancelAppointment(appointment.id)}
                              className="flex-1 px-4 py-3 bg-red-100 text-red-700 rounded-xl font-semibold hover:bg-red-200 transition"
                            >
                              <i className="fas fa-times mr-2"></i>Otkaži
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Quick Actions & Stats */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-6 border-2 border-indigo-100">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Brze Akcije</h3>
              <button
                onClick={() => navigate('/booking')}
                className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-lg mb-3"
              >
                <i className="fas fa-calendar-plus mr-2"></i>Zakaži Termin
              </button>
              <button className="w-full px-6 py-4 bg-white text-indigo-600 border-2 border-indigo-200 rounded-xl font-semibold hover:bg-indigo-50 transition">
                <i className="fas fa-history mr-2"></i>Istorija
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Statistika</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-600">Ukupno rezervacija</p>
                    <p className="text-2xl font-bold text-indigo-600">{appointments.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-calendar-check text-indigo-600"></i>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-600">Predstojeće</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {upcomingAppointments.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-clock text-purple-600"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;

