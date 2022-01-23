const express = require("express");
const router = express.Router();
const User = require("../models/User");
const {Todo} = require('../models/Todo')

// Get all Todos
router.get("/", async (req, res, next) => {
  try {
    const { user_id } = req.body;
    const todos = await User.findById({ _id: user_id }, "todos").populate('todos')
    res.status(200).json(todos);
  } catch (error) {
    console.log(error.message);
    res.status(400).json(error);
  }
});

// Create Todo
router.post("/add", async (req, res, next) => {
  try {
    const {...todo } = req.body;
    const newTodo = new Todo(todo)
    await newTodo.save()
    await User.findByIdAndUpdate({_id: todo.user_id}, {$push: {todos: newTodo._id}})
    res.status(200).json(newTodo);
  } catch (error) {
    console.log(error.message);
    res.status(400).json(error);
  }
});

// Update Todo
router.put("/update", async (req, res, next) => {
  try {
    const {...todo } = req.body;
    const newTodo = new Todo(todo)
    await Todo.findByIdAndUpdate({_id: todo._id}, {isCompleted: todo.isCompleted})
    res.status(200).json(newTodo);
  } catch (error) {
    console.log(error.message);
    res.status(400).json(error);
  }
});

// Delete Todo
router.delete("/delete", async (req, res, next) => {
  try {
    const {user_id, _id } = req.body
    await Todo.findByIdAndDelete(_id)
    await User.updateOne({ _id: user_id}, { $pullAll: { todos: [_id] } })
    res.status(200).json({});
  } catch (error) {
    console.log(error.message);
    res.status(400).json(error);
  }
});

module.exports = router;
