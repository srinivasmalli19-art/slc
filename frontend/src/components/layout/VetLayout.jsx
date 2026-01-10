import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Stethoscope, ClipboardList,
  BookOpen, Settings, X, ChevronRight
} from 'lucide-react';
import Header from './Header';
import Disclaimer from './Disclaimer';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const VetLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/vet/dashboard' },
    { icon: ClipboardList, label: 'Registers', path: '/vet/registers' },
    { icon: Stethoscope, label: 'Clinical Tools', path: '/vet/clinical' },
    { icon: FileText, label: 'Diagnostics', path: '/vet/diagnostics' },
    { icon: BookOpen, label: 'Knowledge Center', path: '/vet/knowledge' },
    { icon: FileText, label: 'Reports', path: '/vet/reports' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header 
        onMenuClick={() => setSidebarOpen(true)} 
        title="Veterinarian Portal"
      />
      
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className={cn(
          "hidden lg:flex flex-col bg-white border-r transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}>
          <div className="p-4 border-b flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <p className="font-semibold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500">Veterinarian</p>
              </div>
            )}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform",
                sidebarCollapsed ? "" : "rotate-180"
              )} />
            </button>
          </div>
          
          <nav className="flex-1 p-2 space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive 
                    ? "bg-primary text-white" 
                    : "text-slate-700 hover:bg-slate-100",
                  sidebarCollapsed && "justify-center"
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
              </NavLink>
            ))}
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
          "fixed inset-y-0 left-0 w-72 bg-white shadow-xl z-50 transform transition-transform duration-300 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <p className="font-semibold">{user?.name}</p>
              <p className="text-xs text-slate-500">Veterinarian</p>
            </div>
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
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      <Disclaimer />
    </div>
  );
};

export default VetLayout;
