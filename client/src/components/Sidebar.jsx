import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Truck,
  FolderTree,
  FileText,
  Sparkles,
  Settings,
  X
} from 'lucide-react';
import CubeLogo from './CubeLogo';
import RobotIllustration from './RobotIllustration';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/stock', label: 'Stock Management', icon: ArrowLeftRight },
  { path: '/suppliers', label: 'Suppliers', icon: Truck },
  { path: '/categories', label: 'Categories', icon: FolderTree },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/ai-assistant', label: 'AI Assistant', icon: Sparkles },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(16, 26, 70, 0.35)',
            backdropFilter: 'blur(2px)',
            zIndex: 40,
            display: 'block'
          }}
          className="mobile-backdrop"
        />
      )}

      <aside
        style={{
          width: '260px',
          minWidth: '260px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          background: '#FFFFFF',
          borderRight: '1px solid #E7ECF7',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 18px',
          zIndex: 50,
          transition: 'transform 0.3s ease',
          boxSizing: 'border-box'
        }}
        className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}
      >
        <div>
          {/* Top Branding matching reference image */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '32px',
              paddingLeft: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CubeLogo size={42} />
              <div>
                <h1
                  style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    color: '#101A46',
                    letterSpacing: '-0.3px',
                    lineHeight: '1.2'
                  }}
                >
                  Stock<span style={{ color: '#405BFF' }}>Smart</span>
                </h1>
                <p
                  style={{
                    fontSize: '11px',
                    color: '#727D9E',
                    fontWeight: '500',
                    letterSpacing: '0.2px'
                  }}
                >
                  Inventory Made Simple
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              style={{
                display: 'none',
                color: '#727D9E',
                padding: '4px'
              }}
              className="mobile-close-btn"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose && onClose()}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    fontSize: '14px',
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? '#405BFF' : '#576282',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(64, 91, 255, 0.16) 0%, rgba(130, 103, 245, 0.22) 100%)'
                      : 'transparent',
                    transition: 'all 0.15s ease',
                    textDecoration: 'none'
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={19}
                        color={isActive ? '#405BFF' : '#727D9E'}
                        strokeWidth={isActive ? 2.4 : 1.8}
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom AI Assistant Card matching reference image */}
        <div
          style={{
            background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
            border: '1px solid #E0E7FF',
            borderRadius: '18px',
            padding: '18px 14px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 4px 16px rgba(64, 91, 255, 0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <RobotIllustration size={68} />
          
          <h4
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#101A46',
              marginTop: '4px',
              marginBottom: '2px'
            }}
          >
            Need Help?
          </h4>
          <p
            style={{
              fontSize: '11px',
              color: '#727D9E',
              marginBottom: '12px'
            }}
          >
            Ask our AI Assistant
          </p>

          <button
            onClick={() => {
              if (onClose) onClose();
              navigate('/ai-assistant');
            }}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '9999px',
              boxShadow: '0 3px 10px rgba(64, 91, 255, 0.25)'
            }}
          >
            Chat Now &rarr;
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
