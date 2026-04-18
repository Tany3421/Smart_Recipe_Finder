const router = require('express').Router();
const MealPlan = require('../models/MealPlan');
const MealPlanItem = require('../models/MealPlanItem');
const Recipe = require('../models/Recipe');
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
    let plan = await MealPlan.findOne({ user_id: req.user.id, week_start: new Date(week) }).lean();
    if(!plan){
      plan = await MealPlan.create({ user_id: req.user.id, week_start: new Date(week) });
    }

    const itemsRaw = await MealPlanItem.find({ plan_id: plan._id })
      .populate('recipe_id')
      .sort('day_of_week meal_type')
      .lean();

    const items = itemsRaw.map(i => {
      if(!i.recipe_id) return null;
      return {
        id: i._id,
        day_of_week: i.day_of_week,
        meal_type: i.meal_type,
        recipe_id: i.recipe_id._id,
        title: i.recipe_id.title,
        images: i.recipe_id.images,
        prep_time: i.recipe_id.prep_time,
        cook_time: i.recipe_id.cook_time,
        difficulty: i.recipe_id.difficulty,
        category: i.recipe_id.category,
        cuisine: i.recipe_id.cuisine,
        rating: i.recipe_id.rating
      };
    }).filter(Boolean);

    res.json({ plan_id: plan._id || plan.id, week_start: week, items });
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
    let plan = await MealPlan.findOne({ user_id: req.user.id, week_start: new Date(mon) });
    if(!plan){
      plan = await MealPlan.create({ user_id: req.user.id, week_start: new Date(mon) });
    }

    // Delete existing slot
    await MealPlanItem.findOneAndDelete({ plan_id: plan._id, day_of_week, meal_type });

    // Verify recipe exists
    const recipe = await Recipe.findById(recipe_id).lean();
    if(!recipe) return res.status(404).json({ error:'Recipe not found' });

    const newItem = await MealPlanItem.create({
      plan_id: plan._id,
      day_of_week,
      meal_type,
      recipe_id
    });

    res.json({ success: true, item_id: newItem._id });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// Remove a slot item
router.delete('/item/:itemId', auth, async (req, res) => {
  try {
    const item = await MealPlanItem.findById(req.params.itemId).populate('plan_id').lean();
    if(!item || item.plan_id.user_id.toString() !== req.user.id) {
      return res.status(404).json({ error:'Item not found' });
    }
    
    await MealPlanItem.findByIdAndDelete(req.params.itemId);
    res.json({ success: true });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// Shopping list – aggregate all ingredients for the week
router.get('/shopping-list', auth, async (req, res) => {
  try {
    const week = weekMonday(req.query.week);
    const plan = await MealPlan.findOne({ user_id: req.user.id, week_start: new Date(week) }).lean();
    if(!plan) return res.json({ ingredients: [], recipes: [] });

    const items = await MealPlanItem.find({ plan_id: plan._id })
      .populate('recipe_id')
      .lean();

    const allIngredients = [];
    const uniqueRecipes = new Set();
    
    items.forEach(item => {
      if(!item.recipe_id) return;
      uniqueRecipes.add(item.recipe_id.title);
      
      const ings = item.recipe_id.ingredients || [];
      ings.forEach(ing => allIngredients.push({ ingredient: ing, recipe: item.recipe_id.title }));
    });

    res.json({ ingredients: allIngredients, recipes: Array.from(uniqueRecipes) });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

module.exports = router;
