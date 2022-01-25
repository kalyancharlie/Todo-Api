const mongoose = require("mongoose")
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const {Todo} = require('../models/Todo')
const {validateIdByBody} = require('../middlewares/validators')
const {authGuard} = require("../middlewares/auth")

// Auth Guard
router.use(authGuard)

// Id Validator
router.use(validateIdByBody)

// Get all Todos
router.get("/", async (req, res, next) => {
  console.log("REQ.USER", req.user)
  console.log('COOKIES', req.cookies)
  try {
    const { user_id } = req.user;
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
    const { user_id } = req.user
    const newTodo = new Todo(todo)
    await newTodo.save()
    await User.findByIdAndUpdate({_id: user_id}, {$push: {todos: newTodo._id}})
    res.status(201).json(newTodo);
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
    res.status(201).json(newTodo);
  } catch (error) {
    console.log(error.message);
    res.status(400).json(error);
  }
});

// Delete Todo
router.delete("/delete", async (req, res, next) => {
  try {
    const { _id } = req.body
    const { user_id } = req.user
    await Todo.findByIdAndDelete(_id)
    await User.updateOne({ _id: user_id}, { $pullAll: { todos: [_id] } })
    res.status(200).json({});
  } catch (error) {
    console.log(error.message);
    res.status(400).json(error);
  }
});

module.exports = router;
