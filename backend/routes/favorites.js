const router = require('express').Router();
const Favorite = require('../models/Favorite');
const { auth } = require('../middleware/auth');

// Get all favorites (full recipe objects)
router.get('/', auth, async (req, res) => {
  try {
    const favs = await Favorite.find({ user_id: req.user.id })
      .populate('recipe_id')
      .sort('-created_at')
      .lean();
    
    // Return just the recipe array to match frontend expectation
    res.json(favs.map(f => {
      if(!f.recipe_id) return null;
      f.recipe_id.id = f.recipe_id._id;
      return f.recipe_id;
    }).filter(Boolean));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Get just IDs
router.get('/ids', auth, async (req, res) => {
  try {
    const favs = await Favorite.find({ user_id: req.user.id }, 'recipe_id').lean();
    res.json(favs.map(r => r.recipe_id));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Add
router.post('/:recipeId', auth, async (req, res) => {
  try {
    await Favorite.create({ user_id: req.user.id, recipe_id: req.params.recipeId });
    res.json({ success: true });
  } catch(e){
    if(e.code === 11000) return res.status(409).json({ error:'Already in favorites' });
    res.status(500).json({ error: e.message });
  }
});

// Remove
router.delete('/:recipeId', auth, async (req, res) => {
  try {
    await Favorite.findOneAndDelete({ user_id: req.user.id, recipe_id: req.params.recipeId });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
