// Login komponenta - Forma za prijavu

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchParams] = useSearchParams();

  const { login } = useAuth();
  const navigate = useNavigate();

  // Proveri da li je došao sa registracije
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Uspešno ste se registrovali! Sada se možete prijaviti.');
      // Obriši query parametar iz URL-a
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      // Redirect prema ulozi - proveri user role iz localStorage
      setTimeout(() => {
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (savedUser.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (savedUser.role === 'STYLIST') {
          navigate('/stylist/panel');
        } else {
          navigate('/dashboard');
        }
      }, 100);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri prijavi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2 min-h-[600px]">
            {/* Left: Welcome Section */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-12 flex flex-col justify-center text-white hidden md:flex">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white bg-opacity-20 rounded-3xl mb-6 shadow-xl">
                  <i className="fas fa-cut text-white text-4xl"></i>
                </div>
                <h2 className="text-4xl font-bold mb-4">Dobrodošli nazad!</h2>
                <p className="text-xl opacity-90">Prijavite se i rezervišite termin u našem premium salonu</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <i className="fas fa-star text-yellow-300"></i>
                  </div>
                  <div>
                    <p className="font-semibold">Premium Usluge</p>
                    <p className="text-sm opacity-80">Najkvalitetniji proizvodi i oprema</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <i className="fas fa-users text-yellow-300"></i>
                  </div>
                  <div>
                    <p className="font-semibold">Profesionalni Tim</p>
                    <p className="text-sm opacity-80">Iskusni frizeri i stilisti</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <i className="fas fa-clock text-yellow-300"></i>
                  </div>
                  <div>
                    <p className="font-semibold">Fleksibilno Zakazivanje</p>
                    <p className="text-sm opacity-80">Online rezervacija 24/7</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Login Form */}
            <div className="p-12 flex flex-col justify-center">
              <div className="max-w-md mx-auto w-full space-y-8">
                <div>
                  <h3 className="text-3xl font-bold mb-2 text-gray-800">Prijavite se</h3>
                  <p className="text-gray-500 mb-8">Unesite svoje podatke za prijavu</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl">
                      {successMessage}
                    </div>
                  )}
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <i className="fas fa-envelope mr-2 text-indigo-500"></i>Email adresa
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                      placeholder="vas.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <i className="fas fa-lock mr-2 text-indigo-500"></i>Lozinka
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <a href="#" className="text-sm text-indigo-600 hover:text-indigo-800 mt-2 inline-block">Zaboravili ste lozinku?</a>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {loading ? 'Prijavljivanje...' : 'Prijavi se'}
                  </button>
                  <div className="text-center pt-4 border-t">
                    <p className="text-gray-600">
                      Nemate nalog?{' '}
                      <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-800">
                        Registrujte se
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

