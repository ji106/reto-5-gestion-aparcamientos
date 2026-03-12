import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { title: 'ParkTrack' });
});

router.get('/login', (req, res) => {
  res.render('login', { title: 'Iniciar Sesión', error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === '1234') {
    req.session.user = { username: 'admin' };
    res.redirect('/');
  } else {
    res.render('login', { title: 'Iniciar Sesión', error: 'Usuario o contraseña incorrectos' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

router.get('/history', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const entries = db.prepare('SELECT * FROM history ORDER BY id DESC').all();
  res.render('history', { title: 'Historial', entries });
});

router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contacto' });
});

router.post('/api/parking', (req, res) => {
  const { lat, lng, address, start_time, end_time, duration } = req.body;
  db.prepare('INSERT INTO history (lat, lng, address, start_time, end_time, duration) VALUES (?, ?, ?, ?, ?, ?)').run(lat, lng, address, start_time, end_time, duration);
  res.json({ ok: true });
});

export default router;