import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  User,
  Building,
  Bell,
  Lock,
  LogOut,
  Save,
  CheckCircle,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { settingService } from '../services/api';
import NotificationToast from '../components/NotificationToast';

export const SettingsPage = () => {
  const { user, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [orgName, setOrgName] = useState('StockSmart AI Campus & Enterprise');
  const [adminEmail, setAdminEmail] = useState('admin@stocksmart.ai');
  const [defaultMinStock, setDefaultMinStock] = useState('10');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('$');

  // Profile fields
  const [name, setName] = useState(user?.name || 'Aarav Sharma');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await settingService.get();
        if (res.success && res.settings) {
          if (res.settings.organization_name) setOrgName(res.settings.organization_name);
          if (res.settings.admin_email) setAdminEmail(res.settings.admin_email);
          if (res.settings.default_min_stock) setDefaultMinStock(res.settings.default_min_stock);
          if (res.settings.email_notifications) setEmailNotifications(res.settings.email_notifications === 'true');
          if (res.settings.currency_symbol) setCurrencySymbol(res.settings.currency_symbol);
        }
        if (res.adminProfile) {
          setName(res.adminProfile.name);
          setAvatarUrl(res.adminProfile.avatar_url || '');
        }
      } catch (e) {
        console.error('Settings load error', e);
      }
    };
    loadSettings();
  }, []);

  const handleSaveAll = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword) {
      if (newPassword.length < 12) {
        setPasswordError('New password must be at least 12 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError('New password and confirm password do not match.');
        return;
      }
    }

    try {
      setSaving(true);
      const res = await settingService.update({
        settings: {
          organization_name: orgName,
          admin_email: adminEmail,
          default_min_stock: defaultMinStock,
          email_notifications: String(emailNotifications),
          currency_symbol: currencySymbol
        },
        profile: {
          name,
          avatar_url: avatarUrl
        },
        newPassword: newPassword || undefined
      });

      if (res.success) {
        if (res.adminProfile) {
          updateUserProfile(res.adminProfile);
        }
        setNewPassword('');
        setConfirmPassword('');
        setToast({ type: 'success', message: 'Settings and profile preferences updated successfully!' });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px', maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#101A46', letterSpacing: '-0.4px' }}>
            System Settings &amp; Preferences
          </h2>
          <p style={{ fontSize: '14px', color: '#727D9E', marginTop: '4px' }}>
            Configure organization branding, default safety thresholds, and administrator credentials.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="btn-danger"
          style={{ padding: '10px 20px' }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      <form onSubmit={handleSaveAll} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 1: Administrator Profile */}
        <div className="stock-card" style={{ padding: '26px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #E7ECF7', paddingBottom: '14px' }}>
            <User size={20} color="#405BFF" strokeWidth={2.4} />
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#101A46' }}>
              Administrator Profile
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'}
                alt={name}
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #E7ECF7',
                  boxShadow: '0 4px 12px rgba(64, 91, 255, 0.1)'
                }}
              />
              <span style={{ fontSize: '11px', color: '#727D9E', fontWeight: '600' }}>{user?.role || 'Admin'}</span>
            </div>

            {/* Inputs */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    border: '1px solid #E7ECF7',
                    background: '#F9FAFF',
                    fontSize: '13.5px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                  Admin Email (Login Account)
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    border: '1px solid #E7ECF7',
                    background: '#F9FAFF',
                    fontSize: '13.5px'
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    border: '1px solid #E7ECF7',
                    background: '#F9FAFF',
                    fontSize: '13.5px'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Organization & Inventory Thresholds */}
        <div className="stock-card" style={{ padding: '26px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #E7ECF7', paddingBottom: '14px' }}>
            <Building size={20} color="#16B979" strokeWidth={2.4} />
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#101A46' }}>
              Organization &amp; Stock Policy
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                Organization / Laboratory Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1px solid #E7ECF7',
                  background: '#F9FAFF',
                  fontSize: '13.5px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                Default Low Stock Buffer Threshold
              </label>
              <input
                type="number"
                min="1"
                value={defaultMinStock}
                onChange={(e) => setDefaultMinStock(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1px solid #E7ECF7',
                  background: '#F9FAFF',
                  fontSize: '13.5px'
                }}
              />
              <span style={{ fontSize: '11px', color: '#727D9E', marginTop: '4px', display: 'block' }}>
                Applied to newly created inventory items if not overridden.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                Valuation Currency Symbol
              </label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1px solid #E7ECF7',
                  background: '#F9FAFF',
                  fontSize: '13.5px'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
              <input
                type="checkbox"
                id="emailNotif"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#405BFF', cursor: 'pointer' }}
              />
              <label htmlFor="emailNotif" style={{ fontSize: '13px', fontWeight: '600', color: '#101A46', cursor: 'pointer' }}>
                Enable Instant Restock &amp; Low Stock Alerts
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Security & Password */}
        <div className="stock-card" style={{ padding: '26px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #E7ECF7', paddingBottom: '14px' }}>
            <Lock size={20} color="#8267F5" strokeWidth={2.4} />
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#101A46' }}>
              Change Password
            </h3>
          </div>

          {passwordError && (
            <div style={{ background: '#FFF1F0', color: '#DC2626', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
              {passwordError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                New Password (leave blank to keep unchanged)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1px solid #E7ECF7',
                  background: '#F9FAFF',
                  fontSize: '13.5px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#101A46', marginBottom: '6px' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1px solid #E7ECF7',
                  background: '#F9FAFF',
                  fontSize: '13.5px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ padding: '12px 32px' }}
          >
            <Save size={18} />
            <span>{saving ? 'Saving Changes...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>

      <NotificationToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default SettingsPage;
