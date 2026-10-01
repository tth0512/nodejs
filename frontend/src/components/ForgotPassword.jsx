// src/components/ForgotPassword.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient.js';
import './ForgotPassword.css';

function ForgotPassword() {
  const navigate = useNavigate();

  // step: 1 = Nhập email, 2 = Nhập mã OTP, 3 = Mật khẩu mới & xác nhận
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);

  const otpInputRefs = useRef([]);

  // Đếm ngược 60s cho phép gửi lại mã OTP ở Step 2
  useEffect(() => {
    let timer;
    if (step === 2 && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Focus ô đầu tiên khi chuyển sang Step 2
  useEffect(() => {
    if (step === 2 && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [step]);

  // === BƯỚC 1: GỬI MÃ OTP VỀ EMAIL ===
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email của bạn!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axiosClient.post('/auth/forgot-password', {
        email: email.trim(),
      });

      toast.info(response.data.message || 'Mã xác nhận đã được gửi!');
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi mã. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // === XỬ LÝ NHẬP MÃ OTP ===
  const handleOtpChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value ? value.slice(-1) : '';
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  // === BƯỚC 2: XÁC THỰC MÃ OTP ===
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã OTP!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axiosClient.post('/auth/verify-reset-otp', {
        email: email.trim(),
        otp: otpCode,
      });

      toast.success('Mã OTP chính xác! Hãy nhập mật khẩu mới.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn!');
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã OTP ở Bước 2
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setError('');

    try {
      const response = await axiosClient.post('/auth/forgot-password', {
        email: email.trim(),
      });
      toast.info(response.data.message || 'Mã xác nhận mới đã được gửi!');
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi gửi lại mã OTP!');
    } finally {
      setResending(false);
    }
  };

  // === BƯỚC 3: MẬT KHẨU MỚI & XÁC NHẬN MẬT KHẨU ===
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới!');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axiosClient.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.join(''),
        newPassword,
        confirmPassword,
      });

      toast.success(response.data.message || 'Đặt lại mật khẩu thành công!');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container forgot-container">
      {/* Thanh tiến trình 3 bước */}
      <div className="forgot-steps">
        <div className={`step-dot ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <span>1</span>
          <small>Email</small>
        </div>
        <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
        <div className={`step-dot ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <span>2</span>
          <small>Mã OTP</small>
        </div>
        <div className={`step-line ${step >= 3 ? 'active' : ''}`} />
        <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>
          <span>3</span>
          <small>Mật khẩu mới</small>
        </div>
      </div>

      <h2 className="auth-title">
        {step === 1 && 'Khôi phục mật khẩu'}
        {step === 2 && 'Nhập mã xác nhận'}
        {step === 3 && 'Tạo mật khẩu mới'}
      </h2>

      {error && <div className="auth-error">{error}</div>}

      {/* BƯỚC 1: NHẬP EMAIL */}
      {step === 1 && (
        <form onSubmit={handleSendOtp} className="auth-form">
          <p className="forgot-desc">
            Nhập địa chỉ email đăng ký tài khoản của bạn. Chúng tôi sẽ gửi mã OTP 6 chữ số để đặt lại mật khẩu.
          </p>
          <input
            type="email"
            placeholder="Địa chỉ Email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Đang gửi mã...' : 'Tiếp tục'}
          </button>
        </form>
      )}

      {/* BƯỚC 2: NHẬP MÃ OTP */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="auth-form">
          <p className="forgot-desc">
            Mã OTP đã được gửi tới <strong>{email}</strong>. Vui lòng nhập mã để tiếp tục:
          </p>

          <div className="otp-inputs-group" onPaste={handleOtpPaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (otpInputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="otp-digit-input"
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Đang kiểm tra...' : 'Xác nhận mã'}
          </button>

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
                {resending ? 'Đang gửi...' : 'Gửi lại mã OTP'}
              </button>
            )}
          </div>

          <button
            type="button"
            className="forgot-back-btn"
            onClick={() => setStep(1)}
          >
            ← Đổi địa chỉ email khác
          </button>
        </form>
      )}

      {/* BƯỚC 3: MẬT KHẨU MỚI & XÁC NHẬN MẬT KHẨU */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} className="auth-form">
          <p className="forgot-desc">
            Nhập mật khẩu mới cho tài khoản của bạn (tối thiểu 6 ký tự).
          </p>
          <input
            type="password"
            placeholder="Mật khẩu mới"
            className="auth-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="Xác nhận mật khẩu mới"
            className="auth-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      )}

      <div className="auth-switch">
        Nhớ mật khẩu? <Link to="/login" className="auth-switch-link">Đăng nhập ngay</Link>
      </div>
    </div>
  );
}

export default ForgotPassword;
