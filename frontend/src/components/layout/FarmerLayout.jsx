import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  User, PawPrint, Syringe, Bug, Heart, AlertCircle, 
  Lightbulb, Calculator, Leaf, X 
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Disclaimer from '@/components/layout/Disclaimer';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const FarmerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { icon: User, label: 'My Profile', path: '/farmer/profile' },
    { icon: PawPrint, label: 'My Animals', path: '/farmer/animals' },
    { icon: Syringe, label: 'Vaccinations', path: '/farmer/vaccinations' },
    { icon: Bug, label: 'Deworming', path: '/farmer/deworming' },
    { icon: Heart, label: 'Breeding', path: '/farmer/breeding' },
    { icon: AlertCircle, label: 'Observed Problems', path: '/farmer/problems' },
    { icon: Lightbulb, label: 'Tips', path: '/farmer/tips' },
    { icon: Calculator, label: 'Ration Calculator', path: '/farmer/ration' },
    { icon: Leaf, label: 'Ayurvedic Practice', path: '/farmer/ayurvedic' },
  ];

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

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 w-72 bg-white shadow-xl z-50 transform transition-transform duration-300 lg:hidden",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-primary">Menu</h2>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive 
                  ? "bg-primary text-white" 
                  : "text-slate-700 hover:bg-green-50"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>

      <Disclaimer />
    </div>
  );
};

export default FarmerLayout;
