import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CubeLogo from '../components/CubeLogo';

export const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F0F4FF 0%, #F6F8FF 50%, #FAF5FF 100%)',
        padding: '24px'
      }}
    >
      <div
        className="stock-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '40px 36px',
          boxShadow: '0 16px 40px rgba(64, 91, 255, 0.08), 0 2px 6px rgba(16, 26, 70, 0.03)'
        }}
      >
        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', marginBottom: '14px' }}>
            <CubeLogo size={52} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#101A46', letterSpacing: '-0.3px' }}>
            Welcome to Stock<span style={{ color: '#405BFF' }}>Smart</span> AI
          </h2>
          <p style={{ fontSize: '13.5px', color: '#727D9E', marginTop: '6px' }}>
            Smart Inventory &amp; Stock Management System
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              background: '#FFF1F0',
              border: '1px solid #FECACA',
              color: '#DC2626',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              marginBottom: '20px'
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#101A46',
                marginBottom: '8px'
              }}
            >
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                color="#727D9E"
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@stocksmart.ai"
                required
                style={{
                  width: '100%',
                  height: '46px',
                  paddingLeft: '44px',
                  paddingRight: '16px',
                  borderRadius: '12px',
                  border: '1px solid #E7ECF7',
                  background: '#F9FAFF',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.background = '#FFFFFF';
                  e.target.style.borderColor = '#405BFF';
                  e.target.style.boxShadow = '0 0 0 3px rgba(64, 91, 255, 0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.background = '#F9FAFF';
                  e.target.style.borderColor = '#E7ECF7';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#101A46',
                marginBottom: '8px'
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                color="#727D9E"
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  height: '46px',
                  paddingLeft: '44px',
                  paddingRight: '44px',
                  borderRadius: '12px',
                  border: '1px solid #E7ECF7',
                  background: '#F9FAFF',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.background = '#FFFFFF';
                  e.target.style.borderColor = '#405BFF';
                  e.target.style.boxShadow = '0 0 0 3px rgba(64, 91, 255, 0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.background = '#F9FAFF';
                  e.target.style.borderColor = '#E7ECF7';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#727D9E',
                  padding: '4px'
                }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#576282' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#405BFF', width: '16px', height: '16px' }}
              />
              Remember me
            </label>
            <span style={{ color: '#405BFF', fontWeight: '600', cursor: 'pointer' }}>
              Forgot password?
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              height: '46px',
              fontSize: '14px',
              fontWeight: '700',
              marginTop: '4px'
            }}
          >
            {loading ? 'Authenticating...' : (
              <>
                Sign In to Dashboard &rarr;
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default LoginPage;
