var express = require('express');
var router = express.Router();

// Register New User
router.post('/add', function(req, res, next) {
  res.send("Add User - POST");
});

// Get Specific User
router.post('/user', function(req, res, next) {
  res.send("Get User - POST");
});

module.exports = router;
