const express = require('express');
const { showLogin, showSignup, signup, login, logout, showDashboard } = require('../controllers/authController');
const { requireAuth, attachUserIfAny } = require('../middleware/auth');

const router = express.Router();

router.get('/login', attachUserIfAny, showLogin);
router.get('/signup', attachUserIfAny, showSignup);
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

router.get('/dashboard', requireAuth, showDashboard);

module.exports = router;

