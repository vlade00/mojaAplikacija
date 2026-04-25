// Register komponenta - Forma za registraciju

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

/** Osnovna provera: lokalni@domen.tld (bar 2 znaka u TLD), bez razmaka. */
const isValidEmailFormat = (value: string): boolean => {
  const v = value.trim();
  if (!v || /\s/.test(v)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v);
};

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailFormatError, setEmailFormatError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNameError('');
    setEmailFormatError('');
    setPasswordError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Ime i prezime je obavezno.');
      return;
    }
    // Minimalno: 2 reči (ime + prezime), bez cifara.
    const parts = trimmedName.split(/\s+/).filter(Boolean);
    if (parts.length < 2) {
      setNameError('Unesite ime i prezime (npr. "Marko Marković").');
      return;
    }
    if (/\d/.test(trimmedName)) {
      setNameError('Ime i prezime ne može sadržati brojeve.');
      return;
    }

    const trimmedEmail = email.trim();
    if (!isValidEmailFormat(trimmedEmail)) {
      setEmailFormatError(
        'Unesite ispravnu email adresu (npr. ime.prezime@gmail.com ili klijent@domen.rs).'
      );
      return;
    }

    const trimmedPassword = password;
    if (!trimmedPassword) {
      setPasswordError('Lozinka je obavezna.');
      return;
    }
    if (trimmedPassword.length < 6) {
      setPasswordError('Lozinka mora imati najmanje 6 karaktera.');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: trimmedName,
        email: trimmedEmail,
        password: trimmedPassword,
        phone: phone || undefined,
        role: 'CUSTOMER',
      });
      // Redirect na login sa porukom
      navigate('/login?registered=true');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri registraciji');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mb-4">
            <i className="fas fa-cut text-white text-3xl"></i>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Registracija u HairStudio
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Napravite novi nalog
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Ime i prezime
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                aria-invalid={nameError ? true : undefined}
                aria-describedby={nameError ? 'name-error' : undefined}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 sm:text-sm ${
                  nameError
                    ? 'border-red-500 focus:border-red-500 ring-1 ring-red-200'
                    : 'border-gray-300 focus:border-indigo-500'
                }`}
                placeholder="Ime i prezime"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError('');
                }}
                onBlur={() => {
                  const t = name.trim();
                  if (!t) return;
                  const parts = t.split(/\s+/).filter(Boolean);
                  if (parts.length < 2) {
                    setNameError('Unesite ime i prezime (npr. "Marko Marković").');
                  } else if (/\d/.test(t)) {
                    setNameError('Ime i prezime ne može sadržati brojeve.');
                  }
                }}
              />
              {nameError && (
                <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                  {nameError}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-invalid={emailFormatError ? true : undefined}
                aria-describedby={emailFormatError ? 'email-error' : undefined}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 sm:text-sm ${
                  emailFormatError
                    ? 'border-red-500 focus:border-red-500 ring-1 ring-red-200'
                    : 'border-gray-300 focus:border-indigo-500'
                }`}
                placeholder="Email adresa"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailFormatError('');
                }}
                onBlur={() => {
                  const t = email.trim();
                  if (t && !isValidEmailFormat(t)) {
                    setEmailFormatError(
                      'Email mora da sadrži znak @ i domen (npr. nesto@example.com).'
                    );
                  }
                }}
              />
              {emailFormatError && (
                <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                  {emailFormatError}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Lozinka
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                aria-invalid={passwordError ? true : undefined}
                aria-describedby={passwordError ? 'password-error' : undefined}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 sm:text-sm ${
                  passwordError
                    ? 'border-red-500 focus:border-red-500 ring-1 ring-red-200'
                    : 'border-gray-300 focus:border-indigo-500'
                }`}
                placeholder="Lozinka"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                onBlur={() => {
                  if (!password) return;
                  if (password.length < 6) {
                    setPasswordError('Lozinka mora imati najmanje 6 karaktera.');
                  }
                }}
              />
              {passwordError && (
                <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                  {passwordError}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefon (opciono)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="+381 64 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Registracija...' : 'Registruj se'}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Već imate nalog?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Prijavite se
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

