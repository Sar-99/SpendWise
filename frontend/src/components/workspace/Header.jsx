import React, { useState } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ profile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('currentProfile');
    navigate('/auth');
  };

  const handleBackToProfiles = () => {
    localStorage.removeItem('currentProfile');
    navigate('/profiles');
  };

  return (
    <header className="border-b border-border px-6 py-4 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#2563EB] to-[#60A5FA] bg-clip-text text-transparent">
            SpendWise
          </h1>
          <div className="h-4 w-px bg-border"></div>
          <div className="text-sm">
            <span className="font-medium text-text-primary">{profile?.name}</span>
            <span className="mx-2 text-text-secondary">•</span>
            <span className="text-text-secondary">{profile?.currency}</span>
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-surface-light rounded-lg transition-colors"
          >
            <User size={16} />
            <span className="text-sm font-medium text-text-primary">{user?.nickname}</span>
            <ChevronDown size={14} className={`transition-transform text-text-secondary ${showMenu ? 'rotate-180' : ''}`} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-surface border border-border rounded-lg shadow-lg z-50 animate-fade-in">
              <div className="p-1">
                <button
                  onClick={handleBackToProfiles}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-light rounded transition-colors"
                >
                  <Settings size={14} />
                  <span>Профили</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-light rounded transition-colors"
                >
                  <LogOut size={14} />
                  <span>Выйти</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;