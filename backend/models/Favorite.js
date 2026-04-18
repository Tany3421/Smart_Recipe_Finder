const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const FavoriteSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  user_id: { type: String, ref: 'User', required: true },
  recipe_id: { type: String, ref: 'Recipe', required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

FavoriteSchema.index({ user_id: 1, recipe_id: 1 }, { unique: true });
FavoriteSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; } });

module.exports = mongoose.model('Favorite', FavoriteSchema);
