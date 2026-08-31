// src/components/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/useAuth.js';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      login(response.data.user);
      navigate('/posts');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại!');
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
        <button type="submit" className="auth-btn">Đăng nhập</button>
      </form>

      <div className="auth-switch">
        Chưa có tài khoản? <Link to="/register" className="auth-switch-link">Đăng ký ngay</Link>
      </div>
    </div>
  );
}

export default Login;