import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  LogOut,
  User,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/api';

export const TopNavbar = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    // Load active alerts for the notification bell
    const loadAlerts = async () => {
      try {
        const res = await dashboardService.getLowStockAlerts();
        if (res.success) {
          setAlerts(res.alerts || []);
        }
      } catch (e) {
        // quiet fail
      }
    };
    loadAlerts();

    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        height: '74px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E7ECF7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 30
      }}
      className="top-navbar"
    >
      {/* Left: Mobile Toggle & Global Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '520px' }}>
        <button
          onClick={onOpenMobileMenu}
          style={{
            display: 'none',
            color: '#101A46',
            padding: '6px'
          }}
          className="mobile-menu-trigger"
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        <form onSubmit={handleSearchSubmit} style={{ width: '100%', position: 'relative' }}>
          <Search
            size={18}
            color="#727D9E"
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)'
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, suppliers, categories..."
            style={{
              width: '100%',
              height: '44px',
              paddingLeft: '44px',
              paddingRight: '16px',
              background: '#F6F8FF',
              border: '1px solid #E7ECF7',
              borderRadius: '9999px',
              fontSize: '13.5px',
              color: '#101A46',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.background = '#FFFFFF';
              e.target.style.borderColor = '#405BFF';
              e.target.style.boxShadow = '0 0 0 3px rgba(64, 91, 255, 0.12)';
            }}
            onBlur={(e) => {
              e.target.style.background = '#F6F8FF';
              e.target.style.borderColor = '#E7ECF7';
              e.target.style.boxShadow = 'none';
            }}
          />
        </form>
      </div>

      {/* Right: Notifications & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            style={{
              position: 'relative',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#F6F8FF',
              border: '1px solid #E7ECF7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#576282',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#EEF2FF';
              e.currentTarget.style.borderColor = '#C7D2FE';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F6F8FF';
              e.currentTarget.style.borderColor = '#E7ECF7';
            }}
            aria-label="View notifications"
          >
            <Bell size={19} />
            {alerts.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '9px',
                  right: '9px',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: '#FF525C',
                  border: '2px solid #FFFFFF'
                }}
              />
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div
              style={{
                position: 'absolute',
                top: '52px',
                right: 0,
                width: '320px',
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E7ECF7',
                boxShadow: '0 10px 30px rgba(16, 26, 70, 0.12)',
                padding: '16px',
                zIndex: 60
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#101A46' }}>Notifications</h4>
                <span style={{ fontSize: '11px', background: '#FFF1F0', color: '#FF525C', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                  {alerts.length} Low Stock
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {alerts.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#727D9E', textAlign: 'center', padding: '12px 0' }}>All stock levels healthy!</p>
                ) : (
                  alerts.slice(0, 4).map((a) => (
                    <div
                      key={a.id}
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate('/products');
                      }}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        background: '#FFF9F5',
                        border: '1px solid #FFEDD5',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <AlertTriangle size={16} color="#FF9B38" />
                      <div style={{ fontSize: '12px', flex: 1 }}>
                        <p style={{ fontWeight: '600', color: '#101A46' }}>{a.name}</p>
                        <p style={{ color: '#727D9E', fontSize: '11px' }}>
                          Available: <strong style={{ color: '#FF525C' }}>{a.quantity}</strong> / Min: {a.minimum_stock}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <div
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: '12px',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F6F8FF')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'}
              alt={user?.name || 'Admin'}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #E7ECF7'
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#101A46', lineHeight: '1.2' }}>
                {user?.name || 'Aarav Sharma'}
              </span>
              <span style={{ fontSize: '11px', color: '#727D9E', fontWeight: '500' }}>
                {user?.role || 'Admin'}
              </span>
            </div>
            <ChevronDown size={16} color="#727D9E" />
          </div>

          {profileDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '56px',
                right: 0,
                width: '210px',
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E7ECF7',
                boxShadow: '0 10px 30px rgba(16, 26, 70, 0.12)',
                padding: '8px',
                zIndex: 60
              }}
            >
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #F1F4FA', marginBottom: '6px' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#101A46' }}>{user?.name}</p>
                <p style={{ fontSize: '11px', color: '#727D9E' }}>{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  navigate('/settings');
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: '#101A46',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F6F8FF')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Settings size={16} color="#727D9E" />
                <span>Account Settings</span>
              </button>

              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: '#FF525C',
                  transition: 'background 0.15s ease',
                  marginTop: '4px'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#FFF5F5')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={16} color="#FF525C" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
