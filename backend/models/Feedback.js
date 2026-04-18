const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const FeedbackSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  user_id: { type: String, ref: 'User', required: true },
  recipe_id: { type: String, ref: 'Recipe', default: null },
  type: { type: String, enum: ['feedback', 'suggestion'], default: 'feedback' },
  message: { type: String, required: true },
  status: { type: String, enum: ['pending', 'read'], default: 'pending' },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

FeedbackSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; } });

module.exports = mongoose.model('Feedback', FeedbackSchema);
