import React from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Layouts
import FarmerLayout from '@/components/layout/FarmerLayout';
import VetLayout from '@/components/layout/VetLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import GuestLayout from '@/components/layout/GuestLayout';

// Pages - Auth
import LoginPage from '@/components/pages/LoginPage';

// Pages - Farmer
import FarmerDashboard from '@/components/pages/farmer/FarmerDashboard';
import MyAnimals from '@/components/pages/farmer/MyAnimals';
import AddAnimal from '@/components/pages/farmer/AddAnimal';
import Vaccinations from '@/components/pages/farmer/Vaccinations';
import Deworming from '@/components/pages/farmer/Deworming';
import Breeding from '@/components/pages/farmer/Breeding';
import MilkRecords from '@/components/pages/farmer/MilkRecords';
import SickAnimals from '@/components/pages/farmer/SickAnimals';
import AlertsReminders from '@/components/pages/farmer/AlertsReminders';
import FarmerAreaCalculator from '@/components/pages/farmer/FarmerAreaCalculator';
import FarmerInterestCalculator from '@/components/pages/farmer/FarmerInterestCalculator';

// Pages - Vet
import VetDashboard from '@/components/pages/vet/VetDashboard';
import Diagnostics from '@/components/pages/vet/Diagnostics';
import NewDiagnostic from '@/components/pages/vet/NewDiagnostic';
import KnowledgeCenter from '@/components/pages/vet/KnowledgeCenter';

// Pages - Admin
import AdminDashboard from '@/components/pages/admin/AdminDashboard';

// Pages - Guest
import AreaCalculator from '@/components/pages/guest/AreaCalculator';
import InterestCalculator from '@/components/pages/guest/InterestCalculator';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    switch (user.role) {
      case 'farmer':
      case 'paravet':
        return <Navigate to="/farmer/animals" replace />;
      case 'veterinarian':
        return <Navigate to="/vet/dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'guest':
        return <Navigate to="/guest/area" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

// Placeholder Components
const PlaceholderPage = ({ title, description }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      <p className="text-slate-500 mt-2">{description || 'Coming soon...'}</p>
    </div>
  </div>
);

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Root redirect */}
      <Route path="/" element={
        user ? (
          <Navigate to={
            user.role === 'farmer' || user.role === 'paravet' ? '/farmer/animals' :
            user.role === 'veterinarian' ? '/vet/dashboard' :
            user.role === 'admin' ? '/admin/dashboard' :
            '/guest/area'
          } replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      {/* Farmer Routes */}
      <Route path="/farmer" element={
        <ProtectedRoute allowedRoles={['farmer', 'paravet']}>
          <FarmerLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="animals" replace />} />
        <Route path="profile" element={<PlaceholderPage title="My Profile" description="View and edit your profile" />} />
        <Route path="animals" element={<MyAnimals />} />
        <Route path="animals/new" element={<AddAnimal />} />
        <Route path="animals/:id" element={<PlaceholderPage title="Animal Details" />} />
        
        {/* Animal Health */}
        <Route path="vaccinations" element={<Vaccinations />} />
        <Route path="deworming" element={<Deworming />} />
        <Route path="sick-animals" element={<SickAnimals />} />
        
        {/* Breeding & Milk */}
        <Route path="breeding" element={<Breeding />} />
        <Route path="milk-records" element={<MilkRecords />} />
        
        {/* Calculators */}
        <Route path="ration-calculator" element={<PlaceholderPage title="Ration Calculator" description="Calculate feed requirements for your animals" />} />
        <Route path="area-calculator" element={<FarmerAreaCalculator />} />
        <Route path="interest-calculator" element={<FarmerInterestCalculator />} />
        
        {/* Tips & Practices */}
        <Route path="ayurvedic" element={<PlaceholderPage title="Ayurvedic Practices" description="Traditional remedies for common problems" />} />
        <Route path="tips" element={<PlaceholderPage title="Animal Care Tips" description="Helpful tips for better animal care" />} />
        
        {/* Market */}
        <Route path="animal-market" element={<PlaceholderPage title="Near By Animal Sales" description="Buy and sell animals in your area" />} />
        
        {/* Reports */}
        <Route path="reports/vaccination" element={<PlaceholderPage title="Vaccination Report" />} />
        <Route path="reports/deworming" element={<PlaceholderPage title="Deworming Report" />} />
        <Route path="reports/breeding" element={<PlaceholderPage title="Breeding Report" />} />
        <Route path="reports/ration" element={<PlaceholderPage title="Ration Report" />} />
        <Route path="reports/area" element={<PlaceholderPage title="Area Measurement Report" />} />
        <Route path="reports/financial" element={<PlaceholderPage title="Financial Report" />} />
        
        {/* Alerts & Reminders */}
        <Route path="alerts/vaccination" element={<AlertsReminders type="vaccination" />} />
        <Route path="alerts/deworming" element={<AlertsReminders type="deworming" />} />
        <Route path="alerts/breeding" element={<AlertsReminders type="breeding" />} />
        <Route path="alerts/followup" element={<AlertsReminders type="followup" />} />
      </Route>

      {/* Veterinarian Routes */}
      <Route path="/vet" element={
        <ProtectedRoute allowedRoles={['veterinarian', 'admin']}>
          <VetLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<VetDashboard />} />
        <Route path="registers" element={<PlaceholderPage title="Registers" />} />
        <Route path="clinical" element={<PlaceholderPage title="Clinical Tools" />} />
        <Route path="diagnostics" element={<Diagnostics />} />
        <Route path="diagnostics/new" element={<NewDiagnostic />} />
        <Route path="knowledge" element={<KnowledgeCenter />} />
        <Route path="reports" element={<PlaceholderPage title="Reports" />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<PlaceholderPage title="User Management" />} />
        <Route path="knowledge" element={<KnowledgeCenter />} />
        <Route path="safety" element={<PlaceholderPage title="Safety Alerts Config" />} />
        <Route path="analytics" element={<PlaceholderPage title="Analytics" />} />
        <Route path="settings" element={<PlaceholderPage title="System Settings" />} />
      </Route>

      {/* Guest Routes */}
      <Route path="/guest" element={
        <ProtectedRoute allowedRoles={['guest']}>
          <GuestLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="area" replace />} />
        <Route path="area" element={<AreaCalculator />} />
        <Route path="interest" element={<InterestCalculator />} />
        <Route path="downloads" element={<PlaceholderPage title="Downloads" />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
