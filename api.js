'use strict';
var hotspots = require('./hotspots');

module.exports = function(app) {
    app.get('/', function(req, res) {
        res.render('index', {});
    });

    app.post('/', function(req, res) {
        var name = req.body.name;

        hotspots.analyze(name).then(function(lines) {
            console.log(lines);
            res.render('index', {
                repo: {
                    name: name,
                    lines: lines
                }
            });
        });
    });
};
