// Booking komponenta - Forma za kreiranje rezervacije

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices, Service } from '../services/serviceService';
import { getStylists, Stylist } from '../services/stylistService';
import { getStylistServices } from '../services/stylistService';
import { createAppointment, CreateAppointmentRequest } from '../services/appointmentService';
import { useAuth } from '../context/AuthContext';

type BookingStep = 1 | 2 | 3 | 4;

const Booking: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState<BookingStep>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [availableStylists, setAvailableStylists] = useState<Stylist[]>([]);
  
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Učitaj usluge i frizere
  useEffect(() => {
    loadData();
  }, []);

  // Kada se promeni usluga, učitaj frizere koji rade tu uslugu
  useEffect(() => {
    console.log('useEffect triggered:', { selectedService: selectedService?.id, stylistsLength: stylists.length });
    if (selectedService && stylists.length > 0) {
      console.log('Calling loadStylistsForService for service:', selectedService.id);
      loadStylistsForService(selectedService.id);
    } else if (selectedService && stylists.length === 0) {
      console.warn('Stylists not loaded yet, waiting...');
    }
  }, [selectedService, stylists]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [servicesData, stylistsData] = await Promise.all([
        getServices(),
        getStylists(),
      ]);
      console.log('Loaded services:', servicesData);
      console.log('Loaded stylists:', stylistsData);
      setServices(servicesData.filter(s => s.isActive));
      setStylists(stylistsData);
    } catch (error: any) {
      setError('Greška pri učitavanju podataka');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStylistsForService = async (serviceId: number) => {
    try {
      console.log('Loading stylists for service:', serviceId);
      console.log('Available stylists:', stylists);
      
      // Učitaj sve frizere koji rade tu uslugu
      const stylistServicePromises = stylists.map(async (stylist) => {
        try {
          console.log(`Checking stylist ${stylist.id} (${stylist.name})`);
          const stylistServices = await getStylistServices(stylist.id);
          console.log(`Stylist ${stylist.id} services:`, stylistServices);
          
          // stylistServices je array sa {id, name, price}
          const hasService = stylistServices.some(ss => ss.id === serviceId);
          console.log(`Stylist ${stylist.id} has service ${serviceId}:`, hasService);
          
          return hasService ? stylist : null;
        } catch (error) {
          console.error(`Error loading services for stylist ${stylist.id}:`, error);
          return null;
        }
      });
      
      const stylistsWithService = (await Promise.all(stylistServicePromises)).filter(
        (s): s is Stylist => s !== null
      );
      
      console.log('Available stylists for service:', stylistsWithService);
      setAvailableStylists(stylistsWithService);
    } catch (error) {
      console.error('Error loading stylists for service:', error);
      setAvailableStylists([]);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedStylist(null); // Resetuj frizera
    setAvailableStylists([]); // Resetuj
    setCurrentStep(2);
    // loadStylistsForService će se pozvati automatski u useEffect kada se promeni selectedService
  };

  const handleStylistSelect = (stylist: Stylist) => {
    setSelectedStylist(stylist);
    setCurrentStep(3);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    // Resetuj vreme kada se promeni datum
    setSelectedTime('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCurrentStep(4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedStylist || !selectedDate || !selectedTime) {
      setError('Molimo popunite sva obavezna polja');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const appointmentData: CreateAppointmentRequest = {
        stylistId: selectedStylist.id,
        serviceId: selectedService.id,
        date: selectedDate,
        time: selectedTime,
        notes: notes.trim() || undefined,
      };

      await createAppointment(appointmentData);
      
      // Redirect na dashboard sa porukom o uspehu
      navigate('/dashboard?booking=success');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri kreiranju rezervacije');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      MENS_HAIRCUT: 'Muško šišanje',
      BEARD: 'Brada',
      WOMENS_HAIRCUT: 'Žensko šišanje',
      COLORING: 'Farbanje',
      CARE: 'Nega',
    };
    return labels[category] || category;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Generiši dostupna vremena (8:00 - 18:00, svakih 30 minuta)
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 8; hour < 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  // Minimalna datum - danas
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Grupiši usluge po kategorijama
  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i>
            Nazad na Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Nova Rezervacija</h1>
          <p className="text-gray-600 mt-2">Izaberite uslugu, frizera i termin</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition ${
                      currentStep >= step
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step ? <i className="fas fa-check"></i> : step}
                  </div>
                  <span
                    className={`mt-2 text-sm font-semibold ${
                      currentStep >= step ? 'text-indigo-600' : 'text-gray-500'
                    }`}
                  >
                    {step === 1 && 'Usluga'}
                    {step === 2 && 'Frizer'}
                    {step === 3 && 'Datum & Vreme'}
                    {step === 4 && 'Pregled'}
                  </span>
                </div>
                {step < 4 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      currentStep > step ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* STEP 1: Izbor usluge */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Izaberite uslugu</h2>
              <div className="space-y-6">
                {Object.entries(groupedServices).map(([category, categoryServices]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">
                      {getCategoryLabel(category)}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {categoryServices.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => handleServiceSelect(service)}
                          className="text-left p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition text-left"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-lg font-bold text-gray-900">{service.name}</h4>
                            <span className="text-indigo-600 font-bold">
                              {parseInt(service.price).toLocaleString()} RSD
                            </span>
                          </div>
                          {service.description && (
                            <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>
                              <i className="fas fa-clock mr-1"></i>
                              {service.duration} min
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Izbor frizera */}
          {currentStep === 2 && selectedService && (
            <div>
              <div className="mb-6">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-2"
                >
                  <i className="fas fa-arrow-left"></i>
                  Nazad
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Izaberite frizera</h2>
                <p className="text-gray-600 mt-2">Za uslugu: {selectedService.name}</p>
              </div>

              {availableStylists.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-user-slash text-6xl text-gray-300 mb-4"></i>
                  <p className="text-gray-600">Nema dostupnih frizera za ovu uslugu</p>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
                  >
                    Izaberi drugu uslugu
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {availableStylists.map((stylist) => (
                    <button
                      key={stylist.id}
                      onClick={() => handleStylistSelect(stylist)}
                      className="text-left p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                          {getInitials(stylist.name)}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{stylist.name}</h4>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <i className="fas fa-star text-yellow-400"></i>
                            {stylist.rating} ({stylist.totalReviews} ocena)
                          </p>
                        </div>
                      </div>
                      {stylist.bio && (
                        <p className="text-sm text-gray-600">{stylist.bio}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Izbor datuma i vremena */}
          {currentStep === 3 && selectedService && selectedStylist && (
            <div>
              <div className="mb-6">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-2"
                >
                  <i className="fas fa-arrow-left"></i>
                  Nazad
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Izaberite datum i vreme</h2>
                <p className="text-gray-600 mt-2">
                  {selectedService.name} • {selectedStylist.name}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="fas fa-calendar mr-2 text-indigo-500"></i>Datum
                  </label>
                  <input
                    type="date"
                    min={getMinDate()}
                    value={selectedDate}
                    onChange={(e) => handleDateSelect(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                    required
                  />
                </div>

                {selectedDate && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <i className="fas fa-clock mr-2 text-indigo-500"></i>Vreme
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {generateTimeSlots().map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => handleTimeSelect(time)}
                          className={`p-3 rounded-xl font-semibold transition ${
                            selectedTime === time
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Pregled i potvrda */}
          {currentStep === 4 && selectedService && selectedStylist && selectedDate && selectedTime && (
            <div>
              <div className="mb-6">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-2"
                >
                  <i className="fas fa-arrow-left"></i>
                  Nazad
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Pregled rezervacije</h2>
                <p className="text-gray-600 mt-2">Proverite detalje pre potvrde</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Summary Card */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-100">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Usluga:</span>
                      <span className="font-bold text-gray-900">{selectedService.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Frizer:</span>
                      <span className="font-bold text-gray-900">{selectedStylist.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Datum:</span>
                      <span className="font-bold text-gray-900">
                        {new Date(selectedDate).toLocaleDateString('sr-RS', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Vreme:</span>
                      <span className="font-bold text-gray-900">{selectedTime}</span>
                    </div>
                    <div className="pt-4 border-t border-indigo-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Ukupno:</span>
                        <span className="text-2xl font-bold text-indigo-600">
                          {parseInt(selectedService.price).toLocaleString()} RSD
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="fas fa-comment mr-2 text-indigo-500"></i>Napomena (opciono)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                    placeholder="Imate li neke posebne zahteve ili napomene..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>Kreiranje rezervacije...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check mr-2"></i>Potvrdi rezervaciju
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;

