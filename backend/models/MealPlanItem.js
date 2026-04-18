const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const MealPlanItemSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  plan_id: { type: String, ref: 'MealPlan', required: true },
  day_of_week: { type: Number, required: true },
  meal_type: { type: String, enum: ['Breakfast','Brunch','Lunch','Dinner','Snack','Dessert'], required: true },
  recipe_id: { type: String, ref: 'Recipe', required: true },
});

MealPlanItemSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; } });

module.exports = mongoose.model('MealPlanItem', MealPlanItemSchema);
