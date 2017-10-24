const express = require('express');
const bodyParser = require('body-parser');
const faker = require('faker');

const app = express();
app.listen(3000, function() {
  console.log('listening on port 3000!');
});


//generate and save fake order
