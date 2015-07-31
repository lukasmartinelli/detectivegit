'use strict';
var analyze = require('./analyzer');

module.exports = function(app) {
    app.get('/', function(req, res) {
        res.render('index', {});
    });

    app.post('/', function(req, res) {
        var name = req.body.name;

        analyze(name).then(function(report) {
            res.render('index', {
                repo: {
                    name: name,
                    url: 'https://github.com/' + name,
                    hotspots: report.hotspots,
                    bugspot: report.bugspot,
                    cpd: report.cpd
                }
            });
        });
    });
};
