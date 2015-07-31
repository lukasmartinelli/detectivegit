/*eslint new-cap:0 */
'use strict';
var path = require('path');
var express = require('express');
var handlebars = require('express-handlebars');
var app = express();
var bodyParser = require('body-parser');
var http = require('http').Server(app);

var options = {
    port: process.env.VCAP_APP_PORT || 3000
};

app.engine('hbs', handlebars({extname: 'hbs', defaultLayout: 'main.hbs'}));
app.set('view engine', 'hbs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '/public')));

require('./api')(app);

http.listen(options.port);
