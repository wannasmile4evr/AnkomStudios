require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const session = require('express-session');
const db = require('./db');
const { sendVerificationEmail } = require('./mailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 1 week
}));

// Serves index.html + assets/ — this replaces Live Server entirely.
// dotfiles: 'deny' stops .env (and .gitignore, etc.) from being
// fetchable at http://localhost:3000/.env now that it lives in the
// same folder as index.html.
app.use(express.static(__dirname, { dotfiles: 'deny' }));

// --- Signup: creates an unverified user, emails a verify link ---
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 1000 * 60 * 60 * 24; // 24 hours

  db.prepare(`
    INSERT INTO users (email, password_hash, verified, verify_token, verify_token_expires)
    VALUES (?, ?, 0, ?, ?)
  `).run(email, passwordHash, token, expires);

  const verifyUrl = `${process.env.APP_BASE_URL || `http://localhost:${PORT}`}/api/verify?token=${token}`;
  try {
    await sendVerificationEmail(email, verifyUrl);
  } catch (err) {
    console.error('Failed to send verification email:', err);
  }

  res.status(201).json({ message: 'Account created. Check your email to verify it.' });
});

// --- Verify: hit when the user clicks the link from their email ---
app.get('/api/verify', (req, res) => {
  const { token } = req.query;
  const user = db.prepare('SELECT * FROM users WHERE verify_token = ?').get(token);

  if (!user || user.verify_token_expires < Date.now()) {
    return res.status(400).send('This verification link is invalid or has expired.');
  }

  db.prepare(`
    UPDATE users SET verified = 1, verify_token = NULL, verify_token_expires = NULL
    WHERE id = ?
  `).run(user.id);

  res.send('Your email is verified! You can close this tab and log in.');
});

// --- Login: blocks accounts that haven't verified yet ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  if (!user.verified) {
    return res.status(403).json({ error: 'Please verify your email before logging in.' });
  }

  req.session.userId = user.id;
  res.json({ message: 'Logged in.', email: user.email });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
