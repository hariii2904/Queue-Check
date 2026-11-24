import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { DemoBanner } from './components/common/DemoBanner';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { ClinicDiscoveryPage } from './pages/ClinicDiscoveryPage';
import { ClinicDetailPage } from './pages/ClinicDetailPage';
import { LiveQueueTrackerPage } from './pages/LiveQueueTrackerPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { ReceptionistDashboard } from './pages/ReceptionistDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage } from './pages/LoginPage';

// Protected Route Component
const ReceptionistRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isStaff } = useAuth();
  if (!isStaff) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900 font-sans antialiased">
      <DemoBanner />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/clinics" element={<ClinicDiscoveryPage />} />
          <Route path="/clinics/:id" element={<ClinicDetailPage />} />
          <Route path="/track" element={<LiveQueueTrackerPage />} />
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route
            path="/receptionist"
            element={
              <ReceptionistRoute>
                <ReceptionistDashboard />
              </ReceptionistRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <AppContent />
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
