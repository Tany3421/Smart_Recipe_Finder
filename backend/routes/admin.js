const router = require('express').Router();
const pool   = require('../config/db');
const { adminOnly } = require('../middleware/auth');

// Dashboard stats
router.get('/stats', adminOnly, async (req, res) => {
  const [[{ total }]]   = await pool.execute('SELECT COUNT(*) as total FROM recipes');
  const [[{ users }]]   = await pool.execute("SELECT COUNT(*) as users FROM users WHERE role='user'");
  const [[{ favs }]]    = await pool.execute('SELECT COUNT(*) as favs FROM favorites');
  const [[{ cats }]]    = await pool.execute('SELECT COUNT(DISTINCT category) as cats FROM recipes');
  const [[{ plans }]]   = await pool.execute('SELECT COUNT(*) as plans FROM meal_plans');
  const [recent]        = await pool.execute(
    'SELECT id,title,category,meal_type,images,difficulty,created_at FROM recipes ORDER BY created_at DESC LIMIT 5'
  );
  res.json({ totalRecipes:total, totalUsers:users, totalFavorites:favs, categories:cats, totalPlans:plans, recentRecipes:recent });
});

// All users
router.get('/users', adminOnly, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT u.id,u.username,u.email,u.role,u.created_at,
            COUNT(f.id) as favorites_count
     FROM users u
     LEFT JOIN favorites f ON u.id=f.user_id
     GROUP BY u.id ORDER BY u.created_at DESC`
  );
  res.json(rows);
});

// Delete user
router.delete('/users/:id', adminOnly, async (req, res) => {
  if(req.params.id === req.user.id)
    return res.status(400).json({ error:'Cannot delete your own account' });
  const [[row]] = await pool.execute('SELECT id FROM users WHERE id=?', [req.params.id]);
  if(!row) return res.status(404).json({ error:'User not found' });
  await pool.execute('DELETE FROM users WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
