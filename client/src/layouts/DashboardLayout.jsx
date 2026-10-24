import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { useAuth } from '../context/AuthContext';

export const DashboardLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F6F8FF',
          gap: '16px'
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            border: '4px solid #E7ECF7',
            borderTopColor: '#405BFF',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}
        />
        <p style={{ color: '#727D9E', fontSize: '14px', fontWeight: '500' }}>
          Loading StockSmart AI...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F6F8FF' }}>
      {/* Sidebar */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopNavbar onOpenMobileMenu={() => setMobileSidebarOpen(true)} />

        <main
          style={{
            flex: 1,
            padding: '28px 36px',
            maxWidth: '1600px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}
          className="dashboard-main-content"
        >
          <Outlet />
        </main>

        {/* Global Footer matching reference image */}
        <footer
          style={{
            borderTop: '1px solid #E7ECF7',
            padding: '20px 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#727D9E',
            background: '#FFFFFF'
          }}
          className="dashboard-footer"
        >
          <div>
            StockSmart &copy; 2026 | Smart Inventory &amp; Stock Management System
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }}>About</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Privacy</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Terms</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Support</span>
          </div>
        </footer>
      </div>

      {/* Responsive layout styles */}
      <style>{`
        @media (max-width: 1024px) {
          .sidebar {
            position: fixed !important;
            transform: translateX(-100%);
            box-shadow: 4px 0 24px rgba(0,0,0,0.12);
          }
          .sidebar-open {
            transform: translateX(0) !important;
          }
          .mobile-menu-trigger {
            display: flex !important;
          }
          .mobile-close-btn {
            display: block !important;
          }
          .dashboard-main-content {
            padding: 20px 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
