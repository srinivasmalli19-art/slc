import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, User, Building2, FileText, Stethoscope, 
  ClipboardList, Syringe, Bug, Heart, BookOpen, AlertTriangle,
  Calculator, FileBarChart, Settings, Users, ChevronDown, 
  ChevronRight, X, Menu, Activity, Scissors, Baby
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Disclaimer from '@/components/layout/Disclaimer';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const VetLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleSubmenu = (key) => {
    setExpandedMenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: '1. Dashboard', 
      path: '/vet/dashboard' 
    },
    { 
      icon: User, 
      label: '2. Profile & Institution', 
      key: 'profile',
      submenu: [
        { label: 'Vet Profile Register', path: '/vet/profile' },
        { label: 'Institution Basic Data', path: '/vet/institution' },
        { label: 'Institution History', path: '/vet/institution-history' },
      ]
    },
    { 
      icon: Users, 
      label: '3. Farmer & Patient Mgmt', 
      key: 'farmer',
      submenu: [
        { label: 'Farmer Directory', path: '/vet/farmers' },
        { label: 'OPD Register', path: '/vet/opd' },
        { label: 'IPD Register', path: '/vet/ipd' },
        { label: 'Follow-up Cases', path: '/vet/followups' },
      ]
    },
    { 
      icon: Scissors, 
      label: '4. Clinical Registers', 
      key: 'clinical',
      submenu: [
        { label: 'Surgical Case Register', path: '/vet/surgical' },
        { label: 'Gynaecology Register', path: '/vet/gynaecology' },
        { label: 'Castration Register', path: '/vet/castration' },
      ]
    },
    { 
      icon: Syringe, 
      label: '5. Preventive & Breeding', 
      key: 'preventive',
      submenu: [
        { label: 'Vaccination Register', path: '/vet/vaccination-register' },
        { label: 'Deworming Register', path: '/vet/deworming-register' },
        { label: 'AI Register', path: '/vet/ai-register' },
        { label: 'Calf Birth Register', path: '/vet/calf-birth' },
      ]
    },
    { 
      icon: AlertTriangle, 
      label: '6. Disease & Mortality', 
      key: 'disease',
      submenu: [
        { label: 'Outbreak Register', path: '/vet/outbreak' },
        { label: 'Mortality Register', path: '/vet/mortality' },
      ]
    },
    { 
      icon: FileText, 
      label: '7. Post-Mortem & Legal', 
      key: 'postmortem',
      submenu: [
        { label: 'Post-Mortem Register', path: '/vet/postmortem' },
        { label: 'Post-Mortem Certificate', path: '/vet/postmortem-cert' },
      ]
    },
    { 
      icon: Activity, 
      label: '8. Specimen & Lab', 
      path: '/vet/specimen' 
    },
    { 
      icon: Stethoscope, 
      label: '9. Diagnostics', 
      path: '/vet/diagnostics' 
    },
    { 
      icon: BookOpen, 
      label: '10. Knowledge Center', 
      path: '/vet/knowledge' 
    },
    { 
      icon: FileBarChart, 
      label: '11. Certificates', 
      key: 'certificates',
      submenu: [
        { label: 'Health Certificate', path: '/vet/cert-health' },
        { label: 'Health & Valuation', path: '/vet/cert-valuation' },
      ]
    },
    { 
      icon: Calculator, 
      label: '12. Utilities', 
      key: 'utilities',
      submenu: [
        { label: 'Drug Dose Calculator', path: '/vet/drug-dose' },
        { label: 'Body Weight Calculator', path: '/vet/body-weight' },
        { label: 'Area Measurement', path: '/vet/area' },
        { label: 'Interest Calculator', path: '/vet/interest' },
      ]
    },
    { 
      icon: FileText, 
      label: '13. Reports', 
      key: 'reports',
      submenu: [
        { label: 'OPD/IPD Reports', path: '/vet/reports/opd-ipd' },
        { label: 'Disease-wise Reports', path: '/vet/reports/disease' },
        { label: 'Vaccination Reports', path: '/vet/reports/vaccination' },
        { label: 'GVA & Economic Analysis', path: '/vet/reports/gva' },
      ]
    },
    { 
      icon: Settings, 
      label: '14. Admin & Guidelines', 
      key: 'admin',
      submenu: [
        { label: 'App Guidelines', path: '/vet/guidelines' },
        { label: 'Legal Disclaimer', path: '/vet/legal' },
      ]
    },
  ];

  const renderMenuItem = (item, isMobile = false) => {
    if (item.submenu) {
      const isExpanded = expandedMenus[item.key];
      return (
        <div key={item.key}>
          <button
            onClick={() => toggleSubmenu(item.key)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-slate-700 hover:bg-blue-50",
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-8 mt-1 space-y-1">
              {item.submenu.map((sub) => (
                <NavLink
                  key={sub.path}
                  to={sub.path}
                  onClick={() => isMobile && setSidebarOpen(false)}
                  className={({ isActive }) => cn(
                    "block px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive 
                      ? "bg-blue-600 text-white" 
                      : "text-slate-600 hover:bg-blue-50"
                  )}
                >
                  {sub.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={() => isMobile && setSidebarOpen(false)}
        className={({ isActive }) => cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
          isActive 
            ? "bg-blue-600 text-white" 
            : "text-slate-700 hover:bg-blue-50"
        )}
      >
        <item.icon className={cn("h-5 w-5")} />
        <span className="text-sm font-medium">{item.label}</span>
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header 
        onMenuClick={() => setSidebarOpen(true)} 
        title="Veterinarian Portal"
        theme="blue"
      />
      
      {/* Vet Info Banner */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-blue-800 text-sm">
            <span className="font-semibold">Dr. {user?.name || 'Veterinarian'}</span>
            <span className="text-blue-600 ml-2">• Clinical Authority</span>
          </p>
          <span className="text-xs text-blue-600 hidden sm:block">
            Access Level: Clinical + Legal + Surveillance
          </span>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 bg-white border-r overflow-y-auto">
          <div className="p-3 border-b bg-blue-600 text-white">
            <h3 className="font-semibold text-sm">VETERINARIAN MODULES</h3>
          </div>
          <nav className="p-3 space-y-1">
            {menuItems.map(item => renderMenuItem(item, false))}
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 lg:hidden overflow-y-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white">
            <h2 className="font-semibold">Vet Modules</h2>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="p-3 space-y-1">
            {menuItems.map(item => renderMenuItem(item, true))}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <Disclaimer />
    </div>
  );
};

export default VetLayout;
