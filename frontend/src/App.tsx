import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import CustomerDashboard from './components/CustomerDashboard';
import Booking from './components/Booking';

// Protected Route - samo ulogovani korisnici mogu pristupiti
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Dashboard komponenta - redirect prema ulozi
const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Redirect prema ulozi
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" />;
  } else if (user?.role === 'STYLIST') {
    return <Navigate to="/stylist/panel" />;
  }

  // CUSTOMER ide na Customer Dashboard
  return <CustomerDashboard />;
};

// Privremene komponente za admin i stylist (biće dodate u Fazama 4 i 5)
const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-gray-600 mb-4">Dobrodošli, {user?.name}!</p>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Odjavi se
          </button>
        </div>
      </div>
    </div>
  );
};

const StylistPanel: React.FC = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-4">Stylist Panel</h1>
          <p className="text-gray-600 mb-4">Dobrodošli, {user?.name}!</p>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Odjavi se
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Javne rute */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Zaštićene rute */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking"
            element={
              <ProtectedRoute>
                <Booking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stylist/panel"
            element={
              <ProtectedRoute>
                <StylistPanel />
              </ProtectedRoute>
            }
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
