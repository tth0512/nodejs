// src/components/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/utils/useAuth.js';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axiosClient.post('/auth/login', {
        email: email.trim(),
        password
      });
      login(response.data.user);
      navigate('/posts');
    } catch (err) {
      if (err.response?.data?.needVerification) {
        // Tài khoản chưa xác thực email -> chuyển sang trang xác thực
        navigate('/verify-email', {
          state: { email: err.response.data.email || email.trim() }
        });
        return;
      }
      setError(err.response?.data?.message || 'Đăng nhập thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Đăng nhập tài khoản</h2>
      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleLogin} className="auth-form">
        <input
          type="email"
          placeholder="Địa chỉ Email"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="auth-extra-links">
          <Link to="/forgot-password" className="auth-forgot-link">
            Quên mật khẩu?
          </Link>
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <div className="auth-switch">
        Chưa có tài khoản? <Link to="/register" className="auth-switch-link">Đăng ký ngay</Link>
      </div>
    </div>
  );
}

export default Login;