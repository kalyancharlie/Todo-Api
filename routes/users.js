const express = require('express');
const router = express.Router();
const User = require('../models/User')
const {validateIdByParams} = require('../middlewares/validators')
const {authenticateUser, invalidateUserToken, genAccessTokenFromRefreshToken, authGuard} = require("../middlewares/auth")

// Remove Later
const bcrypt = require('bcryptjs')

// Login User
router.post('/login', authenticateUser)

// Get Access Token from Refresh Token
router.post("/refresh-token", genAccessTokenFromRefreshToken)

// Logout User
router.delete('/logout', [authGuard], invalidateUserToken)

// Register New User
router.post('/register', [authGuard], async (req, res) => {
  try {
    const user = new User(req.body)
    const newPasssword = await bcrypt.hash(user.password, 10)
    user.password = newPasssword
    // Check if user already exists
    const existingUser = await User.findOne({email: user.email})
    if (existingUser) {
      return res.status(400).json({message: "Email Id is already registered"})
    }
    const createdUser = await user.save()
    if (!createdUser) {
      return res.status(500).json({message: 'Internal Server Error'})
    }
    res.status(201).json({user_id: createdUser._id,  name: createdUser.name, status: true, message: 'User Created',  })
  } catch (error) {
    console.log(error.message)
    res.status(400).json({error})
  }
});

// Get Specific User
router.get('/user/:user_id', [authGuard, validateIdByParams], async (req, res) => {
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
