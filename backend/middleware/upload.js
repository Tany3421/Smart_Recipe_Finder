const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination(req, file, cb){
    const dir = file.mimetype.startsWith('video/')
      ? path.join(__dirname,'../uploads/videos')
      : path.join(__dirname,'../uploads/images');
    fs.mkdirSync(dir, { recursive:true });
    cb(null, dir);
  },
  filename(req, file, cb){
    cb(null, uuidv4() + path.extname(file.originalname).toLowerCase());
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 },
  fileFilter(req, file, cb){
    cb(null, /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|webm)$/i.test(file.originalname));
  }
});

module.exports = upload;
