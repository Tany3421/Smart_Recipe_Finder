const router = require('express').Router();
const pool   = require('../config/db');
const { auth } = require('../middleware/auth');

// Get all favorites (full recipe objects)
router.get('/', auth, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT r.id,r.title,r.description,r.category,r.meal_type,r.cuisine,
            r.prep_time,r.cook_time,r.servings,r.difficulty,r.images,r.tags,r.featured,r.rating
     FROM favorites f JOIN recipes r ON f.recipe_id=r.id
     WHERE f.user_id=? ORDER BY f.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

// Get just IDs
router.get('/ids', auth, async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT recipe_id FROM favorites WHERE user_id=?', [req.user.id]
  );
  res.json(rows.map(r=>r.recipe_id));
});

// Add
router.post('/:recipeId', auth, async (req, res) => {
  try {
    await pool.execute(
      'INSERT INTO favorites (user_id,recipe_id) VALUES (?,?)',
      [req.user.id, req.params.recipeId]
    );
    res.json({ success: true });
  } catch(e){
    if(e.code==='ER_DUP_ENTRY') return res.status(409).json({ error:'Already in favorites' });
    res.status(500).json({ error: e.message });
  }
});

// Remove
router.delete('/:recipeId', auth, async (req, res) => {
  await pool.execute(
    'DELETE FROM favorites WHERE user_id=? AND recipe_id=?',
    [req.user.id, req.params.recipeId]
  );
  res.json({ success: true });
});

module.exports = router;
