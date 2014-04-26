var path = require('path');

var express = require('express');
var compression = require('compression');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(compression());
app.use(express.static('public'));

app.get('/', function(req, res) {
  res.render('index');
});

var server = app.listen(3000, function() {
  console.log('Express server listening on port ' + server.address().port);
});
