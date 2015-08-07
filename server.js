/*eslint new-cap:0 */
'use strict';
var path = require('path');
var express = require('express');
var handlebars = require('express-handlebars');
var app = express();
var bodyParser = require('body-parser');
var http = require('http').Server(app);

var CachemanRedis = require('cacheman-redis');
var Cacheman = require('cacheman');

var options = {
    port: process.env.VCAP_APP_PORT || 3000,
    redis: {
        port: process.env.REDIS_PORT || 6379,
        host: process.env.REDIS_HOST
    }
};

var cache = new Cacheman();
if(options.redis.host) {
    console.log('Using redis cache');
    cache = new CachemanRedis(options.redis);
} else {
    console.log('Using memory cache');
}

app.engine('hbs', handlebars({extname: 'hbs', defaultLayout: 'main.hbs'}));
app.set('view engine', 'hbs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '/public')));

require('./api')(app, cache);


http.listen(options.port);
