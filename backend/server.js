require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { JWT_SECRET, MONGO_URI, PORT = 3000 } = process.env;

if (!JWT_SECRET) { 
  console.error('JWT_SECRET is required.'); 
  process.exit(1); 
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist', 'bahaykubo', 'browser')));

let connecting;
app.use(async (req, res, next) => {
  try {
    connecting = connecting || mongoose.connect(MONGO_URI);
    await connecting;
    next();
  } catch (e) {
    connecting = null;
    res.status(500).json({ error: 'Database unavailable' });
  }
});

const Admin = mongoose.model('Admin', new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true }));

const Product = mongoose.model('Product', new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
  imageUrl: { type: String, trim: true, default: '' }
}, { timestamps: true }));

const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error(e);
  if (e.code === 11000) return res.status(409).json({ error: 'That email is already registered.' });
  const bad = ['ValidationError', 'CastError'].includes(e.name);
  res.status(bad ? 400 : 500).json({ error: bad ? e.message : 'Server error' });
});

const sign = (a) => jwt.sign({ id: a._id, email: a.email }, JWT_SECRET, { expiresIn: '7d' });

function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  try { req.admin = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Please sign in to continue.' }); }
}

// --- Auth ---
app.post('/api/auth/register', wrap(async (req, res) => {
  const { email, password} = req.body;

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  
  const admin = await Admin.create({ email, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(admin), email: admin.email });
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const admin = await Admin.findOne({ email: String(req.body.email || '').toLowerCase().trim() });
  if (!admin || !(await bcrypt.compare(req.body.password || '', admin.passwordHash)))
    return res.status(401).json({ error: 'Incorrect email or password.' });
  res.json({ token: sign(admin), email: admin.email });
}));

app.get('/api/products', wrap(async (req, res) => {
  const filter = req.query.category ? { category: req.query.category } : {};
  res.json(await Product.find(filter).sort({ createdAt: -1 }));
}));

app.get('/api/categories', wrap(async (req, res) => res.json((await Product.distinct('category')).sort())));

app.post('/api/products', requireAdmin, wrap(async (req, res) => res.status(201).json(await Product.create(req.body))));

app.put('/api/products/:id', requireAdmin, wrap(async (req, res) => {
  const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  p ? res.json(p) : res.status(404).json({ error: 'Product not found.' });
}));

app.delete('/api/products/:id', requireAdmin, wrap(async (req, res) => {
  const p = await Product.findByIdAndDelete(req.params.id);
  p ? res.json({ ok: true }) : res.status(404).json({ error: 'Product not found.' });
}));

if (require.main === module) {
  app.listen(PORT, () => console.log(`Bahay Kubo running at http://localhost:${PORT}`));
}
module.exports = app;
