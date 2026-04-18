const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

// ─── Get Public Feedbacks for a Recipe ────────────────────────
router.get('/recipe/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT f.id, f.message, f.created_at, u.username
      FROM feedbacks f
      JOIN users u ON f.user_id = u.id
      WHERE f.recipe_id = ? AND f.type = 'feedback'
      ORDER BY f.created_at DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Submit Feedback or Suggestion ──────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { recipe_id, type, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    
    const id = uuidv4();
    const fType = type === 'suggestion' ? 'suggestion' : 'feedback';
    
    await pool.execute(
      `INSERT INTO feedbacks (id, user_id, recipe_id, type, message, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
      [id, req.user.id, recipe_id || null, fType, message]
    );
    res.status(201).json({ success: true, message: 'Submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Get all feedbacks & suggestions ───────────────────
router.get('/', adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT f.id, f.type, f.message, f.status, f.created_at, u.username, r.title as recipe_title
      FROM feedbacks f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN recipes r ON f.recipe_id = r.id
      ORDER BY f.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Mark as read ──────────────────────────────────────
router.put('/:id/read', adminOnly, async (req, res) => {
  try {
    await pool.execute('UPDATE feedbacks SET status = "read" WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
