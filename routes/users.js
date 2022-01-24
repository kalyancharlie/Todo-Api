const express = require('express');
const router = express.Router();
const User = require('../models/User')
const mongoose = require("mongoose")
const {validateIdByParams} = require('../middlewares/validators')

// Register New User
router.post('/add', async (req, res, next) => {
  try {
    const user = new User(req.body)
    // Check if user already exists
    const existingUser = await User.findOne({email: user.email})
    if (existingUser) {
      return res.status(400).json({message: "Email Id already registered"})
    }
    const createdUser = await user.save()
    if (!createdUser) {
      return res.status(500).json({message: 'Internal Server Error'})
    }
    res.status(201).json(createdUser)
  } catch (error) {
    console.log(error.message)
    res.status(400).json({error})
  }
});

// Get Specific User
router.get('/user/:user_id', [validateIdByParams], async (req, res,) => {
  try {
    const user_id = req.params.user_id
    console.log(user_id)
    const user = await User.findById(user_id, 'email password')
    if (!user) {
      return res.status(404).json({message: 'User not found'})
    }
    res.status(200).json(user)
  } catch (error) {
    console.log(error.message)
    res.status(400).json({error})
  }
});

module.exports = router;
