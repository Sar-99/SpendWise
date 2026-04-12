const express = require('express');
const router = express.Router();
const authMiddleware = require('../utils/auth.middleware');
const ActiveTaskController = require('../controllers/active-task.controller');

router.use(authMiddleware);

router.get('/', ActiveTaskController.getTasks);
router.post('/', ActiveTaskController.createTask);
router.get('/:id', ActiveTaskController.getTaskById);
router.put('/:id', ActiveTaskController.updateDescription);
router.delete('/:id', ActiveTaskController.deleteTask);

module.exports = router;