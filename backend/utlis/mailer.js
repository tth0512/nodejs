// backend/utlis/mailer.js
import nodemailer from 'nodemailer';

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createMailTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, ''); // xóa khoảng trắng nếu user copy-paste có dấu cách

  if (!user || !pass) {
    return null;
  }

  if (host.includes('gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

export const sendVerificationEmail = async (toEmail, otp) => {
  const transporter = createMailTransporter();
  const from = process.env.SMTP_FROM || `"UniConnect" <${process.env.SMTP_USER || 'noreply@uniconnect.vn'}>`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #6366f1; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">UniConnect</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 6px;">Mạng xã hội kết nối sinh viên & giảng viên</p>
      </div>
      
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <p style="color: #334155; font-size: 15px; margin: 0 0 12px 0;">Mã xác thực đăng ký tài khoản của bạn là:</p>
        <div style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #4f46e5; background: #ffffff; padding: 12px 28px; border-radius: 10px; border: 1px solid #cbd5e1;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 13px; margin: 12px 0 0 0;">
          Mã có hiệu lực trong vòng <strong>10 phút</strong>.
        </p>
      </div>

      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
        Vui lòng không chia sẻ mã xác thực này cho bất kỳ ai nhằm bảo mật tài khoản của bạn.
      </p>

      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
        Nếu bạn không thực hiện yêu cầu này, xin vui lòng bỏ qua email.
      </p>
    </div>
  `;

  if (!transporter) {
    console.log(`\n========================================`);
    console.log(`[MAILER DEV NOTICE] SMTP chưa được cấu hình!`);
    console.log(`Mã xác thực (OTP) gửi tới [${toEmail}] là: >>> ${otp} <<<`);
    console.log(`========================================\n`);
    return true;
  }

  try {
    await transporter.sendMail({
      from,
      to: toEmail,
      subject: '🔐 [UniConnect] Mã xác thực đăng ký tài khoản',
      html,
    });
    return true;
  } catch (error) {
    console.error('Lỗi khi gửi email qua SMTP:', error.message);
    console.log(`[MAILER DEV FALLBACK] Mã OTP gửi tới [${toEmail}] là: >>> ${otp} <<<`);
    return false;
  }
};

export const sendResetPasswordEmail = async (toEmail, otp) => {
  const transporter = createMailTransporter();
  const from = process.env.SMTP_FROM || `"UniConnect" <${process.env.SMTP_USER || 'noreply@uniconnect.vn'}>`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #6366f1; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">UniConnect</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 6px;">Yêu cầu khôi phục mật khẩu</p>
      </div>
      
      <div style="background: #fef2f2; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; border: 1px solid #fecaca;">
        <p style="color: #991b1b; font-size: 15px; margin: 0 0 12px 0;">Mã OTP đặt lại mật khẩu của bạn là:</p>
        <div style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #dc2626; background: #ffffff; padding: 12px 28px; border-radius: 10px; border: 1px solid #fca5a5;">
          ${otp}
        </div>
        <p style="color: #991b1b; font-size: 13px; margin: 12px 0 0 0;">
          Mã có hiệu lực trong vòng <strong>10 phút</strong>.
        </p>
      </div>

      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
        Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản UniConnect. Nhập mã OTP trên cùng mật khẩu mới để hoàn tất.
      </p>

      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
        Nếu bạn không gửi yêu cầu này, hãy đổi mật khẩu ngay hoặc bỏ qua thông báo này.
      </p>
    </div>
  `;

  if (!transporter) {
    console.log(`\n========================================`);
    console.log(`[MAILER DEV NOTICE] SMTP chưa được cấu hình!`);
    console.log(`Mã OTP khôi phục mật khẩu gửi tới [${toEmail}] là: >>> ${otp} <<<`);
    console.log(`========================================\n`);
    return true;
  }

  try {
    await transporter.sendMail({
      from,
      to: toEmail,
      subject: '🔑 [UniConnect] Mã khôi phục mật khẩu',
      html,
    });
    return true;
  } catch (error) {
    console.error('Lỗi khi gửi email qua SMTP:', error.message);
    console.log(`[MAILER DEV FALLBACK] Mã OTP gửi tới [${toEmail}] là: >>> ${otp} <<<`);
    return false;
  }
};
