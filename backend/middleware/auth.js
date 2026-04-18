const jwt = require('jsonwebtoken');

function auth(req, res, next){
  const token = req.headers.authorization?.split(' ')[1];
  if(!token) return res.status(401).json({ error:'Authentication required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'recipe-secret');
    next();
  } catch {
    res.status(401).json({ error:'Invalid or expired token' });
  }
}

function adminOnly(req, res, next){
  auth(req, res, () => {
    if(req.user.role !== 'admin')
      return res.status(403).json({ error:'Admin access required' });
    next();
  });
}

module.exports = { auth, adminOnly };
