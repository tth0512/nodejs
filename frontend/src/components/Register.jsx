import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient.js';
import './Register.css';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axiosClient.post('/auth/register', {
        username: username.trim(),
        email: email.trim(),
        password,
      });

      const registeredEmail = response.data?.email || email.trim();
      toast.success(response.data?.message || 'Đăng ký thành công! Vui lòng nhập mã xác thực.');

      // Chuyển sang trang xác thực email với email vừa đăng ký
      navigate('/verify-email', { state: { email: registeredEmail } });
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
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
        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>

      <div className="auth-switch">
        Đã có tài khoản? <Link to="/login" className="auth-switch-link">Đăng nhập</Link>
      </div>
    </div>
  );
}

export default Register;