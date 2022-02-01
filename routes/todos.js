const express = require("express");
const router = express.Router();
const User = require("../models/User");
const {Todo} = require('../models/Todo')
const {mongooseIdValidator} = require('../middlewares/validators')
const {authGuard} = require("../middlewares/auth")

// Auth Guard
router.use(authGuard)

// Get all Todos
router.get("/all", async (req, res, next) => {
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
    todo.user_id = user_id
    const newTodo = new Todo(todo)
    await newTodo.save()
    await User.findByIdAndUpdate({_id: user_id}, {$push: {todos: newTodo._id}})
    res.status(201).json({status: true, id: newTodo._id});
  } catch (error) {
    console.log(error.message)
    res.status(400).json({status: false, ...error});
  }
});

// Update Todo
router.patch("/update", async (req, res, next) => {
  try {
    const {...todo } = req.body;
    console.log('TODO UPDATE')
    console.log(todo)
    const newTodo = new Todo(todo)
    await Todo.findByIdAndUpdate({_id: todo._id}, {isCompleted: todo.isCompleted})
    res.status(201).json({...newTodo, status: true});
  } catch (error) {
    console.log(error.message);
    res.status(400).json({...error, status: false});
  }
});

// Delete Todo
router.delete("/delete", async (req, res, next) => {
  try {
    const { _id } = req.body
    console.log('TODO ID', req.body)
    console.log(_id)
    const { user_id } = req.user
    if(!mongooseIdValidator(_id)) {
      return res.status(400).json({message: 'Invalid Id'})
    }
    console.log(_id)
    console.log(user_id)
    await Todo.findByIdAndDelete(_id)
    await User.updateOne({ _id: user_id}, { $pullAll: { todos: [_id] } })
    res.status(201).json({status: true});
  } catch (error) {
    console.log(error.message);
    res.status(400).json({...error, status: false});
  }
});

module.exports = router;
