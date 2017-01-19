const express = require('express');

const app = express();

app.use(express.static('public'));

app.get('/', function (req, res) {
  res.set('Content-Type', 'text/html');
  res.sendFile('public/index.html');
});

module.exports = app;
