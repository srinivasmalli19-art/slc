import React from 'react';
import { Bell, LogOut, User, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const Header = ({ onMenuClick, title }) => {
  const { user, logout } = useAuth();

  const getRoleLabel = (role) => {
    const labels = {
      farmer: 'Farmer',
      paravet: 'Paravet',
      veterinarian: 'Veterinarian',
      admin: 'Administrator',
      guest: 'Guest'
    };
    return labels[role] || role;
  };

  return (
    <header className="slc-header sticky top-0 z-50 shadow-md" data-testid="main-header">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Logo and Menu */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 lg:hidden"
            onClick={onMenuClick}
            data-testid="mobile-menu-btn"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                SLC
              </h1>
              <p className="text-[10px] md:text-xs text-green-100 -mt-1 hidden sm:block">
                SMART LIVESTOCK CARE
              </p>
            </div>
          </div>
        </div>

        {/* Center - Title (desktop only) */}
        {title && (
          <div className="hidden md:block">
            <h2 className="text-white font-medium">{title}</h2>
          </div>
        )}

        {/* Right side - Notifications and Profile */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            data-testid="notifications-btn"
          >
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10 gap-2"
                data-testid="user-menu-btn"
              >
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="hidden sm:inline text-sm">
                  {user?.name || 'Guest'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.name || 'Guest User'}</span>
                  <span className="text-xs text-muted-foreground">
                    {getRoleLabel(user?.role)}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user?.village && (
                <DropdownMenuItem disabled>
                  <span className="text-xs text-muted-foreground">
                    Village: {user.village}
                  </span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-red-600 cursor-pointer"
                data-testid="logout-btn"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
