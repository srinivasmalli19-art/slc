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
import FarmerProfile from '@/components/pages/farmer/FarmerProfile';
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
import RationCalculator from '@/components/pages/farmer/RationCalculator';

// Pages - Vet
import VetDashboard from '@/components/pages/vet/VetDashboard';
import VetProfile from '@/components/pages/vet/VetProfile';
import InstitutionData from '@/components/pages/vet/InstitutionData';
import OPDRegister from '@/components/pages/vet/OPDRegister';
import Diagnostics from '@/components/pages/vet/Diagnostics';
import NewDiagnostic from '@/components/pages/vet/NewDiagnostic';
import KnowledgeCenter from '@/components/pages/vet/KnowledgeCenter';

// Pages - Admin
import AdminDashboard from '@/components/pages/admin/AdminDashboard';
import UserManagement from '@/components/pages/admin/UserManagement';
import UserDetail from '@/components/pages/admin/UserDetail';
import AuditLogs from '@/components/pages/admin/AuditLogs';
import SafetyRules from '@/components/pages/admin/SafetyRules';
import InstitutionManagement from '@/components/pages/admin/InstitutionManagement';

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
        <Route path="profile" element={<FarmerProfile />} />
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
        <Route path="ration-calculator" element={<RationCalculator />} />
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
        
        {/* Profile & Institution */}
        <Route path="profile" element={<VetProfile />} />
        <Route path="institution" element={<InstitutionData />} />
        <Route path="institution-history" element={<PlaceholderPage title="Institution History" description="Historical records of institutions" />} />
        
        {/* Farmer & Patient Management */}
        <Route path="farmers" element={<PlaceholderPage title="Farmer Directory" description="Search and view farmer profiles" />} />
        <Route path="opd" element={<OPDRegister />} />
        <Route path="ipd" element={<PlaceholderPage title="IPD Register" description="In-Patient Department records" />} />
        <Route path="followups" element={<PlaceholderPage title="Follow-up Cases" description="Cases requiring follow-up" />} />
        
        {/* Clinical Registers */}
        <Route path="surgical" element={<PlaceholderPage title="Surgical Case Register" />} />
        <Route path="gynaecology" element={<PlaceholderPage title="Gynaecology Register" />} />
        <Route path="castration" element={<PlaceholderPage title="Castration Register" />} />
        
        {/* Preventive & Breeding */}
        <Route path="vaccination-register" element={<PlaceholderPage title="Vaccination Register" />} />
        <Route path="deworming-register" element={<PlaceholderPage title="Deworming Register" />} />
        <Route path="ai-register" element={<PlaceholderPage title="AI Register" description="Artificial Insemination records" />} />
        <Route path="calf-birth" element={<PlaceholderPage title="Calf Birth Register" />} />
        
        {/* Disease & Mortality */}
        <Route path="outbreak" element={<PlaceholderPage title="Outbreak Register" />} />
        <Route path="mortality" element={<PlaceholderPage title="Mortality Register" />} />
        
        {/* Post-Mortem */}
        <Route path="postmortem" element={<PlaceholderPage title="Post-Mortem Register" />} />
        <Route path="postmortem-cert" element={<PlaceholderPage title="Post-Mortem Certificate" />} />
        
        {/* Specimen & Lab */}
        <Route path="specimen" element={<PlaceholderPage title="Specimen Register" />} />
        
        {/* Diagnostics */}
        <Route path="diagnostics" element={<Diagnostics />} />
        <Route path="diagnostics/new" element={<NewDiagnostic />} />
        
        {/* Knowledge Center */}
        <Route path="knowledge" element={<KnowledgeCenter />} />
        
        {/* Certificates */}
        <Route path="cert-health" element={<PlaceholderPage title="Health Certificate" />} />
        <Route path="cert-valuation" element={<PlaceholderPage title="Health & Valuation Certificate" />} />
        
        {/* Utilities */}
        <Route path="drug-dose" element={<PlaceholderPage title="Drug Dose Calculator" />} />
        <Route path="body-weight" element={<PlaceholderPage title="Body Weight Calculator" />} />
        <Route path="area" element={<PlaceholderPage title="Area Measurement" />} />
        <Route path="interest" element={<PlaceholderPage title="Interest Calculator" />} />
        
        {/* Reports */}
        <Route path="reports/opd-ipd" element={<PlaceholderPage title="OPD/IPD Reports" />} />
        <Route path="reports/disease" element={<PlaceholderPage title="Disease-wise Reports" />} />
        <Route path="reports/vaccination" element={<PlaceholderPage title="Vaccination Reports" />} />
        
        {/* Admin & Guidelines */}
        <Route path="guidelines" element={<PlaceholderPage title="App Guidelines" />} />
        <Route path="legal" element={<PlaceholderPage title="Legal Disclaimer" />} />
        
        {/* Legacy routes */}
        <Route path="registers" element={<Navigate to="/vet/opd" replace />} />
        <Route path="clinical" element={<Navigate to="/vet/surgical" replace />} />
        <Route path="reports" element={<Navigate to="/vet/reports/opd-ipd" replace />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        
        {/* User Management */}
        <Route path="users" element={<UserManagement />} />
        <Route path="users/farmers" element={<UserManagement />} />
        <Route path="users/paravets" element={<UserManagement />} />
        <Route path="users/vets" element={<UserManagement />} />
        <Route path="users/:userId" element={<UserDetail />} />
        
        {/* RBAC */}
        <Route path="rbac" element={<PlaceholderPage title="Role & Permission Control" description="Configure role-based access control" />} />
        
        {/* Knowledge Center */}
        <Route path="knowledge" element={<KnowledgeCenter />} />
        <Route path="knowledge/cbc" element={<KnowledgeCenter />} />
        <Route path="knowledge/biochemistry" element={<KnowledgeCenter />} />
        <Route path="knowledge/parasitology" element={<KnowledgeCenter />} />
        <Route path="knowledge/history" element={<PlaceholderPage title="Knowledge Version History" />} />
        
        {/* Safety Rules */}
        <Route path="safety/zoonotic" element={<SafetyRules />} />
        <Route path="safety/protocols" element={<SafetyRules />} />
        <Route path="safety/reporting" element={<PlaceholderPage title="Government Reporting" />} />
        
        {/* Audit Logs */}
        <Route path="audit-logs" element={<AuditLogs />} />
        
        {/* System Settings */}
        <Route path="settings/general" element={<PlaceholderPage title="General Settings" />} />
        <Route path="settings/alerts" element={<PlaceholderPage title="Alert Thresholds" />} />
        <Route path="settings/notifications" element={<PlaceholderPage title="Notification Rules" />} />
        
        {/* Data Locking */}
        <Route path="data-lock" element={<PlaceholderPage title="Data Locking & Protection" />} />
        
        {/* Reports */}
        <Route path="reports/user-activity" element={<PlaceholderPage title="User Activity Reports" />} />
        <Route path="reports/disease" element={<PlaceholderPage title="Disease Surveillance Reports" />} />
        <Route path="reports/vaccination" element={<PlaceholderPage title="Vaccination Coverage Reports" />} />
        <Route path="reports/export" element={<PlaceholderPage title="Export Data" />} />
        
        {/* Notifications */}
        <Route path="notifications" element={<PlaceholderPage title="System Notifications" />} />
        
        {/* Backup */}
        <Route path="backup" element={<PlaceholderPage title="Backup & Data Integrity" />} />
        
        {/* Institutions */}
        <Route path="institutions" element={<InstitutionManagement />} />
        
        {/* Legacy */}
        <Route path="safety" element={<Navigate to="/admin/safety/zoonotic" replace />} />
        <Route path="analytics" element={<Navigate to="/admin/reports/user-activity" replace />} />
        <Route path="settings" element={<Navigate to="/admin/settings/general" replace />} />
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
