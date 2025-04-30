import express from 'express';
import { getTodos, addTodo, deleteTodo, updateTodo, getUsers } from '../controllers/todoController.js';
import authMiddleware from '../middleware/authMiddleWare.js';
const router = express.Router();

router.use(authMiddleware);

// Todo routes
router.get('/', getTodos);
router.post('/', addTodo);
router.delete('/:id', deleteTodo);
router.patch('/:id', updateTodo);

// User management routes (admin only)
router.get('/users', getUsers);

export default router;
