import express from 'express';
import { getTodos, addTodo, deleteTodo, updateTodo } from '../controllers/todoController.js';
import authMiddleware from '../middleware/authMiddleWare.js';
const router = express.Router();

router.use(authMiddleware);
router.get('/', getTodos);
router.post('/', addTodo);
router.delete('/:id', deleteTodo);
router.patch('/:id', updateTodo);

export default router;
