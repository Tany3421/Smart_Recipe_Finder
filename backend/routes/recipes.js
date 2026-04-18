const router   = require('express').Router();
const Recipe   = require('../models/Recipe');
const { adminOnly } = require('../middleware/auth');
const upload   = require('../middleware/upload');
const multer   = require('multer');
const uploadMemory = multer({ storage: multer.memoryStorage() });

const recipeUpload = upload.fields([
  { name:'images', maxCount:10 },
  { name:'video',  maxCount:1  }
]);

function parseJSON(val, fallback=[]){
  if(Array.isArray(val)) return val;
  if(typeof val === 'string'){
    try { return JSON.parse(val); } catch { return val.split('\n').filter(Boolean); }
  }
  return fallback;
}

// ─── List / Search ────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { search, category, meal_type, cuisine, difficulty, featured, page=1, limit=12 } = req.query;

  let query = {};
  
  if(search){
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  if(category) query.category = category;
  if(meal_type) query.meal_type = meal_type;
  if(cuisine) query.cuisine = cuisine;
  if(difficulty) query.difficulty = difficulty;
  if(featured === 'true') query.featured = true;

  try {
    const total = await Recipe.countDocuments(query);
    const start = (parseInt(page)-1)*parseInt(limit);
    const rowsRaw = await Recipe.find(query).skip(start).limit(parseInt(limit)).lean();
    const rows = rowsRaw.map(r => { r.id = r._id; return r; });

    res.json({ recipes: rows, total, page: parseInt(page), pages: Math.ceil(total/parseInt(limit)) });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// ─── Categories / Meal Types ──────────────────────────────────
router.get('/meta', async (req, res) => {
  try {
    const cats     = await Recipe.distinct('category');
    const cuisines = await Recipe.distinct('cuisine');
    const mts      = await Recipe.distinct('meal_type');
    res.json({
      categories: cats.filter(Boolean),
      cuisines:   cuisines.filter(Boolean),
      mealTypes:  mts.filter(Boolean)
    });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// ─── Single Recipe ────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const row = await Recipe.findById(req.params.id).lean();
    if(!row) return res.status(404).json({ error:'Recipe not found' });
    row.id = row._id;
    res.json(row);
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// ─── Create ───────────────────────────────────────────────────
router.post('/', adminOnly, recipeUpload, async (req, res) => {
  try {
    const b = req.body;
    const newImages = req.files?.images?.map(f=>`/uploads/images/${f.filename}`) || [];
    const videoFile = req.files?.video?.[0];
    const urlImages = b.imageUrls ? b.imageUrls.split('\n').map(u=>u.trim()).filter(Boolean) : [];

    const recipeInfo = {
      title:       b.title,
      description: b.description||'',
      category:    b.category||'',
      meal_type:   b.meal_type||'Any',
      cuisine:     b.cuisine||'',
      prep_time:   parseInt(b.prep_time)||0,
      cook_time:   parseInt(b.cook_time)||0,
      servings:    parseInt(b.servings)||4,
      difficulty:  b.difficulty||'Medium',
      ingredients: parseJSON(b.ingredients),
      steps:       parseJSON(b.steps),
      images:      [...urlImages, ...newImages],
      video:       videoFile ? `/uploads/videos/${videoFile.filename}` : (b.video||''),
      tags:        b.tags ? b.tags.split(',').map(t=>t.trim()).filter(Boolean) : [],
      featured:    b.featured==='true',
      rating:      parseFloat(b.rating)||4.5
    };

    const created = await Recipe.create(recipeInfo);
    res.status(201).json(created);
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// ─── Update ───────────────────────────────────────────────────
router.put('/:id', adminOnly, recipeUpload, async (req, res) => {
  try {
    const existing = await Recipe.findById(req.params.id).lean();
    if(!existing) return res.status(404).json({ error:'Recipe not found' });

    const b = req.body;
    const newImages = req.files?.images?.map(f=>`/uploads/images/${f.filename}`) || [];
    const videoFile = req.files?.video?.[0];
    const urlImages = b.imageUrls ? b.imageUrls.split('\n').map(u=>u.trim()).filter(Boolean) : [];
    const keepImages = b.keepImages ? (Array.isArray(b.keepImages) ? b.keepImages : [b.keepImages]) : (existing.images||[]);

    const updates = {
      title:       b.title || existing.title,
      description: b.description || existing.description,
      category:    b.category || existing.category,
      meal_type:   b.meal_type || existing.meal_type,
      cuisine:     b.cuisine || existing.cuisine,
      prep_time:   b.prep_time ? parseInt(b.prep_time) : existing.prep_time,
      cook_time:   b.cook_time ? parseInt(b.cook_time) : existing.cook_time,
      servings:    b.servings ? parseInt(b.servings) : existing.servings,
      difficulty:  b.difficulty || existing.difficulty,
      ingredients: b.ingredients ? parseJSON(b.ingredients) : existing.ingredients,
      steps:       b.steps ? parseJSON(b.steps) : existing.steps,
      images:      [...keepImages, ...urlImages, ...newImages],
      video:       videoFile ? `/uploads/videos/${videoFile.filename}` : (b.video || existing.video),
      tags:        b.tags ? b.tags.split(',').map(t=>t.trim()).filter(Boolean) : existing.tags,
      featured:    b.featured !== undefined ? b.featured === 'true' : existing.featured,
      rating:      b.rating ? parseFloat(b.rating) : existing.rating
    };

    const updated = await Recipe.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    if (updated) updated.id = updated._id;
    res.json(updated);
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// ─── Delete ───────────────────────────────────────────────────
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const deleted = await Recipe.findByIdAndDelete(req.params.id);
    if(!deleted) return res.status(404).json({ error:'Recipe not found' });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─── Voice Search ─────────────────────────────────────────────
router.post('/voice-search', uploadMemory.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file provided' });
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not configured');

    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-large-v3-turbo');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: formData
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq API Error:', errText);
      throw new Error('Transcription failed');
    }

    const data = await groqRes.json();
    res.json({ text: data.text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
