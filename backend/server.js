require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit:'50mb' }));
app.use(express.urlencoded({ extended:true, limit:'50mb' }));

// ─── Static Files ─────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/recipes',      require('./routes/recipes'));
app.use('/api/favorites',    require('./routes/favorites'));
app.use('/api/meal-planner', require('./routes/mealplanner'));
app.use('/api/admin',        require('./routes/admin'));
app.use('/api/feedbacks',    require('./routes/feedbacks'));

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status:'ok', time: new Date() }));

// ─── SPA Fallback ─────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🍳 Smart Recipe Finder  →  http://localhost:${PORT}`);
  console.log(`   Admin:  admin    / admin123`);
  console.log(`   User:   foodlover/ food123\n`);
});
