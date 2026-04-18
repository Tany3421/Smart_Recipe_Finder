const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const MealPlanSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  user_id: { type: String, ref: 'User', required: true },
  week_start: { type: Date, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

MealPlanSchema.index({ user_id: 1, week_start: 1 }, { unique: true });
MealPlanSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; } });

module.exports = mongoose.model('MealPlan', MealPlanSchema);
