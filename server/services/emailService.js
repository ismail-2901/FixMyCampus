// services/emailService.js
const nodemailer = require('nodemailer');

const sendVerificationEmail = async (to, name, code) => {
  // Dev mode: just log the code
  if (!process.env.EMAIL_USER) {
    console.log(`\n📧 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   Verification code for ${to}: ${code}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'FixMyCampus - Email Verification Code',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
        <div style="background:#1e40af;color:white;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="margin:0;font-size:22px;">🎓 FixMyCampus</h1>
        </div>
        <div style="background:#f9fafb;padding:32px;border-radius:0 0 8px 8px;">
          <h2>Hello ${name}!</h2>
          <p>Your verification code is:</p>
          <div style="background:white;border:2px dashed #1e40af;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
            <span style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#1e40af;">${code}</span>
          </div>
          <p style="color:#6b7280;font-size:13px;">Expires in 15 minutes.</p>
        </div>
      </div>`,
  });
};

module.exports = { sendVerificationEmail };
