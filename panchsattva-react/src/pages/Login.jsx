import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const idVal = identifier.trim().toLowerCase();
    const passVal = password.trim();

    if (!idVal || !passVal) {
      toast.error('Please enter your email/mobile and password.');
      return;
    }

    setLoading(true);

    // Backend API login (handles both admin and customers)
    try {
      const res = await authAPI.login({
        email: idVal,
        identifier: idVal,
        password: passVal
      });

      if (res.data && res.data.user) {
        const loggedUser = {
          ...res.data.user,
          name: res.data.user.name || 'Member',
          email: res.data.user.email,
          mobile: res.data.user.phone || res.data.user.mobile,
          registeredAt: res.data.user.createdAt
        };

        // Login with both access token and refresh token
        login(loggedUser, res.data.token, res.data.refreshToken);
        toast.success(`Welcome back, ${loggedUser.name}!`);

        // Redirect based on role
        if (loggedUser.isAdmin || loggedUser.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
        setLoading(false);
        return;
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;

      if (status === 401) {
        toast.error(msg || 'Incorrect password. Please check and try again.');
        setLoading(false);
        return;
      }

      if (status === 404) {
        toast.error(msg || 'No account found. Please sign up first!');
        setLoading(false);
        return;
      }

      toast.error(msg || 'Login failed. Please check your credentials and try again.');
    }

    setLoading(false);
  };


  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
          <div className="logo" style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <img
                src="/images/psimg/pslogo.png"
                alt="PanchSattva Logo"
                className="logo-img"
                style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'contain' }}
              />
              <span
                className="logo-text"
                style={{
                  fontSize: '24px',
                  fontFamily: 'Cinzel, serif',
                  fontWeight: '700',
                  color: '#800020',
                  letterSpacing: '2px'
                }}
              >
                PANCH<span>&nbsp;SATTVA</span>
              </span>
            </Link>
          </div>

          <p>Welcome Back</p>

          <form id="loginForm" onSubmit={handleSubmit}>
            <input
              type="text"
              id="loginIdentifier"
              placeholder="Email, Mobile Number, or Full Name"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />

            <div className="password-box">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <i
                className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                id="togglePassword"
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: 'pointer' }}
              ></i>
            </div>

            <div className="login-options">
              <label>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />{' '}
                Remember Me
              </label>
            </div>

            <button type="submit" id="loginSubmitBtn" disabled={loading}>
              {loading ? 'Logging In...' : 'Login'}
            </button>
          </form>

          <div className="signup-link">
            Don't have an account?{' '}
            <Link to="/signup">Sign Up Directly</Link>
          </div>

          <Link
            to="/"
            style={{
              display: 'block',
              marginTop: '16px',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '13px',
              textDecoration: 'none'
            }}
          >
            <i className="fa-solid fa-arrow-left"></i> Return to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
