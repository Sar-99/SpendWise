const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const authenticateToken = require('../middleware/auth.middleware');

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/verify', AuthController.verify);
router.post('/verify-password', authenticateToken, AuthController.verifyPassword);

module.exports = router;