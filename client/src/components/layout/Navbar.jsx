import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Swords, Shield, Calendar, MessageSquare } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel bg-dojo-dark bg-opacity-80 py-4 px-6 border-b border-dojo-border">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 text-2xl font-extrabold tracking-tight text-dojo-text">
          <span className="text-dojo-primary">Dojo</span><span>Pro</span> <span className="text-sm">🥋</span>
        </Link>

        {user ? (
          <div className="flex items-center space-x-6">
            <Link to="/feed" className="flex items-center space-x-1.5 text-sm font-medium hover:text-dojo-primary transition">
              <MessageSquare size={16} />
              <span className="hidden sm:inline">Feed</span>
            </Link>
            <Link to="/discovery" className="flex items-center space-x-1.5 text-sm font-medium hover:text-dojo-primary transition">
              <Swords size={16} />
              <span className="hidden sm:inline">Coaches</span>
            </Link>
            <Link to="/bookings" className="flex items-center space-x-1.5 text-sm font-medium hover:text-dojo-primary transition">
              <Calendar size={16} />
              <span className="hidden sm:inline">Bookings</span>
            </Link>
            <Link to="/tournaments" className="flex items-center space-x-1.5 text-sm font-medium hover:text-dojo-primary transition">
              <Shield size={16} />
              <span className="hidden sm:inline">Tournaments</span>
            </Link>
            
            <div className="h-6 w-px bg-dojo-border" />

            <Link to="/profile" className="flex items-center space-x-2 text-sm font-medium hover:text-dojo-primary transition">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="h-8 w-8 rounded-full border border-dojo-primary object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dojo-border text-xs font-bold text-dojo-primary">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden md:inline">{user.name}</span>
            </Link>

            <button onClick={handleLogout} className="text-dojo-muted hover:text-dojo-primary transition">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm font-medium hover:text-dojo-primary transition">
              Login
            </Link>
            <Link to="/signup" className="rounded-md bg-dojo-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-95 shadow-glow-red transition">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
