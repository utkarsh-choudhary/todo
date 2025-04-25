import express from 'express';
import { getTodos, addTodo, deleteTodo } from '../controllers/todoController.js';
import authMiddleware from '../middleware/authMiddleWare.js';
const router = express.Router();

router.use(authMiddleware);
router.get('/', getTodos);
router.post('/', addTodo);
router.delete('/:id', deleteTodo);

export default router;
