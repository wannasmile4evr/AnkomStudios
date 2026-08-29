// mailer.js — sends the verification email through SendGrid's SMTP relay.
//
// Requires SENDGRID_API_KEY in .env (see .env.example) — free at
// sendgrid.com, 100 emails/day forever. The MAIL_FROM address must be a
// Verified Sender (or authenticated domain) in SendGrid's dashboard
// (Settings -> Sender Authentication) — SendGrid rejects every send
// otherwise, since that's how it stops people spoofing arbitrary "from"
// addresses through its relay.
const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is not set — add it to .env (see .env.example).');
    }
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY },
    });
  }
  return transporter;
}

async function sendVerificationEmail(to, verifyUrl) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.MAIL_FROM || '"Ankom Studios" <no-reply@ankomstudios.com>',
    to,
    subject: 'Verify your Ankom Studios account',
    text: `Verify your account by opening this link (expires in 24 hours):\n${verifyUrl}`,
    html: `
      <p>Thanks for signing up for Ankom Studios.</p>
      <p><a href="${verifyUrl}">Click here to verify your email</a> — this link expires in 24 hours.</p>
      <p>If the link doesn't work, paste this into your browser:<br>${verifyUrl}</p>
    `,
  });
}

module.exports = { sendVerificationEmail };
