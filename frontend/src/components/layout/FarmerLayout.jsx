import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  User, PawPrint, Stethoscope, Heart, Milk, Calculator, 
  Leaf, Lightbulb, ShoppingCart, Ruler, Percent, FileText,
  Bell, ChevronDown, ChevronRight, X, Menu
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Disclaimer from '@/components/layout/Disclaimer';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const FarmerLayout = () => {
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
      icon: User, 
      label: 'My Profile', 
      path: '/farmer/profile' 
    },
    { 
      icon: PawPrint, 
      label: 'My Animals', 
      path: '/farmer/animals' 
    },
    { 
      icon: Stethoscope, 
      label: 'Animal Health', 
      key: 'health',
      submenu: [
        { label: 'Vaccinations', path: '/farmer/vaccinations' },
        { label: 'Deworming', path: '/farmer/deworming' },
        { label: 'Sick Animals', path: '/farmer/sick-animals' },
      ]
    },
    { 
      icon: Heart, 
      label: 'Breeding', 
      path: '/farmer/breeding' 
    },
    { 
      icon: Milk, 
      label: 'Milk Records', 
      path: '/farmer/milk-records' 
    },
    { 
      icon: Calculator, 
      label: 'Ration Calculator', 
      path: '/farmer/ration-calculator' 
    },
    { 
      icon: Leaf, 
      label: 'Ayurvedic Practices', 
      path: '/farmer/ayurvedic' 
    },
    { 
      icon: Lightbulb, 
      label: 'Animal Care Tips', 
      path: '/farmer/tips' 
    },
    { 
      icon: ShoppingCart, 
      label: 'Near By Animal Sales', 
      path: '/farmer/animal-market' 
    },
    { 
      icon: Ruler, 
      label: 'Area Measurement', 
      path: '/farmer/area-calculator' 
    },
    { 
      icon: Percent, 
      label: 'Interest Calculator', 
      path: '/farmer/interest-calculator' 
    },
    { 
      icon: FileText, 
      label: 'Reports', 
      key: 'reports',
      submenu: [
        { label: 'Vaccination Report', path: '/farmer/reports/vaccination' },
        { label: 'Deworming Report', path: '/farmer/reports/deworming' },
        { label: 'Breeding Report', path: '/farmer/reports/breeding' },
        { label: 'Ration Report', path: '/farmer/reports/ration' },
        { label: 'Area Measurement Report', path: '/farmer/reports/area' },
        { label: 'Financial Report', path: '/farmer/reports/financial' },
      ]
    },
    { 
      icon: Bell, 
      label: 'Alerts & Reminders', 
      key: 'alerts',
      submenu: [
        { label: 'Vaccination Due', path: '/farmer/alerts/vaccination' },
        { label: 'Deworming Due', path: '/farmer/alerts/deworming' },
        { label: 'Breeding / PD Due', path: '/farmer/alerts/breeding' },
        { label: 'Follow-up Reminders', path: '/farmer/alerts/followup' },
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
              "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-slate-700 hover:bg-green-50",
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5 text-green-600" />
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
                    "block px-4 py-2 rounded-lg text-sm transition-colors",
                    isActive 
                      ? "bg-primary text-white" 
                      : "text-slate-600 hover:bg-green-50"
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
          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
          isActive 
            ? "bg-primary text-white" 
            : "text-slate-700 hover:bg-green-50"
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
        title={`Welcome, ${user?.name || 'Farmer'}`}
      />
      
      {/* Welcome banner */}
      <div className="bg-green-50 border-b border-green-100 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <p className="text-green-800 text-sm">
            <span className="font-semibold">Welcome, {user?.name || 'Farmer'}</span>
            {user?.village && <span className="text-green-600"> • Village: {user.village}</span>}
          </p>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 bg-white border-r overflow-y-auto">
          <nav className="p-4 space-y-1">
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
          <div className="flex items-center justify-between p-4 border-b bg-primary text-white">
            <h2 className="font-semibold">Menu</h2>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="p-4 space-y-1">
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

export default FarmerLayout;
