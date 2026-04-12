const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const TransactionController = require('../controllers/transaction.controller');

router.use(authMiddleware);

router.get('/', TransactionController.getTransactions);
router.post('/', TransactionController.createTransaction);
router.put('/:id', TransactionController.updateTransaction);
router.delete('/:id', TransactionController.deleteTransaction);
router.get('/stats', TransactionController.getStats);

module.exports = router;