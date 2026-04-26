// Customer Dashboard - Glavna stranica za korisnike (CUSTOMER)

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAppointments, updateAppointment, Appointment } from '../services/appointmentService';
import { checkAppointmentReview, createReview, ReviewCheck } from '../services/reviewService';
import { updateProfile, UpdateProfileRequest, changePassword, ChangePasswordRequest } from '../services/authService';
import { STATIC_BASE_URL } from '../services/api';

const CustomerDashboard: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [reviewChecks, setReviewChecks] = useState<{ [key: number]: ReviewCheck }>({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSalonModal, setShowSalonModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showAvatarPickerModal, setShowAvatarPickerModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [openSalonPhoto, setOpenSalonPhoto] = useState<string | null>(null);
  const COMPLETED_APPOINTMENTS_LIMIT = 2; // Prikaži prvih 2, ostale na "Prikaži više"
  const historySectionRef = useRef<HTMLDivElement>(null);

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

  // Inicijalizuj edit forme kada se otvori modal
  useEffect(() => {
    if (showEditProfileModal && user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      setEditPhone(user.phone || '');
    }
  }, [showEditProfileModal, user]);

  // Resetuj password forme kada se modal zatvori
  useEffect(() => {
    if (!showChangePasswordModal) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [showChangePasswordModal]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!openSalonPhoto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenSalonPhoto(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openSalonPhoto]);

  useEffect(() => {
    if (!showSalonModal && !showLocationModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setShowSalonModal(false);
      setShowLocationModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showSalonModal, showLocationModal]);

  // Osveži Profile Modal kada se user promeni (npr. nakon izbora avatara)
  // React će automatski re-render-ovati Profile Modal jer koristi user iz context-a

  useEffect(() => {
    if (!user?.id || appointments.length === 0) return;
    const completed = appointments.filter(
      (apt) => apt.customer?.id === user.id && apt.status === 'COMPLETED'
    );
    completed.forEach((apt) => {
      checkReview(apt.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, user?.id]);

  const scrollToCompletedHistory = () => {
    if (completedAppointments.length === 0) {
      setSuccessMessage('Još uvek nemate završenih rezervacija u istoriji.');
      setTimeout(() => setSuccessMessage(''), 4000);
      return;
    }
    setShowAllCompleted(true);
    requestAnimationFrame(() => {
      historySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const loadAppointments = async (forceRefresh = false) => {
    try {
      const data = await getAppointments(forceRefresh);
      setAppointments(data);
      console.log('[CustomerDashboard] Loaded appointments:', data.length);
      // Debug: proveri ocene frizera
      data.forEach((apt) => {
        if (apt.stylist) {
          console.log(`[CustomerDashboard] Stylist ${apt.stylist.name}: rating=${apt.stylist.rating}, totalReviews=${apt.stylist.totalReviews}`);
        }
      });
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id: number) => {
    if (window.confirm('Da li ste sigurni da želite da otkažete rezervaciju?')) {
      try {
        // Promeni status na CANCELLED umesto brisanja
        await updateAppointment(id, { status: 'CANCELLED' });
        setSuccessMessage('Rezervacija je uspešno otkazana');
        setTimeout(() => setSuccessMessage(''), 3000);
        loadAppointments(); // Reload lista
      } catch (error: any) {
        alert(error.response?.data?.error || 'Greška pri otkazivanju rezervacije');
      }
    }
  };

  const checkReview = async (appointmentId: number) => {
    try {
      const reviewCheck = await checkAppointmentReview(appointmentId);
      setReviewChecks((prev) => ({
        ...prev,
        [appointmentId]: reviewCheck,
      }));
    } catch (error) {
      console.error('Error checking review:', error);
      // Ako dođe do greške, postavi da nema review-a (može da oceni)
      setReviewChecks((prev) => ({
        ...prev,
        [appointmentId]: { hasReview: false },
      }));
    }
  };

  const handleOpenReviewModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowReviewModal(true);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setUpdatingProfile(true);
    try {
      const updateData: UpdateProfileRequest = {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() || undefined,
      };
      
      const updatedUser = await updateProfile(updateData);
      
      // Ažuriraj user u AuthContext
      const updatedUserData = { ...user, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      // Osveži stranicu da se ažurira user u context-u
      window.location.reload();
      
      setSuccessMessage('Profil je uspešno ažuriran!');
      setShowEditProfileModal(false);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Greška pri ažuriranju profila');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !currentPassword) {
      alert('Molimo popunite sva polja');
      return;
    }
    
    if (newPassword.length < 6) {
      alert('Nova lozinka mora imati najmanje 6 karaktera');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      alert('Nova lozinka i potvrda lozinke se ne poklapaju');
      return;
    }
    
    setChangingPassword(true);
    try {
      console.log('[CustomerDashboard] Changing password...');
      const changePasswordData: ChangePasswordRequest = {
        currentPassword,
        newPassword,
      };
      
      const result = await changePassword(changePasswordData);
      console.log('[CustomerDashboard] Password changed successfully:', result);
      
      setSuccessMessage('Lozinka je uspešno promenjena!');
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error: any) {
      console.error('[CustomerDashboard] Error changing password:', error);
      console.error('[CustomerDashboard] Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      alert(error.response?.data?.error || error.message || 'Greška pri promeni lozinke');
    } finally {
      setChangingPassword(false);
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

  const handleSelectAvatar = async (avatarUrl: string) => {
    setUploadingAvatar(true);
    try {
      // Ažuriraj samo avatarUrl - ne šalji name, email, phone da ne bi došlo do konflikta
      const result = await updateProfile({ 
        avatarUrl: avatarUrl
      } as UpdateProfileRequest);
      
      // Ažuriraj user u AuthContext i localStorage
      if (user) {
        const updatedAvatarUrl = avatarUrl || result.avatarUrl || null;
        const updatedUserData = { ...user, avatarUrl: updatedAvatarUrl };
        updateUser(updatedUserData); // Ažuriraj state u AuthContext-u
        
        setSuccessMessage('Avatar je uspešno izabran!');
        setShowAvatarPickerModal(false);
        
        // Force re-render da se avatar prikaže u Profile Modal-u i drugim mestima
        // React će automatski re-render-ovati komponente koje koriste user iz context-a
      }
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      // Ne briši token ako greška nije 401 (autentifikacija)
      if (error.response?.status === 401) {
        // Token je istekao ili pogrešan - interceptor će redirect-ovati
        // Ne prikazuj alert jer će doći do redirect-a
        return;
      }
      
      // Za ostale greške (400, 500, itd.), prikaži poruku ali ne redirect-uj
      const errorMessage = error.response?.data?.error || error.message || 'Greška pri izboru avatara';
      alert(errorMessage);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getAvatarSrc = (user: any) => {
    if (user?.avatarUrl) {
      // Ako je relativni put, dodaj base URL
      if (user.avatarUrl.startsWith('/')) {
        return `${STATIC_BASE_URL}${user.avatarUrl}`;
      }
      return user.avatarUrl;
    }
    return null;
  };

  // Predefinisani avatari - koristimo DiceBear "lorelei" (lepši/moderniji od personas)
  const getAvatarOptions = () => {
    const avatarSeeds: Array<{
      seed: string;
      gender: 'female' | 'male';
      /** Dodatne DiceBear query opcije (hair, hairColor, ...) */
      params?: Record<string, string>;
    }> = [
      // Muški: crna kosa (kratko) – (lorelei ne garantuje frizure kao personas, ali seed daje stabilan rezultat)
      {
        // Traženi avatar primer: https://api.dicebear.com/9.x/lorelei/svg?seed=Avery
        seed: 'Avery',
        gender: 'male',
        params: {},
      },
      // Muški: bez kose
      {
        seed: 'Destiny',
        gender: 'male',
        params: {},
      },
      // Ženski: crna kosa
      {
        seed: 'Luis',
        gender: 'female',
        params: {},
      },
      // Ženski: blondie
      {
        seed: 'Adian',
        gender: 'female',
        params: {
          // Lorelei schema: mouth=happyXX / sadXX, eyes=variantXX
          // Zaključaj na jednu "normalnu" varijantu osmeha
          mouth: 'happy05',
        },
      },
    ];
    
    // Lorelei stil (prijatniji "cartoon" izgled)
    return avatarSeeds.map((avatar, index) => ({
      id: index,
      url: (() => {
        // Jedna ista pozadina za sve avatere (plava)
        const base = `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(
          avatar.seed
        )}&backgroundColor=b6e3f4`;
        if (!avatar.params) return base;
        const extra = Object.entries(avatar.params)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&');
        return `${base}&${extra}`;
      })(),
      gender: avatar.gender,
      seed: avatar.seed
    }));
  };

  const avatarOptions = getAvatarOptions();

  const myAppointments = user?.id
    ? appointments.filter((apt) => apt.customer?.id === user.id)
    : appointments;

  const upcomingAppointments = myAppointments.filter(
    (apt) => apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED'
  );

  const completedAppointments = myAppointments.filter(
    (apt) => apt.status === 'COMPLETED'
  );

  // Izračunaj statistiku
  const stats = {
    total: myAppointments.length,
    upcoming: upcomingAppointments.length,
    completed: completedAppointments.length,
    reviews: Object.values(reviewChecks).filter(r => r.hasReview).length,
  };

  // Salon showcase (samo na klijentskom dashboardu). Zameni URL-ove svojim slikama kad budeš imao.
  const salonPhotos = [
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=70',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=70',
    'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a0df?auto=format&fit=crop&w=1200&q=70',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=70',
  ];
  // Lokacija salona (embed koristi query; "Otvori u Maps" može direktno na skraćeni link)
  // Koristimo bez dijakritike zbog Google embed-a (stabilnije pretrage)
  const mapsQuery = encodeURIComponent('Brace Jerkovic 72, Beograd');
  const mapsEmbedUrl = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;
  const mapsOpenUrl = 'https://maps.app.goo.gl/W2bK49uJ7vexeYXf7';
  const instagramUrl = 'https://www.instagram.com/vladee00/';
  const phoneDisplay = '069 794 079';

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 mx-6 mt-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
              <i className="fas fa-cut"></i>
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-gray-800">HairStudio</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-sm text-gray-500">Premium Salon</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowProfileModal(true)}
              className="px-6 py-2 text-gray-600 rounded-xl font-semibold hover:bg-gray-100 transition flex items-center gap-2"
            >
              {getAvatarSrc(user) ? (
                <img 
                  src={getAvatarSrc(user)!} 
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-300"
                />
              ) : (
                <i className="fas fa-user-circle text-2xl"></i>
              )}
              <span>Profil</span>
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
              {upcomingAppointments.length > 0 ? (
                <p className="text-xl opacity-90">
                  Imate <span className="font-bold">{upcomingAppointments.length}</span> predstojeća zakazivanja
                </p>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-xl opacity-90">Nemate predstojećih zakazivanja.</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSalonModal(true)}
                      className="px-4 py-2 bg-white/15 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition flex items-center gap-2"
                    >
                      <i className="fas fa-images"></i>
                      <span>Salon</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLocationModal(true)}
                      className="px-4 py-2 bg-white/15 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition flex items-center gap-2"
                    >
                      <i className="fas fa-map-marker-alt"></i>
                      <span>Lokacija</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate('/booking')}
              className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-bold text-lg hover:bg-gray-100 transition shadow-lg"
            >
              <i className="fas fa-plus mr-2"></i>Nova Rezervacija
            </button>
          </div>
        </div>

        {/* Main Content */}
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
                              {appointment.stylist.rating ? parseFloat(appointment.stylist.rating).toFixed(1) : '0.0'} ({appointment.stylist.totalReviews} ocena)
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowDetailsModal(true);
                            }}
                            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
                          >
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

            {/* Completed Appointments Section */}
            <div
              ref={historySectionRef}
              id="istorija-zavrsenih"
              className="bg-white rounded-2xl shadow-lg p-8 scroll-mt-24"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-check-double text-blue-600"></i>
                  </span>
                  Završene Rezervacije
                  <span className="text-lg font-normal text-gray-500 ml-2">
                    ({completedAppointments.length})
                  </span>
                </h3>
              </div>

              {completedAppointments.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <i className="fas fa-history text-2xl"></i>
                  </div>
                  <p className="text-lg font-bold text-gray-800 mb-1">Još nema završenih rezervacija</p>
                  <p className="text-gray-600 mb-6">
                    Kada završite prvi termin, ovde će se pojaviti istorija i mogućnost ocenjivanja frizera.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/booking')}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
                  >
                    <i className="fas fa-plus mr-2"></i>Zakaži termin
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {(showAllCompleted ? completedAppointments : completedAppointments.slice(0, COMPLETED_APPOINTMENTS_LIMIT)).map((appointment) => {
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
                                {appointment.stylist.rating ? parseFloat(appointment.stylist.rating).toFixed(1) : '0.0'} ({appointment.stylist.totalReviews} ocena)
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            {reviewChecks[appointment.id] ? (
                              reviewChecks[appointment.id].hasReview ? (
                                <div className="flex-1 px-4 py-3 bg-green-50 border-2 border-green-200 rounded-xl">
                                  <div className="flex items-center gap-2 text-green-700">
                                    <i className="fas fa-star text-yellow-400"></i>
                                    <span className="font-semibold">
                                      Ocenjeno: {reviewChecks[appointment.id].review?.rating}/5
                                    </span>
                                  </div>
                                  {reviewChecks[appointment.id].review?.comment && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      "{reviewChecks[appointment.id].review?.comment}"
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleOpenReviewModal(appointment)}
                                  className="flex-1 px-4 py-3 bg-yellow-100 text-yellow-700 rounded-xl font-semibold hover:bg-yellow-200 transition"
                                >
                                  <i className="fas fa-star mr-2"></i>Oceni Frizera
                                </button>
                              )
                            ) : (
                              <button
                                onClick={() => handleOpenReviewModal(appointment)}
                                className="flex-1 px-4 py-3 bg-yellow-100 text-yellow-700 rounded-xl font-semibold hover:bg-yellow-200 transition"
                              >
                                <i className="fas fa-star mr-2"></i>Oceni Frizera
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Show More/Less Button */}
                  {completedAppointments.length > COMPLETED_APPOINTMENTS_LIMIT && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => setShowAllCompleted(!showAllCompleted)}
                        className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-semibold hover:bg-indigo-200 transition flex items-center gap-2 mx-auto"
                      >
                        <i className={`fas fa-${showAllCompleted ? 'chevron-up' : 'chevron-down'}`}></i>
                        {showAllCompleted
                          ? `Prikaži manje (prikaži prvih ${COMPLETED_APPOINTMENTS_LIMIT})`
                          : `Prikaži sve (${completedAppointments.length - COMPLETED_APPOINTMENTS_LIMIT} više)`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right: Quick Actions & Stats */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-6 border-2 border-indigo-100">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Rezervacije</h3>
              <button
                type="button"
                onClick={scrollToCompletedHistory}
                className="w-full px-6 py-4 bg-white text-indigo-600 border-2 border-indigo-200 rounded-xl font-semibold hover:bg-indigo-50 transition"
              >
                <i className="fas fa-history mr-2"></i>Istorija
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Statistika</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-600">Ukupno rezervacija</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.total}</p>
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

            {/* Lokacija (mini mapa) */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-800">Lokacija</h3>
                <a
                  href={mapsOpenUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Otvori u Maps
                </a>
              </div>
              <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                <div className="aspect-[16/9]">
                  <iframe
                    title="Lokacija salona"
                    src={mapsEmbedUrl}
                    className="w-full h-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8">
          <div className="rounded-2xl shadow-lg overflow-hidden border border-white/10 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700">
            <div className="px-5 py-4 grid gap-4 md:grid-cols-3">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center text-white text-base shadow">
                    <i className="fas fa-cut"></i>
                  </div>
                  <div>
                    <p className="font-bold text-white">HairStudio</p>
                    <p className="text-xs text-white/80">Premium Salon</p>
                  </div>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  Braće Jerković 72 • Pon–Pet 08:00–16:00
                </p>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">Kontakt</p>
                <div className="space-y-1.5 text-xs text-white/85">
                  <p className="flex items-center gap-2">
                    <i className="fas fa-map-marker-alt text-white/80"></i>
                    Braće Jerković 72, Beograd
                  </p>
                  <p className="flex items-center gap-2">
                    <i className="fas fa-clock text-white/80"></i>
                    Radno vreme: Pon–Pet 08:00–16:00
                  </p>
                  <p className="flex items-center gap-2 text-white/90">
                    <i className="fas fa-phone text-white/80"></i>
                    {phoneDisplay}
                  </p>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-white/90 hover:text-white transition hover:underline underline-offset-4"
                  >
                    <i className="fab fa-instagram text-white/80"></i>
                    @vladee00
                  </a>
                </div>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">Salon</p>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowSalonModal(true)}
                    className="text-left text-xs font-semibold text-white/90 hover:text-white transition hover:underline underline-offset-4"
                  >
                    <i className="fas fa-images mr-2"></i>Galerija
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    className="text-left text-xs font-semibold text-white/90 hover:text-white transition hover:underline underline-offset-4"
                  >
                    <i className="fas fa-map mr-2"></i>Lokacija (mapa)
                  </button>
                  <a
                    href={mapsOpenUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-white/90 hover:text-white transition hover:underline underline-offset-4"
                  >
                    <i className="fas fa-external-link-alt mr-2"></i>Otvori u Google Maps
                  </a>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-black/15 border-t border-white/10 flex items-center justify-between flex-wrap gap-2">
              <p className="text-[11px] text-white/80">
                © {new Date().getFullYear()} HairStudio
              </p>
              <p className="text-[11px] text-white/60">Sva prava zadržana</p>
            </div>
          </div>
        </footer>

        {/* Scroll to top */}
        {showScrollTop && (
          <button
            type="button"
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-[40] w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 transition flex items-center justify-center"
            aria-label="Vrati na vrh"
            title="Vrati na vrh"
          >
            <i className="fas fa-arrow-up"></i>
          </button>
        )}

      {/* Profile Modal */}
      {showProfileModal && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <i className="fas fa-user-circle text-indigo-600"></i>
                Moj Profil
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-8 text-white shadow-xl">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {getAvatarSrc(user) ? (
                      <img 
                        src={getAvatarSrc(user)!} 
                        alt={user?.name}
                        className="w-24 h-24 rounded-2xl object-cover shadow-lg border-4 border-white border-opacity-30"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                        {user ? getInitials(user.name) : 'U'}
                      </div>
                    )}
                    <button
                      onClick={() => setShowAvatarPickerModal(true)}
                      className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition"
                      disabled={uploadingAvatar}
                    >
                      <i className="fas fa-camera text-sm"></i>
                    </button>
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-2xl flex items-center justify-center">
                        <i className="fas fa-spinner fa-spin text-white text-2xl"></i>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold mb-2">{user?.name}</h3>
                    <p className="text-xl opacity-90">{user?.email}</p>
                    {user?.phone && (
                      <p className="text-lg opacity-80 mt-1">
                        <i className="fas fa-phone mr-2"></i>{user.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Aktivne rezervacije</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.upcoming}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <i className="fas fa-clock text-blue-600 text-xl"></i>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Završene rezervacije</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <i className="fas fa-check-double text-green-600 text-xl"></i>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Ocene ostavljene</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.reviews}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <i className="fas fa-star text-yellow-600 text-xl"></i>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Info Card */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <i className="fas fa-user text-indigo-600"></i>
                    Lični podaci
                  </h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowProfileModal(false);
                        setShowEditProfileModal(true);
                      }}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
                    >
                      <i className="fas fa-edit mr-2"></i>Izmeni profil
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileModal(false);
                        setShowChangePasswordModal(true);
                      }}
                      className="px-6 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
                    >
                      <i className="fas fa-key mr-2"></i>Promeni lozinku
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <i className="fas fa-user text-indigo-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ime i prezime</p>
                      <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <i className="fas fa-envelope text-indigo-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-lg font-semibold text-gray-900">{user?.email}</p>
                    </div>
                  </div>
                  {user?.phone ? (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <i className="fas fa-phone text-indigo-600"></i>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Telefon</p>
                        <p className="text-lg font-semibold text-gray-900">{user.phone}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                        <i className="fas fa-phone text-gray-400"></i>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Telefon</p>
                        <p className="text-lg font-semibold text-gray-500">Nije unet</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <i className="fas fa-calendar text-indigo-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Član od</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('sr-RS', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">Detalji rezervacije</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedAppointment(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Service Info */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <i className="fas fa-scissors text-indigo-600"></i>
                  {selectedAppointment.service.name}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Kategorija</p>
                    <p className="font-semibold text-gray-900">{selectedAppointment.service.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Trajanje</p>
                    <p className="font-semibold text-gray-900">{selectedAppointment.service.duration} minuta</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Cena</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {parseInt(selectedAppointment.price).toLocaleString()} RSD
                    </p>
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <i className="fas fa-calendar-alt text-indigo-600"></i>
                  Datum i vreme
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-calendar text-gray-400 w-5"></i>
                    <p className="text-gray-700">
                      <span className="font-semibold">Datum:</span>{' '}
                      {new Date(selectedAppointment.date).toLocaleDateString('sr-RS', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <i className="fas fa-clock text-gray-400 w-5"></i>
                    <p className="text-gray-700">
                      <span className="font-semibold">Vreme:</span> {selectedAppointment.time}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <i className="fas fa-info-circle text-gray-400 w-5"></i>
                    <p className="text-gray-700">
                      <span className="font-semibold">Status:</span>{' '}
                      {selectedAppointment.status === 'PENDING' && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                          Čeka potvrdu
                        </span>
                      )}
                      {selectedAppointment.status === 'CONFIRMED' && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          Potvrđeno
                        </span>
                      )}
                      {selectedAppointment.status === 'COMPLETED' && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          Završeno
                        </span>
                      )}
                      {selectedAppointment.status === 'CANCELLED' && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                          Otkazano
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stylist Info */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <i className="fas fa-user-tie text-indigo-600"></i>
                  Frizer
                </h4>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {getInitials(selectedAppointment.stylist.name)}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{selectedAppointment.stylist.name}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <i className="fas fa-star text-yellow-400"></i>
                      {selectedAppointment.stylist.rating ? parseFloat(selectedAppointment.stylist.rating).toFixed(1) : '0.0'} 
                      <span className="text-gray-500">({selectedAppointment.stylist.totalReviews} ocena)</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <i className="fas fa-envelope mr-1"></i>
                      {selectedAppointment.stylist.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedAppointment.notes && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <i className="fas fa-sticky-note text-yellow-600"></i>
                    Napomene
                  </h4>
                  <p className="text-gray-700">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Created Date */}
              <div className="text-center text-sm text-gray-500">
                <p>
                  Rezervacija kreirana: {new Date(selectedAppointment.createdAt).toLocaleDateString('sr-RS', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedAppointment(null);
                }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Picker Modal */}
      {showAvatarPickerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <i className="fas fa-user-circle text-indigo-600"></i>
                Izaberi Avatar
              </h3>
              <button
                onClick={() => setShowAvatarPickerModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6 text-center">
                Klikni na avatar koji želiš da koristiš
              </p>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {avatarOptions.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => handleSelectAvatar(avatar.url)}
                    disabled={uploadingAvatar}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-all hover:scale-105 hover:shadow-lg ${
                      getAvatarSrc(user) === avatar.url
                        ? 'border-indigo-600 ring-4 ring-indigo-200'
                        : 'border-gray-200 hover:border-indigo-400'
                    } ${uploadingAvatar ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <img 
                      src={avatar.url} 
                      alt={`Avatar ${avatar.id + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {getAvatarSrc(user) === avatar.url && (
                      <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1">
                        <i className="fas fa-check text-xs"></i>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowAvatarPickerModal(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Otkaži
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <i className="fas fa-key text-indigo-600"></i>
                Promeni lozinku
              </h3>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-lock mr-2 text-indigo-500"></i>Trenutna lozinka
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                  placeholder="Unesite trenutnu lozinku"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-key mr-2 text-indigo-500"></i>Nova lozinka
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                  placeholder="Unesite novu lozinku (min 6 karaktera)"
                />
                <p className="text-xs text-gray-500 mt-1">Lozinka mora imati najmanje 6 karaktera</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-check-circle mr-2 text-indigo-500"></i>Potvrdi novu lozinku
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                  placeholder="Ponovo unesite novu lozinku"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Otkaži
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {changingPassword ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>Čuvanje...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>Promeni lozinku
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">Izmeni profil</h3>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-user mr-2 text-indigo-500"></i>Ime i prezime
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                  placeholder="Unesite ime i prezime"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-envelope mr-2 text-indigo-500"></i>Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                  placeholder="Unesite email"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-phone mr-2 text-indigo-500"></i>Telefon (opciono)
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                  placeholder="+381 64 123 4567"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Otkaži
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={updatingProfile}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {updatingProfile ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>Čuvanje...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>Sačuvaj
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedAppointment && (
        <ReviewModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedAppointment(null);
          }}
          onSuccess={async () => {
            setShowReviewModal(false);
            const appointmentToRefresh = selectedAppointment;
            setSelectedAppointment(null);
            
            console.log('[CustomerDashboard] Review created, refreshing appointments...');
            
            // Sačekaj malo da se backend ažurira
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Osveži appointment-e da bi se ažurirala ocena frizera
            // Forsira osvežavanje sa cache-busting parametrom
            await loadAppointments(true);
            
            // Proveri review status nakon osvežavanja
            if (appointmentToRefresh) {
              // Sačekaj malo da se podaci osveže
              setTimeout(() => {
                checkReview(appointmentToRefresh.id);
              }, 300);
            }
          }}
        />
      )}

      {/* Salon modal (galerija) */}
      {showSalonModal && (
        <div
          className="fixed inset-0 z-[55] bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Galerija salona"
          onClick={() => setShowSalonModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <i className="fas fa-images text-indigo-600"></i>
                Salon — galerija
              </h3>
              <button
                type="button"
                onClick={() => setShowSalonModal(false)}
                className="text-gray-500 hover:text-gray-800 text-xl leading-none"
                aria-label="Zatvori"
                title="Zatvori"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {salonPhotos.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setOpenSalonPhoto(src)}
                    className="group block rounded-xl overflow-hidden border border-gray-100"
                    title="Uvećaj"
                  >
                    <div className="relative aspect-[4/3] bg-gray-100">
                      <img
                        src={src}
                        alt={`Salon ${i + 1}`}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition"
                      />
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Klikni na sliku za uvećanje. ESC zatvara prozor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lokacija modal (mapa) */}
      {showLocationModal && (
        <div
          className="fixed inset-0 z-[55] bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Lokacija salona"
          onClick={() => setShowLocationModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-purple-600"></i>
                Lokacija
              </h3>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="text-gray-500 hover:text-gray-800 text-xl leading-none"
                aria-label="Zatvori"
                title="Zatvori"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                <div className="aspect-[16/10]">
                  <iframe
                    title="Lokacija salona"
                    src={mapsEmbedUrl}
                    className="w-full h-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-3">
                
                <a
                  href={mapsOpenUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Otvori u Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salon photo lightbox */}
      {openSalonPhoto && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Pregled slike salona"
          onClick={() => setOpenSalonPhoto(null)}
        >
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setOpenSalonPhoto(null)}
              className="absolute -top-3 -right-3 bg-white text-gray-800 w-10 h-10 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition"
              aria-label="Zatvori"
              title="Zatvori"
            >
              <i className="fas fa-times"></i>
            </button>
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={openSalonPhoto}
                alt="Salon"
                className="w-full h-auto max-h-[80vh] object-contain bg-black"
              />
              <div className="p-3 flex items-center justify-between text-sm text-gray-600">
                <span>Pritisni ESC ili klikni van slike da zatvoriš.</span>
                <a
                  href={openSalonPhoto}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Otvori u novom tabu
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

// Review Modal Component
interface ReviewModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ appointment, onClose, onSuccess }) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createReview({
        appointmentId: appointment.id,
        rating,
        comment: comment.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri kreiranju ocene');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-900">Oceni frizera</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <p className="text-sm text-gray-600 mb-2">Usluga: {appointment.service.name}</p>
            <p className="text-sm text-gray-600 mb-4">Frizer: {appointment.stylist.name}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Ocena *
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-4xl transition ${
                    star <= rating
                      ? 'text-yellow-400'
                      : 'text-gray-300 hover:text-yellow-300'
                  }`}
                >
                  <i className="fas fa-star"></i>
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              {rating === 1 && 'Loše'}
              {rating === 2 && 'Slabo'}
              {rating === 3 && 'Dobro'}
              {rating === 4 && 'Vrlo dobro'}
              {rating === 5 && 'Odlično'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Komentar (opciono)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
              placeholder="Podelite svoje iskustvo..."
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Otkaži
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>Čuvanje...
                </>
              ) : (
                <>
                  <i className="fas fa-star mr-2"></i>Pošalji ocenu
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerDashboard;

