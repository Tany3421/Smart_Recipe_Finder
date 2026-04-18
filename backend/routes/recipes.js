const router   = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const pool     = require('../config/db');
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
  const { search, category, meal_type, cuisine, difficulty, featured,
          page=1, limit=12 } = req.query;

  let sql  = 'SELECT id,title,description,category,meal_type,cuisine,prep_time,cook_time,servings,difficulty,images,tags,featured,rating,created_at FROM recipes WHERE 1=1';
  const params = [];

  if(search){
    sql += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if(category){ sql += ' AND category=?'; params.push(category); }
  if(meal_type){ sql += ' AND meal_type=?'; params.push(meal_type); }
  if(cuisine)  { sql += ' AND cuisine=?';  params.push(cuisine);  }
  if(difficulty){ sql += ' AND difficulty=?'; params.push(difficulty); }
  if(featured === 'true'){ sql += ' AND featured=1'; }

  const [allRows] = await pool.execute(sql, params);
  const total = allRows.length;
  const start = (parseInt(page)-1)*parseInt(limit);
  const rows  = allRows.slice(start, start+parseInt(limit));

  res.json({ recipes: rows, total, page: parseInt(page), pages: Math.ceil(total/parseInt(limit)) });
});

// ─── Categories / Meal Types ──────────────────────────────────
router.get('/meta', async (req, res) => {
  const [cats]     = await pool.execute('SELECT DISTINCT category FROM recipes ORDER BY category');
  const [cuisines] = await pool.execute('SELECT DISTINCT cuisine FROM recipes ORDER BY cuisine');
  const [mts]      = await pool.execute('SELECT DISTINCT meal_type FROM recipes ORDER BY meal_type');
  res.json({
    categories: cats.map(r=>r.category).filter(Boolean),
    cuisines:   cuisines.map(r=>r.cuisine).filter(Boolean),
    mealTypes:  mts.map(r=>r.meal_type).filter(Boolean)
  });
});

// ─── Single Recipe ────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const [[row]] = await pool.execute('SELECT * FROM recipes WHERE id=?', [req.params.id]);
  if(!row) return res.status(404).json({ error:'Recipe not found' });
  res.json(row);
});

// ─── Create ───────────────────────────────────────────────────
router.post('/', adminOnly, recipeUpload, async (req, res) => {
  try {
    const b = req.body;
    const newImages = req.files?.images?.map(f=>`/uploads/images/${f.filename}`) || [];
    const videoFile = req.files?.video?.[0];
    const urlImages = b.imageUrls ? b.imageUrls.split('\n').map(u=>u.trim()).filter(Boolean) : [];

    const recipe = {
      id: uuidv4(),
      title:       b.title,
      description: b.description||'',
      category:    b.category||'',
      meal_type:   b.meal_type||'Any',
      cuisine:     b.cuisine||'',
      prep_time:   parseInt(b.prep_time)||0,
      cook_time:   parseInt(b.cook_time)||0,
      servings:    parseInt(b.servings)||4,
      difficulty:  b.difficulty||'Medium',
      ingredients: JSON.stringify(parseJSON(b.ingredients)),
      steps:       JSON.stringify(parseJSON(b.steps)),
      images:      JSON.stringify([...urlImages, ...newImages]),
      video:       videoFile ? `/uploads/videos/${videoFile.filename}` : (b.video||''),
      tags:        JSON.stringify(b.tags ? b.tags.split(',').map(t=>t.trim()).filter(Boolean) : []),
      featured:    b.featured==='true' ? 1 : 0,
      rating:      parseFloat(b.rating)||4.5
    };

    await pool.execute(
      `INSERT INTO recipes (id,title,description,category,meal_type,cuisine,prep_time,cook_time,
       servings,difficulty,ingredients,steps,images,video,tags,featured,rating)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      Object.values(recipe)
    );
    const [[created]] = await pool.execute('SELECT * FROM recipes WHERE id=?', [recipe.id]);
    res.status(201).json(created);
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// ─── Update ───────────────────────────────────────────────────
router.put('/:id', adminOnly, recipeUpload, async (req, res) => {
  try {
    const [[existing]] = await pool.execute('SELECT * FROM recipes WHERE id=?', [req.params.id]);
    if(!existing) return res.status(404).json({ error:'Recipe not found' });

    const b = req.body;
    const newImages = req.files?.images?.map(f=>`/uploads/images/${f.filename}`) || [];
    const videoFile = req.files?.video?.[0];
    const urlImages = b.imageUrls ? b.imageUrls.split('\n').map(u=>u.trim()).filter(Boolean) : [];
    const keepImages = b.keepImages ? (Array.isArray(b.keepImages) ? b.keepImages : [b.keepImages]) : JSON.parse(existing.images||'[]');

    await pool.execute(
      `UPDATE recipes SET title=?,description=?,category=?,meal_type=?,cuisine=?,
       prep_time=?,cook_time=?,servings=?,difficulty=?,ingredients=?,steps=?,
       images=?,video=?,tags=?,featured=?,rating=? WHERE id=?`,
      [
        b.title||existing.title, b.description||existing.description,
        b.category||existing.category, b.meal_type||existing.meal_type,
        b.cuisine||existing.cuisine,
        parseInt(b.prep_time)||existing.prep_time, parseInt(b.cook_time)||existing.cook_time,
        parseInt(b.servings)||existing.servings,   b.difficulty||existing.difficulty,
        JSON.stringify(parseJSON(b.ingredients||JSON.stringify(JSON.parse(existing.ingredients||'[]')))),
        JSON.stringify(parseJSON(b.steps||JSON.stringify(JSON.parse(existing.steps||'[]')))),
        JSON.stringify([...keepImages, ...urlImages, ...newImages]),
        videoFile ? `/uploads/videos/${videoFile.filename}` : (b.video||existing.video),
        b.tags ? JSON.stringify(b.tags.split(',').map(t=>t.trim())) : existing.tags,
        b.featured!==undefined ? (b.featured==='true'?1:0) : existing.featured,
        parseFloat(b.rating)||existing.rating,
        req.params.id
      ]
    );
    const [[updated]] = await pool.execute('SELECT * FROM recipes WHERE id=?', [req.params.id]);
    res.json(updated);
  } catch(e){ res.status(500).json({ error: e.message }); }
});

// ─── Delete ───────────────────────────────────────────────────
router.delete('/:id', adminOnly, async (req, res) => {
  const [[row]] = await pool.execute('SELECT id FROM recipes WHERE id=?', [req.params.id]);
  if(!row) return res.status(404).json({ error:'Recipe not found' });
  await pool.execute('DELETE FROM recipes WHERE id=?', [req.params.id]);
  res.json({ success: true });
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
