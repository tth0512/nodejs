// src/components/VerifyEmail.jsx
import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient.js';
import './VerifyEmail.css';

function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);

  const inputRefs = useRef([]);

  // Đếm ngược 60s cho phép gửi lại mã
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus ô đầu tiên khi mở trang
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index, value) => {
    // Chỉ nhận chữ số
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    // Lấy ký tự cuối cùng nếu người dùng nhập đè
    newOtp[index] = value ? value.slice(-1) : '';
    setOtp(newOtp);
    setError('');

    // Tự động focus sang ô tiếp theo
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Nhấn Backspace khi ô đang trống -> lùi về ô trước
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (!email) {
      setError('Vui lòng nhập địa chỉ email của bạn!');
      return;
    }

    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã xác thực!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axiosClient.post('/auth/verify-email', {
        email,
        otp: otpCode,
      });

      toast.success(response.data.message || 'Xác thực tài khoản thành công!');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn!');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;

    if (!email) {
      setError('Vui lòng nhập địa chỉ email để nhận lại mã!');
      return;
    }

    setResending(true);
    setError('');

    try {
      const response = await axiosClient.post('/auth/resend-otp', { email });
      toast.success(response.data.message || 'Mã xác thực mới đã được gửi!');
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi gửi lại mã. Vui lòng thử lại!');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container verify-container">
      <div className="verify-icon-wrap">
        <span className="verify-icon">✉️</span>
      </div>
      <h2 className="auth-title">Xác thực tài khoản</h2>
      <p className="verify-subtitle">
        Chúng tôi đã gửi mã xác thực 6 chữ số đến hộp thư của bạn. Vui lòng nhập mã để kích hoạt tài khoản.
      </p>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleVerify} className="auth-form">
        {!location.state?.email && (
          <div className="verify-email-field">
            <label className="verify-label">Địa chỉ Email:</label>
            <input
              type="email"
              className="auth-input"
              placeholder="Nhập email đã đăng ký"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        )}

        {location.state?.email && (
          <div className="verify-email-badge">
            Gửi tới: <strong>{email}</strong>
          </div>
        )}

        <div className="otp-inputs-group" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className="otp-digit-input"
              value={digit}
              onChange={(e) => handleOtpChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        <button type="submit" className="auth-btn verify-submit-btn" disabled={loading}>
          {loading ? 'Đang xác thực...' : 'Xác nhận & Kích hoạt'}
        </button>
      </form>

      <div className="verify-resend-box">
        {resendCooldown > 0 ? (
          <span className="resend-countdown">
            Gửi lại mã sau <strong>{resendCooldown}s</strong>
          </span>
        ) : (
          <button
            type="button"
            className="resend-btn"
            onClick={handleResendOtp}
            disabled={resending}
          >
            {resending ? 'Đang gửi...' : 'Gửi lại mã xác thực'}
          </button>
        )}
      </div>

      <div className="auth-switch">
        Đã kích hoạt tài khoản? <Link to="/login" className="auth-switch-link">Đăng nhập</Link>
      </div>
    </div>
  );
}

export default VerifyEmail;
