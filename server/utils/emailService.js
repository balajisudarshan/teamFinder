const nodemailer = require('nodemailer');
const dns = require('dns');

// Fallback to public DNS to prevent lookup ETIMEDOUT on cloud providers like Render
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const rawPass = process.env.SMTP_PASS;

    if (!user || !rawPass) {
      return null;
    }

    // Strip any spaces from the 16-character Google App Password (e.g. 'mpmj cxpw zaix iqzn' -> 'mpmjcxpwzaixiqzn')
    const pass = rawPass.replace(/\s+/g, '');

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
};

/**
 * Universal Email Sender:
 * 1. Uses Brevo REST API (HTTPS port 443) if BREVO_API_KEY is present (100% works on Render free tier).
 * 2. Uses Resend REST API (HTTPS port 443) if RESEND_API_KEY is present.
 * 3. Falls back to Nodemailer SMTP.
 */
const sendMail = async ({ toEmail, subject, htmlContent }) => {
  // Option A: Brevo HTTP API (Recommended for Render free tier, no custom domain needed)
  if (process.env.BREVO_API_KEY) {
    const senderEmail = process.env.BREVO_SENDER || process.env.SMTP_USER || 'gadiparthieswar2@gmail.com';
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'NBKRIST TeamFinder',
          email: senderEmail,
        },
        to: [{ email: toEmail }],
        subject,
        htmlContent,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Brevo HTTP API failed with status ${res.status}`);
    }
    return true;
  }

  // Option B: Resend HTTP API (HTTPS port 443)
  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'NBKRIST TeamFinder <onboarding@resend.dev>',
        to: [toEmail],
        subject,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Resend HTTP API failed with status ${res.status}`);
    }
    return true;
  }

  // Option C: Traditional Nodemailer SMTP (Local development or paid hosting with open SMTP)
  const mailer = getTransporter();
  const from = process.env.SMTP_FROM || `"NBKRIST TeamFinder" <${process.env.SMTP_USER}>`;

  if (!mailer) {
    console.warn('⚠️ No email provider configured (BREVO_API_KEY, RESEND_API_KEY, or SMTP_USER/PASS).');
    return false;
  }

  return await mailer.sendMail({
    from,
    to: toEmail,
    subject,
    html: htmlContent,
  });
};

/**
 * Send 6-digit OTP for 1st Year / Newcomer Registration
 */
const sendRegistrationOtpEmail = async ({ toEmail, rollNumber, otp }) => {
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

  try {
    const sent = await sendMail({
      toEmail,
      subject: `[NBKRIST TeamFinder] Verification Code: ${otp}`,
      htmlContent,
    });
    if (!sent) {
      console.log(`\n========================================`);
      console.log(`[DEV OTP LOG] Registration for ${rollNumber} (${toEmail}): OTP = ${otp}`);
      console.log(`========================================\n`);
    }
    return true;
  } catch (err) {
    console.error(`Failed to deliver OTP email to ${toEmail}:`, err.message);
    throw err;
  }
};

/**
 * Send 6-digit OTP for Password Reset
 */
const sendForgotPasswordOtpEmail = async ({ toEmail, name, otp }) => {
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

  try {
    const sent = await sendMail({
      toEmail,
      subject: `[NBKRIST TeamFinder] Password Reset OTP: ${otp}`,
      htmlContent,
    });
    if (!sent) {
      console.log(`\n========================================`);
      console.log(`[DEV OTP LOG] Password Reset for ${toEmail}: OTP = ${otp}`);
      console.log(`========================================\n`);
    }
    return true;
  } catch (err) {
    console.error(`Failed to deliver password reset email to ${toEmail}:`, err.message);
    throw err;
  }
};

module.exports = {
  sendRegistrationOtpEmail,
  sendForgotPasswordOtpEmail,
};
