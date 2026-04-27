// Admin Dashboard - Glavna stranica za administratore

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getStats, 
  AdminStats, 
  getUsers,
  createUser,
  AdminUser,
  getStylists as getAdminStylists,
  AdminStylist,
  createStylist,
  CreateStylistRequest,
  updateStylist,
  updateUser,
  deleteUser,
  deleteStylist,
  getAppointments,
  AdminAppointment,
  deleteAppointment,
  assignServicesToStylist
} from '../services/adminService';
import { getServices, Service } from '../services/serviceService';
import { updateAppointment } from '../services/appointmentService';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stylists, setStylists] = useState<AdminStylist[]>([]);
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [stylistsLoading, setStylistsLoading] = useState(false);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'stylists' | 'appointments'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'STYLIST' | 'ADMIN'>('ALL');
  const [stylistSearchTerm, setStylistSearchTerm] = useState('');
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [showCreateStylistModal, setShowCreateStylistModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showEditStylistModal, setShowEditStylistModal] = useState(false);
  const [showAssignServicesModal, setShowAssignServicesModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<AdminStylist | null>(null);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const APPOINTMENTS_LIMIT = 5; // Prikaži prvih 5, ostale na "Prikaži više"
  const USERS_LIMIT = 5; // Prikaži prvih 5, ostale na "Prikaži više"
  const statsLoadId = useRef(0);

  useEffect(() => {
    if (activeTab === 'overview') {
      loadStats();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'stylists') {
      loadStylists();
      loadServices();
    } else if (activeTab === 'appointments') {
      loadAppointments();
    }
  }, [activeTab]);

  const loadStats = async () => {
    const id = ++statsLoadId.current;
    try {
      setLoading(true);
      const data = await getStats();
      if (id !== statsLoadId.current) return;
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      if (id === statsLoadId.current) setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadStylists = async () => {
    try {
      setStylistsLoading(true);
      const data = await getAdminStylists();
      setStylists(data);
    } catch (error) {
      console.error('Error loading stylists:', error);
    } finally {
      setStylistsLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const data = await getServices();
      setServices(data.filter(s => s.isActive));
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      setAppointmentsLoading(true);
      const data = await getAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  // CRUD Functions for Users
  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovog korisnika?')) {
      return;
    }
    try {
      await deleteUser(userId);
      await loadUsers();
      alert('Korisnik je uspešno obrisan');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Greška pri brisanju korisnika');
    }
  };

  // CRUD Functions for Stylists
  const handleEditStylist = (stylist: AdminStylist) => {
    setSelectedStylist(stylist);
    setShowEditStylistModal(true);
  };

  const handleDeleteStylist = async (stylistId: number) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovog frizera?')) {
      return;
    }
    try {
      await deleteStylist(stylistId);
      await loadStylists();
      alert('Frizer je uspešno obrisan');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Greška pri brisanju frizera');
    }
  };

  const handleAssignServices = (stylist: AdminStylist) => {
    setSelectedStylist(stylist);
    setShowAssignServicesModal(true);
  };

  const formatCurrency = (amount: number | string) => {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0,
    }).format(Number.isFinite(n) ? n : 0);
  };

  const formatDate = (dateString: string) => {
    const s = String(dateString ?? '');
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    const ymd = m ? m[1] : s.slice(0, 10);
    const d = new Date(`${ymd}T12:00:00`);
    if (Number.isNaN(d.getTime())) return ymd;
    return d.toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatAppointmentDisplayDate = (dateVal: string) => {
    const s = String(dateVal ?? '');
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    const ymd = m ? m[1] : s.slice(0, 10);
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

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      CUSTOMER: 'Klijent',
      STYLIST: 'Frizer',
      ADMIN: 'Admin',
    };
    return labels[role] || role;
  };

  const getRoleBadge = (role: string) => {
    const styles: { [key: string]: string } = {
      CUSTOMER: 'bg-blue-100 text-blue-700',
      STYLIST: 'bg-purple-100 text-purple-700',
      ADMIN: 'bg-red-100 text-red-700',
    };
    return styles[role] || 'bg-gray-100 text-gray-700';
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

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch = 
      appointment.customer.name.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
      appointment.stylist.name.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
      appointment.service.name.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
      (appointment.customer.email && appointment.customer.email.toLowerCase().includes(appointmentSearchTerm.toLowerCase()));
    
    const matchesStatus = appointmentStatusFilter === 'ALL' || appointment.status === appointmentStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleUpdateAppointmentStatus = async (appointmentId: number, newStatus: string) => {
    try {
      await updateAppointment(appointmentId, { status: newStatus });
      await loadAppointments();
      alert('Status rezervacije je uspešno ažuriran');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Greška pri ažuriranju statusa rezervacije');
    }
  };

  const handleDeleteAppointment = async (appointmentId: number) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovu rezervaciju?')) {
      return;
    }
    try {
      await deleteAppointment(appointmentId);
      await loadAppointments();
      alert('Rezervacija je uspešno obrisana');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Greška pri brisanju rezervacije');
    }
  };

  // Filtrirane korisnike
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm));
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Filtrirani frizeri
  const filteredStylists = stylists.filter((stylist) => {
    return stylist.name.toLowerCase().includes(stylistSearchTerm.toLowerCase()) ||
           stylist.email.toLowerCase().includes(stylistSearchTerm.toLowerCase()) ||
           (stylist.phone && stylist.phone.includes(stylistSearchTerm));
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 mx-4 sm:mx-6 mt-4 sm:mt-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl shadow-lg">
              <i className="fas fa-cut"></i>
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">HairStudio</h2>
              <p className="text-sm text-gray-500">Admin Panel</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="text-left sm:text-right min-w-0">
              <p className="text-sm text-gray-600">Dobrodošli,</p>
              <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2 shrink-0"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Odjavi se</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-6">
        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-6">
          <div className="grid grid-cols-2 lg:flex lg:flex-nowrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`lg:flex-1 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className="fas fa-chart-line mr-1 sm:mr-2"></i>Pregled
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`lg:flex-1 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className="fas fa-users mr-1 sm:mr-2"></i>Korisnici
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stylists')}
              className={`lg:flex-1 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition ${
                activeTab === 'stylists'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className="fas fa-user-tie mr-1 sm:mr-2"></i>Frizeri
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('appointments')}
              className={`lg:flex-1 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition ${
                activeTab === 'appointments'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className="fas fa-calendar mr-1 sm:mr-2"></i>Rezervacije
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Pregled sistema</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <i className="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
                <p className="text-gray-600">Učitavanje statistika...</p>
              </div>
            ) : stats ? (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
                  {/* Total Users */}
                  <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 border-indigo-500 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1 leading-tight">Ukupno korisnika</p>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">{stats.users.total}</p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <i className="fas fa-users text-indigo-600 text-lg sm:text-xl"></i>
                      </div>
                    </div>
                  </div>

                  {/* Active Stylists */}
                  <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 border-purple-500 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1 leading-tight">Aktivni frizeri</p>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">{stats.stylists.active}</p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-purple-100 rounded-xl flex items-center justify-center">
                        <i className="fas fa-user-tie text-purple-600 text-lg sm:text-xl"></i>
                      </div>
                    </div>
                  </div>

                  {/* Total Appointments */}
                  <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 border-green-500 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1 leading-tight">Ukupno rezervacija</p>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">{stats.appointments.total}</p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-green-100 rounded-xl flex items-center justify-center">
                        <i className="fas fa-calendar-check text-green-600 text-lg sm:text-xl"></i>
                      </div>
                    </div>
                  </div>

                  {/* Total Revenue */}
                  <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 border-yellow-500 min-w-0 col-span-2 lg:col-span-1">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1 leading-tight">Ukupan prihod</p>
                        <p className="text-[11px] sm:text-xs text-gray-500 mb-1 leading-snug">
                          Zbir cena svih rezervacija sa statusom <span className="font-semibold">Završeno</span> (ceo salon).
                        </p>
                        <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words leading-tight">
                          {formatCurrency(stats.revenue.total)}
                        </p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <i className="fas fa-money-bill-wave text-yellow-600 text-lg sm:text-xl"></i>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appointments by Status */}
                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Rezervacije po statusu</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                    {stats.appointments.byStatus.map((statusItem) => (
                      <div key={statusItem.status} className="text-center p-3 sm:p-4 bg-gray-50 rounded-xl min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1 leading-tight">
                          {statusItem.status === 'PENDING' && 'Čeka potvrdu'}
                          {statusItem.status === 'CONFIRMED' && 'Potvrđeno'}
                          {statusItem.status === 'COMPLETED' && 'Završeno'}
                          {statusItem.status === 'CANCELLED' && 'Otkazano'}
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 tabular-nums">{statusItem.count}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Services — samo završeni termini (COMPLETED), kao i „Ukupan prihod“ */}
                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Najpopularnije usluge</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mb-4 leading-relaxed">
                    Za svaku uslugu: koliko puta je termin <span className="font-semibold text-gray-700">označen kao završen</span>,
                    i koliki je <span className="font-semibold text-gray-700">zbir cena</span> tih završenih termina (RSD).
                  </p>
                  <div className="space-y-3">
                    {stats.popularServices.map((service, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-xl"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 break-words">{service.name}</p>
                          <p className="text-sm text-gray-600">{service.category}</p>
                        </div>
                        <div className="text-left sm:text-right shrink-0 space-y-0.5">
                          <p className="text-sm text-gray-700">
                            Broj završenih:{' '}
                            <span className="font-bold text-indigo-600">{service.count}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Prihod (zbir cena): {formatCurrency(parseFloat(service.revenue || '0'))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Greška pri učitavanju statistika</p>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 min-w-0">Upravljanje korisnicima</h2>
              <button
                type="button"
                onClick={() => setShowCreateUserModal(true)}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shrink-0"
              >
                <i className="fas fa-plus"></i>
                <span>Novi korisnik</span>
              </button>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="fas fa-search mr-2 text-indigo-500"></i>Pretraga
                  </label>
                  <input
                    type="text"
                    placeholder="Pretraži po imenu, email-u ili telefonu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="fas fa-filter mr-2 text-indigo-500"></i>Filtriraj po ulozi
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                  >
                    <option value="ALL">Sve uloge</option>
                    <option value="CUSTOMER">Klijent</option>
                    <option value="STYLIST">Frizer</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              {usersLoading ? (
                <div className="text-center py-12">
                  <i className="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
                  <p className="text-gray-600">Učitavanje korisnika...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-users-slash text-6xl text-gray-300 mb-4"></i>
                  <p className="text-gray-600">Nema korisnika</p>
                </div>
              ) : (
                <>
                  <div className="md:hidden space-y-4">
                    {(showAllUsers ? filteredUsers : filteredUsers.slice(0, USERS_LIMIT)).map((u) => (
                      <div key={u.id} className="border-2 border-gray-100 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-900 break-words">{u.name}</span>
                        </div>
                        <p className="text-sm text-gray-700 break-all">{u.email}</p>
                        <p className="text-sm text-gray-600">{u.phone || '—'}</p>
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getRoleBadge(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                        <p className="text-xs text-gray-500">Registracija: {formatDate(u.createdAt)}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleEditUser(u)}
                            className="flex-1 min-w-[120px] px-3 py-2.5 bg-indigo-100 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-200 transition"
                          >
                            <i className="fas fa-edit mr-1"></i>Izmeni
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.role === 'ADMIN'}
                            className={`flex-1 min-w-[120px] px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                              u.role === 'ADMIN'
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            <i className="fas fa-trash mr-1"></i>Obriši
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="border-b-2 border-gray-200 bg-gray-50">
                          <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Ime</th>
                          <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Email</th>
                          <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Telefon</th>
                          <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Uloga</th>
                          <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Datum registracije</th>
                          <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Akcije</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(showAllUsers ? filteredUsers : filteredUsers.slice(0, USERS_LIMIT)).map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="py-3 px-3 align-top">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-gray-900 break-words">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-gray-700 break-all max-w-[220px]">{user.email}</td>
                          <td className="py-3 px-3 text-gray-700 whitespace-nowrap">{user.phone || '-'}</td>
                          <td className="py-3 px-3 align-top">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleBadge(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-gray-600 text-sm whitespace-nowrap">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="py-3 px-3 align-top">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditUser(user)}
                                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-200 transition"
                              >
                                <i className="fas fa-edit mr-1"></i>Izmeni
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={user.role === 'ADMIN'}
                                className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                                  user.role === 'ADMIN'
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                              >
                                <i className="fas fa-trash mr-1"></i>Obriši
                              </button>
                            </div>
                          </td>
                        </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredUsers.length > USERS_LIMIT && (
                    <div className="mt-6 text-center px-1">
                      <button
                        type="button"
                        onClick={() => setShowAllUsers(!showAllUsers)}
                        className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-semibold hover:bg-indigo-200 transition inline-flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <i className={`fas fa-${showAllUsers ? 'chevron-up' : 'chevron-down'}`}></i>
                        {showAllUsers
                          ? `Prikaži manje (prvih ${USERS_LIMIT})`
                          : `Prikaži sve (${filteredUsers.length - USERS_LIMIT} više)`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

            {/* Stylists Tab */}
        {activeTab === 'stylists' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 min-w-0">Upravljanje frizerima</h2>
              <button
                type="button"
                onClick={() => setShowCreateStylistModal(true)}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shrink-0"
              >
                <i className="fas fa-plus"></i>
                <span>Novi frizer</span>
              </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="fas fa-search mr-2 text-indigo-500"></i>Pretraga frizera
              </label>
              <input
                type="text"
                placeholder="Pretraži po imenu, email-u ili telefonu..."
                value={stylistSearchTerm}
                onChange={(e) => setStylistSearchTerm(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
              />
            </div>

            {/* Stylists List */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              {stylistsLoading ? (
                <div className="text-center py-12">
                  <i className="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
                  <p className="text-gray-600">Učitavanje frizera...</p>
                </div>
              ) : filteredStylists.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-user-tie text-6xl text-gray-300 mb-4"></i>
                  <p className="text-gray-600 mb-4">Nema frizera</p>
                  <button
                    onClick={() => setShowCreateStylistModal(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
                  >
                    <i className="fas fa-plus mr-2"></i>Dodaj prvog frizera
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredStylists.map((stylist) => (
                    <div
                      key={stylist.stylistId}
                      className="border-2 border-gray-200 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition min-w-0"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 mb-4 min-w-0">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg">
                          {stylist.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .substring(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-base sm:text-lg break-words">{stylist.name}</h3>
                          <p className="text-sm text-gray-600 flex flex-wrap items-center gap-1">
                            <i className="fas fa-star text-yellow-400"></i>
                            {stylist.rating} ({stylist.totalReviews} ocena)
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4 min-w-0">
                        <p className="text-sm text-gray-600 break-all">
                          <i className="fas fa-envelope mr-2 text-indigo-500 shrink-0"></i>
                          {stylist.email}
                        </p>
                        {stylist.phone && (
                          <p className="text-sm text-gray-600">
                            <i className="fas fa-phone mr-2 text-indigo-500"></i>
                            {stylist.phone}
                          </p>
                        )}
                        {stylist.bio && (
                          <p className="text-sm text-gray-600 line-clamp-2">{stylist.bio}</p>
                        )}
                        <p className="text-sm text-gray-600">
                          <i className="fas fa-briefcase mr-2 text-indigo-500"></i>
                          {stylist.yearsOfExperience} godina iskustva
                        </p>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            stylist.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {stylist.isActive ? 'Aktivan' : 'Neaktivan'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditStylist(stylist)}
                          className="flex-1 min-w-[100px] px-3 sm:px-4 py-2.5 bg-indigo-100 text-indigo-700 rounded-xl font-semibold hover:bg-indigo-200 transition text-sm"
                        >
                          <i className="fas fa-edit mr-1"></i>Izmeni
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAssignServices(stylist)}
                          className="flex-1 min-w-[100px] px-3 sm:px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition text-sm"
                        >
                          <i className="fas fa-cog mr-1"></i>Usluge
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStylist(stylist.stylistId)}
                          className="px-4 py-2.5 bg-red-100 text-red-700 rounded-xl font-semibold hover:bg-red-200 transition text-sm shrink-0"
                          title="Obriši frizera"
                        >
                          <i className="fas fa-trash sm:mr-1"></i>
                          <span className="hidden sm:inline">Obriši</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Upravljanje rezervacijama</h2>

            {/* Search and Filter */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="fas fa-search mr-2 text-indigo-500"></i>Pretraga
                  </label>
                  <input
                    type="text"
                    placeholder="Pretraži po klijentu, frizeru ili usluzi..."
                    value={appointmentSearchTerm}
                    onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="fas fa-filter mr-2 text-indigo-500"></i>Filtriraj po statusu
                  </label>
                  <select
                    value={appointmentStatusFilter}
                    onChange={(e) => setAppointmentStatusFilter(e.target.value as any)}
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
            </div>

            {/* Appointments List */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
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
                    {(showAllAppointments ? filteredAppointments : filteredAppointments.slice(0, APPOINTMENTS_LIMIT)).map(
                      (appointment) => (
                        <div key={appointment.id} className="border-2 border-gray-100 rounded-2xl p-4 space-y-3">
                          <div className="flex flex-wrap justify-between gap-2 border-b border-gray-100 pb-3">
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
                              Frizer
                            </p>
                            <p className="font-semibold text-gray-900 break-words">{appointment.stylist.name}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <i className="fas fa-star text-yellow-400"></i>
                              {appointment.stylist.rating}
                            </p>
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
                          {appointment.notes?.trim() && (
                            <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                              <span className="font-semibold text-gray-600">Napomena: </span>
                              <span className="break-words whitespace-pre-wrap">{appointment.notes}</span>
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                            <select
                              value={appointment.status}
                              onChange={(e) => handleUpdateAppointmentStatus(appointment.id, e.target.value)}
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
                          <button
                            type="button"
                            onClick={() => handleDeleteAppointment(appointment.id)}
                            className="w-full px-3 py-2.5 bg-red-100 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-200 transition"
                          >
                            <i className="fas fa-trash mr-1"></i>Obriši rezervaciju
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full min-w-[960px]">
                      <thead>
                        <tr className="border-b-2 border-gray-200 bg-gray-50">
                          <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Datum i vreme</th>
                          <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Klijent</th>
                          <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Frizer</th>
                          <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Usluga</th>
                          <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700 min-w-[10rem] max-w-xs">
                            Napomena
                          </th>
                          <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Cena</th>
                          <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Akcije</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(showAllAppointments ? filteredAppointments : filteredAppointments.slice(0, APPOINTMENTS_LIMIT)).map(
                          (appointment) => (
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
                                  <p className="font-semibold text-gray-900 break-words">{appointment.stylist.name}</p>
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <i className="fas fa-star text-yellow-400"></i>
                                    {appointment.stylist.rating}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3 px-3 align-top">
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-900 break-words">{appointment.service.name}</p>
                                  <p className="text-sm text-gray-600">{appointment.service.category}</p>
                                  <p className="text-xs text-gray-500">{appointment.service.duration} min</p>
                                </div>
                              </td>
                              <td className="py-3 px-3 max-w-xs align-top">
                                {appointment.notes?.trim() ? (
                                  <p
                                    className="text-sm text-gray-700 whitespace-pre-wrap break-words"
                                    title={appointment.notes}
                                  >
                                    {appointment.notes}
                                  </p>
                                ) : (
                                  <span className="text-sm text-gray-400">—</span>
                                )}
                              </td>
                              <td className="py-3 px-3 align-top">
                                <select
                                  value={appointment.status}
                                  onChange={(e) => handleUpdateAppointmentStatus(appointment.id, e.target.value)}
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
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAppointment(appointment.id)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition"
                                >
                                  <i className="fas fa-trash mr-1"></i>Obriši
                                </button>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredAppointments.length > APPOINTMENTS_LIMIT && (
                    <div className="mt-6 text-center px-1">
                      <button
                        type="button"
                        onClick={() => setShowAllAppointments(!showAllAppointments)}
                        className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-semibold hover:bg-indigo-200 transition inline-flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <i className={`fas fa-${showAllAppointments ? 'chevron-up' : 'chevron-down'}`}></i>
                        {showAllAppointments
                          ? `Prikaži manje (prvih ${APPOINTMENTS_LIMIT})`
                          : `Prikaži sve (${filteredAppointments.length - APPOINTMENTS_LIMIT} više)`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Stylist Modal */}
      {showCreateStylistModal && (
        <CreateStylistModal
          onClose={() => setShowCreateStylistModal(false)}
          onSuccess={() => {
            setShowCreateStylistModal(false);
            loadStylists();
          }}
          services={services}
        />
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <CreateUserModal
          onClose={() => setShowCreateUserModal(false)}
          onSuccess={() => {
            setShowCreateUserModal(false);
            loadUsers();
          }}
        />
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditUserModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowEditUserModal(false);
            setSelectedUser(null);
            loadUsers();
          }}
        />
      )}

      {/* Edit Stylist Modal */}
      {showEditStylistModal && selectedStylist && (
        <EditStylistModal
          stylist={selectedStylist}
          onClose={() => {
            setShowEditStylistModal(false);
            setSelectedStylist(null);
          }}
          onSuccess={() => {
            setShowEditStylistModal(false);
            setSelectedStylist(null);
            loadStylists();
          }}
        />
      )}

      {/* Assign Services Modal */}
      {showAssignServicesModal && selectedStylist && (
        <AssignServicesModal
          stylist={selectedStylist}
          services={services}
          onClose={() => {
            setShowAssignServicesModal(false);
            setSelectedStylist(null);
          }}
          onSuccess={() => {
            setShowAssignServicesModal(false);
            setSelectedStylist(null);
            loadStylists();
          }}
        />
      )}
    </div>
  );
};

// Create Stylist Modal Component
interface CreateStylistModalProps {
  onClose: () => void;
  onSuccess: () => void;
  services: Service[];
}

const CreateStylistModal: React.FC<CreateStylistModalProps> = ({ onClose, onSuccess, services }) => {
  const [formData, setFormData] = useState<CreateStylistRequest>({
    name: '',
    email: '',
    password: '',
    phone: '',
    bio: '',
    yearsOfExperience: 0,
  });
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createStylist(formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri kreiranju frizera');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceId: number) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((id) => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-start gap-3">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 min-w-0 break-words pr-2">Kreiraj novog frizera</h3>
          <button
            onClick={onClose}
            className="shrink-0 text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ime i prezime *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                placeholder="Ime i prezime"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lozinka *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                placeholder="Min. 6 karaktera"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                placeholder="+381 64 123 4567"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Godine iskustva
              </label>
              <input
                type="number"
                min="0"
                value={formData.yearsOfExperience}
                onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bio / Opis
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
              placeholder="Kratak opis frizera, specijalizacija..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Usluge koje radi (opciono)
            </label>
            <div className="border-2 border-gray-200 rounded-xl p-4 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service.id)}
                      onChange={() => toggleService(service.id)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{service.name}</span>
                  </label>
                ))}
              </div>
            </div>
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
                  <i className="fas fa-spinner fa-spin mr-2"></i>Kreiranje...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-2"></i>Kreiraj frizera
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Create User Modal Component
interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
      });
      onSuccess();
    } catch (err: any) {
      const d = err.response?.data;
      const status = err.response?.status;
      if (status === 404) {
        setError(
          'Backend nema rutu za kreiranje korisnika. Zaustavi pa ponovo pokreni backend (npr. npm run dev u folderu backend).'
        );
      } else if (typeof d === 'string') {
        setError('Greška servera. Proveri da li backend radi na portu 3000.');
      } else {
        const parts = [d?.error, d?.details].filter(Boolean);
        setError(parts.length ? parts.join(' — ') : err.message || 'Greška pri kreiranju korisnika');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-start gap-3">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 min-w-0 break-words pr-2">Kreiraj novog korisnika</h3>
          <button
            onClick={onClose}
            className="shrink-0 text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ime i prezime *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
              placeholder="Ime i prezime"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Lozinka *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
              placeholder="Min. 6 karaktera"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Telefon
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
              placeholder="+381 64 123 4567"
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
                  <i className="fas fa-spinner fa-spin mr-2"></i>Kreiranje...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-2"></i>Kreiraj korisnika
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit User Modal Component
interface EditUserModalProps {
  user: AdminUser;
  onClose: () => void;
  onSuccess: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updateUser(user.id, formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri ažuriranju korisnika');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-start gap-3">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 min-w-0 break-words pr-2">Izmeni korisnika</h3>
          <button
            onClick={onClose}
            className="shrink-0 text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ime i prezime *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Telefon
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Uloga *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
            >
              <option value="CUSTOMER">Klijent</option>
              <option value="STYLIST">Frizer</option>
              <option value="ADMIN">Admin</option>
            </select>
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
                  <i className="fas fa-save mr-2"></i>Sačuvaj izmene
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Stylist Modal Component
interface EditStylistModalProps {
  stylist: AdminStylist;
  onClose: () => void;
  onSuccess: () => void;
}

const EditStylistModal: React.FC<EditStylistModalProps> = ({ stylist, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: stylist.name,
    email: stylist.email,
    phone: stylist.phone || '',
    bio: stylist.bio || '',
    yearsOfExperience: stylist.yearsOfExperience || 0,
    isActive: stylist.isActive,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updateStylist(stylist.stylistId, formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri ažuriranju frizera');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-start gap-3">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 min-w-0 break-words pr-2">Izmeni frizera</h3>
          <button
            onClick={onClose}
            className="shrink-0 text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ime i prezime *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Godine iskustva
              </label>
              <input
                type="number"
                min="0"
                value={formData.yearsOfExperience}
                onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bio / Opis
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm font-semibold text-gray-700">Aktivan frizer</span>
            </label>
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
                  <i className="fas fa-save mr-2"></i>Sačuvaj izmene
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Assign Services Modal Component
interface AssignServicesModalProps {
  stylist: AdminStylist;
  services: Service[];
  onClose: () => void;
  onSuccess: () => void;
}

const AssignServicesModal: React.FC<AssignServicesModalProps> = ({ stylist, services, onClose, onSuccess }) => {
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStylistServices = async () => {
      try {
        const { getStylistServices } = await import('../services/stylistService');
        const stylistServices = await getStylistServices(stylist.userId);
        setSelectedServices(stylistServices.map((s: any) => s.id));
      } catch (err) {
        console.error('Error loading stylist services:', err);
      }
    };
    loadStylistServices();
  }, [stylist.userId]);

  const toggleService = (serviceId: number) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((id) => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await assignServicesToStylist(stylist.stylistId, selectedServices);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri dodeli usluga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-start gap-3">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 min-w-0 break-words pr-2">Dodela usluga - {stylist.name}</h3>
          <button
            onClick={onClose}
            className="shrink-0 text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Izaberite usluge koje {stylist.name} može da radi:
            </label>
            <div className="border-2 border-gray-200 rounded-xl p-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border-2 border-transparent hover:border-indigo-200 transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service.id)}
                      onChange={() => toggleService(service.id)}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-900">{service.name}</span>
                      <p className="text-xs text-gray-600">{service.category}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
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
                  <i className="fas fa-save mr-2"></i>Sačuvaj izmene
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;

