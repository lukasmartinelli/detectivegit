/*eslint new-cap:0 */
'use strict';
var path = require('path');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var http = require('http').Server(app);

var options = {
    port: process.env.VCAP_APP_PORT || 3000,
};

app.use(bodyParser.json());
require('./api')(app);
app.use(express.static(path.join(__dirname, '/public')));

http.listen(options.port);
