const router = require('express').Router();
const Feedback = require('../models/Feedback');
const { auth, adminOnly } = require('../middleware/auth');

// ─── Get Public Feedbacks for a Recipe ────────────────────────
router.get('/recipe/:id', async (req, res) => {
  try {
    const rows = await Feedback.find({ recipe_id: req.params.id, type: 'feedback' })
                               .populate('user_id', 'username')
                               .sort('-created_at')
                               .lean();
    res.json(rows.map(f => ({
      id: f._id,
      message: f.message,
      created_at: f.created_at,
      username: f.user_id ? f.user_id.username : 'Unknown'
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Submit Feedback or Suggestion ──────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { recipe_id, type, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    
    const fType = type === 'suggestion' ? 'suggestion' : 'feedback';
    
    await Feedback.create({
      user_id: req.user.id, 
      recipe_id: recipe_id || null, 
      type: fType, 
      message
    });
    
    res.status(201).json({ success: true, message: 'Submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Get all feedbacks & suggestions ───────────────────
router.get('/', adminOnly, async (req, res) => {
  try {
    const rows = await Feedback.find()
                               .populate('user_id', 'username')
                               .populate('recipe_id', 'title')
                               .sort('-created_at')
                               .lean();
    
    res.json(rows.map(f => ({
      id: f._id,
      type: f.type,
      message: f.message,
      status: f.status,
      created_at: f.created_at,
      username: f.user_id ? f.user_id.username : 'Unknown',
      recipe_title: f.recipe_id ? f.recipe_id.title : null
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Mark as read ──────────────────────────────────────
router.put('/:id/read', adminOnly, async (req, res) => {
  try {
    await Feedback.findByIdAndUpdate(req.params.id, { status: 'read' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
