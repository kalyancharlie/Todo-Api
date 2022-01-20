var express = require('express');
var router = express.Router();

// Get all Todos
router.get('/', function(req, res, next) {
  res.send('All Todos - GET');
});

// Create Todo
router.post('/add', function(req, res, next) {
  res.send('Create Todo - POST');
});

// Update Todo
router.post('/update/:id', function(req, res, next) {
  res.send('Update Todo - POST');
});

// Delete Todo
router.delete('/:id', function(req, res, next) {
  res.send('Delete Todos - DELETE');
});

module.exports = router;
