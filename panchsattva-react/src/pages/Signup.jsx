import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authAPI } from '../api';
import { INDIA_LOCATIONS } from '../data/locations';
import toast from 'react-hot-toast';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dob: '',
    gender: '',
    address: '',
    state: '',
    city: '',
    pincode: '',
    terms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const availableCities = useMemo(() => {
    if (!formData.state || !INDIA_LOCATIONS[formData.state]) return [];
    return INDIA_LOCATIONS[formData.state];
  }, [formData.state]);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleStateChange = (e) => {
    const newState = e.target.value;
    setFormData((prev) => ({
      ...prev,
      state: newState,
      city: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!formData.phone.trim() || formData.phone.replace(/\D/g, '').length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!formData.terms) {
      toast.error('Please agree to the Terms & Conditions');
      return;
    }

    setLoading(true);

    try {
      const res = await authAPI.signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.replace(/\D/g, ''),
        password: formData.password,
        gender: formData.gender,
        dob: formData.dob,
        address: formData.address.trim(),
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode.trim()
      });

      if (res.data && res.data.user) {
        login(res.data.user, res.data.token, res.data.refreshToken);
        toast.success('Registration successful! Welcome to Panch Sattva.');
        navigate('/');
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      if (serverMsg) {
        toast.error(serverMsg);
      } else if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        toast.error('Cannot connect to server. Please ensure the backend is running.');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 15px' }}>
      <div className="signup-container" style={{ width: '100%', maxWidth: '520px', margin: '0 auto' }}>
        <div className="signup-box" style={{ background: '#fff', borderRadius: '16px', padding: '32px 24px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
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

          <p>Create Your Account</p>

          <form id="signupForm" onSubmit={handleSubmit}>
            <input
              type="text"
              id="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <input
              type="email"
              id="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <input
              type="tel"
              id="phone"
              placeholder="Mobile Number"
              maxLength="10"
              value={formData.phone}
              onChange={handleChange}
              required
            />

            <div className="password-box">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <i
                className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                id="togglePassword"
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: 'pointer' }}
              ></i>
            </div>

            <div className="password-box">
              <input
                type={showConfirm ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <i
                className={`fa-solid ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`}
                id="toggleConfirm"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ cursor: 'pointer' }}
              ></i>
            </div>

            <input
              type="date"
              id="dob"
              value={formData.dob}
              onChange={handleChange}
            />

            <select id="gender" value={formData.gender} onChange={handleChange}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <textarea
              id="address"
              rows="2"
              placeholder="Address (optional)"
              value={formData.address}
              onChange={handleChange}
            ></textarea>

            <select id="state" value={formData.state} onChange={handleStateChange}>
              <option value="">Select State / UT</option>
              {Object.keys(INDIA_LOCATIONS).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <select
              id="city"
              value={formData.city}
              onChange={handleChange}
              disabled={!formData.state}
            >
              <option value="">
                {!formData.state ? 'Select State First' : 'Select City'}
              </option>
              {availableCities.map((ct) => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
            </select>

            <input
              type="text"
              id="pincode"
              placeholder="6-digit PIN Code"
              maxLength="6"
              value={formData.pincode}
              onChange={handleChange}
            />

            <label className="terms">
              <input
                type="checkbox"
                id="terms"
                checked={formData.terms}
                onChange={handleChange}
                required
              />{' '}
              I agree to the Terms &amp; Conditions
            </label>

            <button type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="signup-link">
            Already have an account?{' '}
            <Link to="/login">Login</Link>
          </div>

          <Link
            to="/"
            style={{
              display: 'block',
              marginTop: '12px',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '12.5px',
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
