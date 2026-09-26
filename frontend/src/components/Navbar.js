import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, PlusCircle, LayoutDashboard, Shield, User } from 'lucide-react';
import { TicketFlowIcon } from './Logo';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isAgent = user.role === 'agent';

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to={isAgent ? '/agent/dashboard' : '/dashboard'} className="nav-brand">
          <div className="brand-icon">
            <TicketFlowIcon size={22} />
          </div>
          <span className="brand-text">TicketFlow</span>
        </Link>

        <div className="nav-links">
          {isAgent ? (
            <>
              <Link to="/agent/dashboard" className="nav-link">
                <LayoutDashboard size={18} />
                <span>Agent Desk</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="nav-link">
                <LayoutDashboard size={18} />
                <span>My Tickets</span>
              </Link>
              <Link to="/tickets/new" className="nav-link btn-link">
                <PlusCircle size={18} />
                <span>New Ticket</span>
              </Link>
            </>
          )}
        </div>

        <div className="nav-user-section">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className={`role-badge ${isAgent ? 'role-agent' : 'role-customer'}`}>
              {isAgent ? <Shield size={12} /> : <User size={12} />}
              {isAgent ? 'Support Agent' : 'Customer'}
            </span>
          </div>
          <button onClick={handleLogout} className="btn-logout" title="Sign out">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
