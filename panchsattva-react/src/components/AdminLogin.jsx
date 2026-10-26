import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authAPI } from '../api';
import toast from 'react-hot-toast';
import '../styles/admin.css';

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleQuickFill = () => {
    setEmail('admin@panchsattva.com');
    setPassword('Admin@123');
    toast.success('Admin credentials autofilled!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      toast.error('Please enter admin email and security password.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.login({
        email: cleanEmail,
        identifier: cleanEmail,
        password: cleanPassword
      });

      if (res.data && res.data.user) {
        const loggedUser = res.data.user;

        // Verify admin privilege
        if (!loggedUser.isAdmin && loggedUser.role !== 'admin') {
          toast.error('Access Denied: This account lacks administrative credentials.');
          setLoading(false);
          return;
        }

        const adminObj = {
          ...loggedUser,
          name: loggedUser.name || 'Store Manager',
          isAdmin: true,
          role: 'admin'
        };

        login(adminObj, res.data.token, res.data.refreshToken);
        try {
          localStorage.setItem('panch_admin_session', 'true');
        } catch (_) {}
        toast.success(`Welcome to Administrative Suite, ${adminObj.name}!`);

        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }
    } catch (err) {
      console.error('Admin login error:', err);
      const msg = err.response?.data?.message || 'Authentication failed. Please verify credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="login-card">
        <div className="login-brand">
          <img
            src="/images/psimg/pslogo.png"
            alt="Panch Sattva Logo"
          />
          <h2>PANCH <span>SATTVA</span></h2>
          <p>ADMINISTRATIVE SUITE</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Admin Email Address</label>
            <div className="input-icon-wrap">
              <i className="fa-solid fa-envelope prefix-icon"></i>
              <input
                type="email"
                placeholder="admin@panchsattva.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Security Password</label>
            <div className="input-icon-wrap">
              <i className="fa-solid fa-lock prefix-icon"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <i
                className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-pass`}
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              ></i>
            </div>
          </div>

          <button type="submit" className="btn-primary-admin" disabled={loading}>
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Authenticating...
              </>
            ) : (
              <>
                <i className="fa-solid fa-arrow-right-to-bracket"></i> Access Admin Console
              </>
            )}
          </button>
        </form>

        <div className="demo-credentials-box">
          <div>
            <i className="fa-solid fa-shield-halved" style={{ color: 'var(--gold, #c5a059)', marginRight: '6px' }}></i>
            <strong>Default Admin Credentials:</strong>
          </div>
          <div style={{ marginTop: '6px' }}>Email: <code>admin@panchsattva.com</code></div>
          <div>Password: <code>Admin@123</code></div>
          <button type="button" className="btn-quick-fill" onClick={handleQuickFill}>
            <i className="fa-solid fa-bolt"></i> Auto-Fill Credentials
          </button>
        </div>

        <Link to="/" className="back-to-store-link">
          <i className="fa-solid fa-arrow-left"></i> Return to Boutique Store
        </Link>
      </div>
    </div>
  );
}
