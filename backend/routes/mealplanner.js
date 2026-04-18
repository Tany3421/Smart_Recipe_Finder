const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const pool   = require('../config/db');
const { auth } = require('../middleware/auth');

// Helper – get Monday of given date string
function weekMonday(dateStr){
  const d = new Date(dateStr || Date.now());
  const day = d.getUTCDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day);
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0,10);
}

// Get or create plan for a week, return full items
router.get('/', auth, async (req, res) => {
  try {
    const week = weekMonday(req.query.week);

    // Find or create plan
    let [[plan]] = await pool.execute(
      'SELECT * FROM meal_plans WHERE user_id=? AND week_start=?',
      [req.user.id, week]
    );
    if(!plan){
      const planId = uuidv4();
      await pool.execute(
        'INSERT INTO meal_plans (id,user_id,week_start) VALUES (?,?,?)',
        [planId, req.user.id, week]
      );
      plan = { id: planId, user_id: req.user.id, week_start: week };
    }

    const [items] = await pool.execute(
      `SELECT mpi.id, mpi.day_of_week, mpi.meal_type,
              r.id as recipe_id, r.title, r.images, r.prep_time, r.cook_time,
              r.difficulty, r.category, r.cuisine, r.rating
       FROM meal_plan_items mpi
       JOIN recipes r ON mpi.recipe_id=r.id
       WHERE mpi.plan_id=?
       ORDER BY mpi.day_of_week, mpi.meal_type`,
      [plan.id]
    );

    res.json({ plan_id: plan.id, week_start: week, items });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// Add / replace a slot
router.post('/item', auth, async (req, res) => {
  const { week, day_of_week, meal_type, recipe_id } = req.body;
  if(day_of_week === undefined || !meal_type || !recipe_id)
    return res.status(400).json({ error:'day_of_week, meal_type, recipe_id required' });

  try {
    const mon = weekMonday(week);

    // Get or create plan
    let [[plan]] = await pool.execute(
      'SELECT * FROM meal_plans WHERE user_id=? AND week_start=?',
      [req.user.id, mon]
    );
    if(!plan){
      const planId = uuidv4();
      await pool.execute(
        'INSERT INTO meal_plans (id,user_id,week_start) VALUES (?,?,?)',
        [planId, req.user.id, mon]
      );
      plan = { id: planId };
    }

    // Delete existing slot
    await pool.execute(
      'DELETE FROM meal_plan_items WHERE plan_id=? AND day_of_week=? AND meal_type=?',
      [plan.id, day_of_week, meal_type]
    );

    // Verify recipe exists
    const [[recipe]] = await pool.execute('SELECT id FROM recipes WHERE id=?', [recipe_id]);
    if(!recipe) return res.status(404).json({ error:'Recipe not found' });

    const itemId = uuidv4();
    await pool.execute(
      'INSERT INTO meal_plan_items (id,plan_id,day_of_week,meal_type,recipe_id) VALUES (?,?,?,?,?)',
      [itemId, plan.id, day_of_week, meal_type, recipe_id]
    );

    res.json({ success: true, item_id: itemId });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// Remove a slot item
router.delete('/item/:itemId', auth, async (req, res) => {
  try {
    // Verify item belongs to this user
    const [[item]] = await pool.execute(
      `SELECT mpi.id FROM meal_plan_items mpi
       JOIN meal_plans mp ON mpi.plan_id=mp.id
       WHERE mpi.id=? AND mp.user_id=?`,
      [req.params.itemId, req.user.id]
    );
    if(!item) return res.status(404).json({ error:'Item not found' });
    await pool.execute('DELETE FROM meal_plan_items WHERE id=?', [req.params.itemId]);
    res.json({ success: true });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// Shopping list – aggregate all ingredients for the week
router.get('/shopping-list', auth, async (req, res) => {
  try {
    const week = weekMonday(req.query.week);
    const [[plan]] = await pool.execute(
      'SELECT id FROM meal_plans WHERE user_id=? AND week_start=?',
      [req.user.id, week]
    );
    if(!plan) return res.json({ ingredients: [], recipes: [] });

    const [items] = await pool.execute(
      `SELECT DISTINCT r.title, r.ingredients, mpi.meal_type, mpi.day_of_week
       FROM meal_plan_items mpi
       JOIN recipes r ON mpi.recipe_id=r.id
       WHERE mpi.plan_id=?`,
      [plan.id]
    );

    const allIngredients = [];
    items.forEach(item => {
      const ings = typeof item.ingredients === 'string'
        ? JSON.parse(item.ingredients) : item.ingredients;
      ings.forEach(ing => allIngredients.push({ ingredient: ing, recipe: item.title }));
    });

    res.json({ ingredients: allIngredients, recipes: items.map(i=>i.title) });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

module.exports = router;
