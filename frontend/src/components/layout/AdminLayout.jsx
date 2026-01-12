import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BookOpen, Shield, Settings, 
  FileText, Bell, Database, Lock, ChevronDown, ChevronRight, 
  X, Menu, Activity, ClipboardList, Building2, AlertTriangle,
  History, Download, Calculator, Leaf, TestTube, FlaskConical,
  PawPrint, Wheat, Beaker
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Disclaimer from '@/components/layout/Disclaimer';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const AdminLayout = () => {
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
      path: '/admin/dashboard' 
    },
    { 
      icon: Users, 
      label: '2. User Management', 
      key: 'users',
      submenu: [
        { label: 'All Users', path: '/admin/users' },
        { label: 'Farmer Management', path: '/admin/users/farmers' },
        { label: 'Paravet Management', path: '/admin/users/paravets' },
        { label: 'Veterinarian Management', path: '/admin/users/vets' },
      ]
    },
    { 
      icon: Shield, 
      label: '3. Role & Permissions', 
      path: '/admin/rbac' 
    },
    {
      icon: Wheat,
      label: '4. Ration Calculator',
      key: 'ration',
      submenu: [
        { label: 'Species Master', path: '/admin/ration/species' },
        { label: 'Feed Categories', path: '/admin/ration/categories' },
        { label: 'Feed Items Master', path: '/admin/ration/feeds' },
        { label: 'Nutrition Rules', path: '/admin/ration/rules' },
        { label: 'Version Management', path: '/admin/ration/versions' },
        { label: 'Usage & Results', path: '/admin/ration/results' },
      ]
    },
    {
      icon: FlaskConical,
      label: '5. Diagnostics & Labs',
      key: 'diagnostics',
      submenu: [
        { label: 'Test Master', path: '/admin/diagnostics/tests' },
        { label: 'Normal Ranges', path: '/admin/diagnostics/ranges' },
        { label: 'Interpretation Rules', path: '/admin/diagnostics/rules' },
        { label: 'Test Results Audit', path: '/admin/diagnostics/results' },
      ]
    },
    { 
      icon: BookOpen, 
      label: '6. Knowledge Center', 
      key: 'knowledge',
      submenu: [
        { label: 'All Entries', path: '/admin/knowledge' },
        { label: 'CBC Reference', path: '/admin/knowledge/cbc' },
        { label: 'Biochemistry', path: '/admin/knowledge/biochemistry' },
        { label: 'Parasitology', path: '/admin/knowledge/parasitology' },
        { label: 'Version History', path: '/admin/knowledge/history' },
      ]
    },
    { 
      icon: AlertTriangle, 
      label: '7. Safety Rules', 
      key: 'safety',
      submenu: [
        { label: 'Zoonotic Diseases', path: '/admin/safety/zoonotic' },
        { label: 'Safety Protocols', path: '/admin/safety/protocols' },
        { label: 'Government Reporting', path: '/admin/safety/reporting' },
      ]
    },
    { 
      icon: ClipboardList, 
      label: '8. Audit Logs', 
      path: '/admin/audit-logs' 
    },
    { 
      icon: Settings, 
      label: '9. System Settings', 
      key: 'settings',
      submenu: [
        { label: 'General Settings', path: '/admin/settings/general' },
        { label: 'Alert Thresholds', path: '/admin/settings/alerts' },
        { label: 'Notification Rules', path: '/admin/settings/notifications' },
      ]
    },
    { 
      icon: Lock, 
      label: '10. Data Locking', 
      path: '/admin/data-lock' 
    },
    { 
      icon: FileText, 
      label: '11. Reports', 
      key: 'reports',
      submenu: [
        { label: 'User Activity', path: '/admin/reports/user-activity' },
        { label: 'Disease Surveillance', path: '/admin/reports/disease' },
        { label: 'Vaccination Coverage', path: '/admin/reports/vaccination' },
        { label: 'Export Data', path: '/admin/reports/export' },
      ]
    },
    { 
      icon: Bell, 
      label: '12. Notifications', 
      path: '/admin/notifications' 
    },
    { 
      icon: Database, 
      label: '13. Backup & Integrity', 
      path: '/admin/backup' 
    },
    { 
      icon: Building2, 
      label: '14. Institutions', 
      path: '/admin/institutions' 
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
              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-slate-300 hover:bg-slate-800",
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-500" />
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
                      ? "bg-red-600 text-white" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
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
            ? "bg-red-600 text-white" 
            : "text-slate-300 hover:bg-slate-800"
        )}
      >
        <item.icon className={cn("h-5 w-5")} />
        <span className="text-sm font-medium">{item.label}</span>
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Header 
        onMenuClick={() => setSidebarOpen(true)} 
        title="Admin Portal"
        theme="dark"
      />
      
      {/* Admin Info Banner */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-slate-300 text-sm">
            <span className="font-semibold text-white">{user?.name || 'Administrator'}</span>
            <span className="text-red-400 ml-2">• System Administrator</span>
          </p>
          <span className="text-xs text-slate-500 hidden sm:block">
            Access Level: System-wide Control | Data Governance
          </span>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 bg-slate-900 text-white overflow-y-auto">
          <div className="p-3 border-b border-slate-800 bg-red-900/30">
            <h3 className="font-semibold text-sm text-red-400">ADMIN CONTROL CENTER</h3>
            <p className="text-xs text-slate-500 mt-1">Governance & Audit Authority</p>
          </div>
          <nav className="p-3 space-y-1">
            {menuItems.map(item => renderMenuItem(item, false))}
          </nav>
          
          {/* Footer Warning */}
          <div className="p-3 border-t border-slate-800 mt-auto">
            <p className="text-xs text-slate-500 text-center">
              All actions are logged and auditable
            </p>
          </div>
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
          "fixed inset-y-0 left-0 w-80 bg-slate-900 shadow-xl z-50 transform transition-transform duration-300 lg:hidden overflow-y-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-red-900/30">
            <div>
              <h2 className="font-semibold text-white">Admin Control</h2>
              <p className="text-xs text-slate-400">Governance Authority</p>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-slate-800 rounded-full text-white"
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
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <Disclaimer />
    </div>
  );
};

export default AdminLayout;
