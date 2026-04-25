import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import CustomerDashboard from './components/CustomerDashboard';
import Booking from './components/Booking';
import AdminDashboard from './components/AdminDashboard';
import StylistPanel from './components/StylistPanel';

// Protected Route - samo ulogovani korisnici mogu pristupiti
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Admin Route - samo ADMIN može pristupiti
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (user?.role !== 'ADMIN') {
    // Ako nije ADMIN, redirect na dashboard
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
};

// Stylist Route - samo STYLIST može pristupiti
const StylistRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (user?.role !== 'STYLIST') {
    // Ako nije STYLIST, redirect na dashboard
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
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
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/stylist/panel"
            element={
              <StylistRoute>
                <StylistPanel />
              </StylistRoute>
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
