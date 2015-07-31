'use strict';
var hotspots = require('./hotspots');

module.exports = function(app) {
    app.get('/', function(req, res) {
        res.render('index', {});
    });

    app.post('/', function(req, res) {
        var name = req.body.name;

        hotspots.analyze(name).then(function(fileReports) {
            res.render('index', {
                repo: {
                    name: name,
                    fileReports: fileReports
                }
            });
        });
    });
};
