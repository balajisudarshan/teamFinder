const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      console.warn('⚠️ SMTP credentials not configured in environment variables. Emails will be logged to console in dev mode.');
      return null;
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }
  return transporter;
};

/**
 * Send 6-digit OTP for 1st Year / Newcomer Registration
 */
const sendRegistrationOtpEmail = async ({ toEmail, rollNumber, otp }) => {
  const mailer = getTransporter();
  const from = process.env.SMTP_FROM || `"NBKRIST TeamFinder" <${process.env.SMTP_USER}>`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="background: #0f172a; padding: 24px 28px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">NBKRIST TeamFinder</h1>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 6px; margin-bottom: 0;">Student Onboarding Verification</p>
      </div>
      <div style="padding: 28px 32px; color: #1e293b;">
        <p style="font-size: 14px; line-height: 1.6; margin-top: 0;">
          Hello,
        </p>
        <p style="font-size: 13px; line-height: 1.6; color: #475569;">
          You are registering for <strong>TeamFinder</strong> with university roll number <strong style="color: #0f172a;">${rollNumber}</strong>. Use the verification code below to confirm your personal email address:
        </p>
        <div style="margin: 24px 0; text-align: center;">
          <div style="display: inline-block; background: #f8fafc; border: 1.5px dashed #0284c7; border-radius: 8px; padding: 14px 32px;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0284c7;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 11px; color: #64748b; margin-top: 8px;">Valid for <strong>5 minutes</strong> only.</p>
        </div>
        <div style="background: #f1f5f9; border-radius: 6px; padding: 12px 16px; font-size: 12px; color: #475569; line-height: 1.5;">
          <strong>Security notice:</strong> If you did not initiate this registration request, please disregard this email. Never share your OTP with anyone.
        </div>
      </div>
      <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 28px; text-align: center; font-size: 11px; color: #94a3b8;">
        N.B.K.R. Institute of Science & Technology &bull; SIH & Hackathon Collaboration Portal
      </div>
    </div>
  `;

  if (!mailer) {
    console.log(`\n========================================`);
    console.log(`[DEV OTP LOG] Registration for ${rollNumber} (${toEmail}): OTP = ${otp}`);
    console.log(`========================================\n`);
    return true;
  }

  return await mailer.sendMail({
    from,
    to: toEmail,
    subject: `[NBKRIST TeamFinder] Verification Code: ${otp}`,
    html: htmlContent,
  });
};

/**
 * Send 6-digit OTP for Password Reset
 */
const sendForgotPasswordOtpEmail = async ({ toEmail, name, otp }) => {
  const mailer = getTransporter();
  const from = process.env.SMTP_FROM || `"NBKRIST TeamFinder" <${process.env.SMTP_USER}>`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="background: #0f172a; padding: 24px 28px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">NBKRIST TeamFinder</h1>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 6px; margin-bottom: 0;">Password Reset Request</p>
      </div>
      <div style="padding: 28px 32px; color: #1e293b;">
        <p style="font-size: 14px; line-height: 1.6; margin-top: 0;">
          Hi ${name || 'Student'},
        </p>
        <p style="font-size: 13px; line-height: 1.6; color: #475569;">
          We received a request to reset your password on NBKRIST TeamFinder. Use the one-time verification code below to proceed:
        </p>
        <div style="margin: 24px 0; text-align: center;">
          <div style="display: inline-block; background: #f8fafc; border: 1.5px dashed #dc2626; border-radius: 8px; padding: 14px 32px;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #dc2626;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 11px; color: #64748b; margin-top: 8px;">Valid for <strong>5 minutes</strong> only.</p>
        </div>
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px 16px; font-size: 12px; color: #991b1b; line-height: 1.5;">
          <strong>Didn't request this?</strong> If you did not ask to reset your password, someone may have entered your roll number by mistake. Your account remains safe and no changes have been made.
        </div>
      </div>
      <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 28px; text-align: center; font-size: 11px; color: #94a3b8;">
        N.B.K.R. Institute of Science & Technology &bull; SIH & Hackathon Collaboration Portal
      </div>
    </div>
  `;

  if (!mailer) {
    console.log(`\n========================================`);
    console.log(`[DEV OTP LOG] Password Reset for ${toEmail}: OTP = ${otp}`);
    console.log(`========================================\n`);
    return true;
  }

  return await mailer.sendMail({
    from,
    to: toEmail,
    subject: `[NBKRIST TeamFinder] Password Reset OTP: ${otp}`,
    html: htmlContent,
  });
};

module.exports = {
  sendRegistrationOtpEmail,
  sendForgotPasswordOtpEmail,
};
