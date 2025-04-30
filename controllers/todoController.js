import { Todo } from "../models/Todo.js";
import { User } from "../models/User.js";

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
    const { text, completed, assignedToId } = req.body;

    const todo = await Todo.findById(id);
    
    if (!todo) {
      return res.status(404).json({ 
        message: 'Todo not found', 
        success: false 
      });
    }

    // Check permissions
    const isAdmin = req.user.role === 'admin';
    const isOwner = todo.user && (
      (typeof todo.user === 'object' && todo.user._id.toString() === req.user._id.toString()) ||
      (typeof todo.user === 'string' && todo.user.toString() === req.user._id.toString())
    );
    const isAssignee = todo.assignedTo && (
      (typeof todo.assignedTo === 'object' && todo.assignedTo._id.toString() === req.user._id.toString()) ||
      (typeof todo.assignedTo === 'string' && todo.assignedTo.toString() === req.user._id.toString())
    );

    if (!isAdmin && !isOwner && !isAssignee) {
      return res.status(403).json({ 
        message: 'Not authorized to update this todo', 
        success: false 
      });
    }

    // Only admins can reassign tasks
    if (assignedToId && !isAdmin) {
      return res.status(403).json({ 
        message: 'Only admins can reassign tasks', 
        success: false 
      });
    }

    // If assignedToId is provided, verify the user exists
    if (assignedToId) {
      const assignedUser = await User.findById(assignedToId);
      if (!assignedUser) {
        return res.status(404).json({ 
          message: 'Assigned user not found', 
          success: false 
        });
      }
    }

    const updateData = {};
    if (text !== undefined) updateData.text = text;
    if (completed !== undefined) updateData.completed = completed;
    if (assignedToId) {
      updateData.assignedTo = assignedToId;
      updateData.assignedBy = req.user._id;
      updateData.assignedAt = Date.now();
    }

    const updatedTodo = await Todo.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('user', 'email name')
     .populate('assignedTo', 'email name')
     .populate('assignedBy', 'email name');

    if (!updatedTodo) {
      return res.status(404).json({ 
        message: 'Todo not found after update', 
        success: false 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: updatedTodo,
      message: 'Todo updated successfully'
    });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ 
      message: 'Error updating todo', 
      success: false,
      error: error.message 
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude password field
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

export { getTodos, addTodo, deleteTodo, updateTodo, getUsers };
