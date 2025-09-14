const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

// In-memory user store: { email: { email, name, passwordHash } }
const emailToUser = new Map();

function renderBase(res, view, props) {
  return res.render(view, { ...props });
}

function showLogin(req, res) {
  if (req.user) return res.redirect('/dashboard');
  renderBase(res, 'auth/login', { title: 'Login' });
}

function showSignup(req, res) {
  if (req.user) return res.redirect('/dashboard');
  renderBase(res, 'auth/signup', { title: 'Sign Up' });
}

async function signup(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).render('auth/signup', { title: 'Sign Up', error: 'All fields are required.' });
  }
  const existing = emailToUser.get(email.toLowerCase());
  if (existing) {
    return res.status(400).render('auth/signup', { title: 'Sign Up', error: 'Email already registered.' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { name, email: email.toLowerCase(), passwordHash };
  emailToUser.set(user.email, user);
  const token = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '2h' });
  res.cookie('token', token, { httpOnly: true });
  return res.redirect('/dashboard');
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).render('auth/login', { title: 'Login', error: 'Email and password are required.' });
  }
  const user = emailToUser.get(email.toLowerCase());
  if (!user) {
    return res.status(400).render('auth/login', { title: 'Login', error: 'Invalid credentials.' });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(400).render('auth/login', { title: 'Login', error: 'Invalid credentials.' });
  }
  const token = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '2h' });
  res.cookie('token', token, { httpOnly: true });
  return res.redirect('/dashboard');
}

function logout(req, res) {
  res.clearCookie('token');
  return res.redirect('/login');
}

function showDashboard(req, res) {
  return res.render('dashboard', { title: 'Dashboard', user: req.user });
}

module.exports = { showLogin, showSignup, signup, login, logout, showDashboard };

