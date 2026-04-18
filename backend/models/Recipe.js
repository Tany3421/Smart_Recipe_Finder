const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const RecipeSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  meal_type: { type: String, enum: ['Breakfast','Brunch','Lunch','Dinner','Snack','Dessert','Any'], default: 'Any' },
  cuisine: { type: String },
  prep_time: { type: Number, default: 0 },
  cook_time: { type: Number, default: 0 },
  servings: { type: Number, default: 4 },
  difficulty: { type: String, enum: ['Easy','Medium','Hard'], default: 'Medium' },
  ingredients: { type: [String], default: [] },
  steps: { type: [String], default: [] },
  images: { type: [String], default: [] },
  video: { type: String, default: '' },
  tags: { type: [String], default: [] },
  featured: { type: Boolean, default: false },
  rating: { type: Number, default: 4.50 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

RecipeSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; } });

module.exports = mongoose.model('Recipe', RecipeSchema);
