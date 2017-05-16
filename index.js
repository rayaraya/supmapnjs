var express = require('express');
//var client = require('./public/client.js');

var path = require('path');
var app = express();


app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  //res.sendFile('/index.html');
  res.sendFile('/index.html', { root: __dirname + '/public' });
});

app.get('/about', function (req, res) {
  //res.sendFile('/about.html');
  res.sendFile('/about.html', { root: __dirname + '/public' });
});

var port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log("Listening on " + port);
});