const express = require('express');
const router = express.Router();
const User = require('../models/User')

// Register New User
router.post('/add', async (req, res, next) => {
  try {
    const user = new User(req.body)
    const createdUser = await user.save()
    if (!createdUser) {
      return res.status(500).json({message: 'Failed to create User'})
    }
    res.status(201).json(createdUser)
  } catch (error) {
    console.log(error.message)
    res.status(400).json({error})
  }
});

// Get Specific User
router.get('/user/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    console.log(id)
    const user = await User.findById(id, 'email password')
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
