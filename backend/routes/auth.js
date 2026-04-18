require('dotenv').config();
const router     = require('express').Router();
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const pool       = require('../config/db');
const { auth }   = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'recipe-secret';
const SITE_URL   = process.env.SITE_URL   || 'http://localhost:3000';

function makeToken(user){
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET, { expiresIn: '7d' }
  );
}

function safeUser(u){ return { id:u.id, username:u.username, email:u.email, role:u.role }; }

// ─── Register ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if(!username || !email || !password)
    return res.status(400).json({ error:'All fields are required' });
  if(password.length < 6)
    return res.status(400).json({ error:'Password must be at least 6 characters' });
  try {
    const [exist] = await pool.execute(
      'SELECT id FROM users WHERE email=? OR username=?', [email, username]
    );
    if(exist.length) return res.status(409).json({ error:'Email or username already taken' });

    const id   = uuidv4();
    const hash = bcrypt.hashSync(password, 10);
    await pool.execute(
      'INSERT INTO users (id,username,email,password) VALUES (?,?,?,?)',
      [id, username, email, hash]
    );
    const [[user]] = await pool.execute('SELECT * FROM users WHERE id=?', [id]);
    res.json({ token: makeToken(user), user: safeUser(user) });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// ─── Login ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [[user]] = await pool.execute(
      'SELECT * FROM users WHERE email=? OR username=?', [email, email]
    );
    if(!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error:'Invalid credentials' });
    res.json({ token: makeToken(user), user: safeUser(user) });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// ─── Me ───────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  const [[user]] = await pool.execute('SELECT * FROM users WHERE id=?', [req.user.id]);
  if(!user) return res.status(404).json({ error:'User not found' });
  res.json(safeUser(user));
});

// ─── Forgot Password ──────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if(!email) return res.status(400).json({ error:'Email is required' });
  try {
    const [[user]] = await pool.execute('SELECT * FROM users WHERE email=?', [email]);
    if(!user) return res.status(404).json({ error:'No account with that email' });

    const token  = uuidv4();
    const expiry = Date.now() + 3_600_000; // 1 hour
    await pool.execute(
      'UPDATE users SET reset_token=?, reset_expiry=? WHERE id=?',
      [token, expiry, user.id]
    );

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const link = `${SITE_URL}/reset-password.html?token=${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Smart Recipe Finder" <${process.env.EMAIL_USER}>`,
      to:   user.email,
      subject: '🔑 Reset your Smart Recipe Finder password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #eee">
          <h2 style="color:#D72638">Password Reset</h2>
          <p>Hi <strong>${user.username}</strong>,</p>
          <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${link}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#D72638;color:#fff;border-radius:100px;text-decoration:none;font-weight:700">
            Reset Password
          </a>
          <p style="color:#999;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
        </div>`
    });

    res.json({ success: true });
  } catch(e){
    console.error('Forgot password error:', e.message);
    res.status(500).json({ error: 'Failed to send email. Check server EMAIL config.' });
  }
});

// ─── Reset Password ───────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if(!token || !password)
    return res.status(400).json({ error:'Token and new password are required' });
  if(password.length < 6)
    return res.status(400).json({ error:'Password must be at least 6 characters' });
  try {
    const [[user]] = await pool.execute(
      'SELECT * FROM users WHERE reset_token=? AND reset_expiry > ?',
      [token, Date.now()]
    );
    if(!user) return res.status(400).json({ error:'Invalid or expired reset link' });

    const hash = bcrypt.hashSync(password, 10);
    await pool.execute(
      'UPDATE users SET password=?, reset_token=NULL, reset_expiry=NULL WHERE id=?',
      [hash, user.id]
    );
    res.json({ success: true });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

module.exports = router;
