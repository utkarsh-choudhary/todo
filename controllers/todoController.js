import { Todo } from "../models/Todo.js";

const getTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.user._id });
    res.status(200).json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ message: 'Error fetching todos', success: false });
  }
};

const addTodo = async (req, res) => {
  try {
    const todo = await Todo.create({ 
      ...req.body,
      user: req.user._id 
    });
    res.status(201).json(todo);
  } catch (error) {
    console.error('Error adding todo:', error);
    res.status(500).json({ message: 'Error adding todo', success: false });
  }
};

const deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ 
      _id: req.params.id,
      user: req.user._id 
    });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found', success: false });
    }
    res.status(200).json({ message: 'Todo deleted', success: true });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ message: 'Error deleting todo', success: false });
  }
};

const updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    const todo = await Todo.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { completed },
      { new: true }
    );

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found', success: false });
    }

    res.status(200).json({ message: 'Todo updated', success: true, data: todo });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ message: 'Error updating todo', success: false });
  }
};

export { getTodos, addTodo, deleteTodo, updateTodo };
