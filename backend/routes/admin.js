const router = require('express').Router();
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const Favorite = require('../models/Favorite');
const MealPlan = require('../models/MealPlan');
const { adminOnly } = require('../middleware/auth');

// Dashboard stats
router.get('/stats', adminOnly, async (req, res) => {
  try {
    const total = await Recipe.countDocuments();
    const users = await User.countDocuments({ role: 'user' });
    const favs = await Favorite.countDocuments();
    const catsList = await Recipe.distinct('category');
    const plans = await MealPlan.countDocuments();
    const recent = await Recipe.find()
      .sort('-created_at')
      .limit(5)
      .select('title category meal_type images difficulty created_at')
      .lean();

    res.json({
      totalRecipes: total,
      totalUsers: users,
      totalFavorites: favs,
      categories: catsList.filter(Boolean).length,
      totalPlans: plans,
      recentRecipes: recent.map(r => { r.id = r._id; return r; })
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// All users
router.get('/users', adminOnly, async (req, res) => {
  try {
    const usersList = await User.find().sort('-created_at').lean();
    
    // Count favorites for each
    const result = await Promise.all(usersList.map(async u => {
      const favCount = await Favorite.countDocuments({ user_id: u._id });
      return {
        id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        created_at: u.created_at,
        favorites_count: favCount
      };
    }));
    
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete user
router.delete('/users/:id', adminOnly, async (req, res) => {
  try {
    if(req.params.id === req.user.id)
      return res.status(400).json({ error: 'Cannot delete your own account' });
    
    const user = await User.findByIdAndDelete(req.params.id);
    if(!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
