import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  Calculator, Percent, Download, Home
} from 'lucide-react';
import Header from './Header';
import Disclaimer from './Disclaimer';
import { cn } from '../../lib/utils';

const GuestLayout = () => {
  const menuItems = [
    { icon: Calculator, label: 'Area Calculator', path: '/guest/area' },
    { icon: Percent, label: 'Interest Calculator', path: '/guest/interest' },
    { icon: Download, label: 'Downloads', path: '/guest/downloads' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header title="Guest Utilities" />
      
      {/* Navigation tabs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto py-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors text-sm",
                  isActive 
                    ? "bg-primary text-white" 
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
        <Outlet />
      </main>

      <Disclaimer />
    </div>
  );
};

export default GuestLayout;
