// src/components/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import './Register.css';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axiosClient.post('/auth/register', {
        username,
        email,
        password,
      });

      setSuccess('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
      setUsername('');
      setEmail('');
      setPassword('');

      // Chuyển sang form Login sau 1.5 giây
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!');
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Đăng ký tài khoản</h2>
      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}

      <form onSubmit={handleRegister} className="auth-form">
        <input
          type="text"
          placeholder="Tên người dùng (Username)"
          className="auth-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
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
        <button type="submit" className="auth-btn">Đăng ký</button>
      </form>

      <div className="auth-switch">
        Đã có tài khoản? <Link to="/login" className="auth-switch-link">Đăng nhập</Link>
      </div>
    </div>
  );
}

export default Register;