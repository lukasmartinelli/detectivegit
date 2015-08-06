'use strict';
var analyze = require('./analyzer');

module.exports = function(app) {
    app.get('/', function(req, res) {
        res.render('index', {});
    });

    app.get('/:owner/:repo', function(req, res) {
        var repoName = req.params.owner + '/' + req.params.repo;

        analyze(repoName).then(function(report) {
            res.status(200);
            res.render('index', {
                repo: {
                    name: repoName,
                    url: 'https://github.com/' + repoName,
                    hotspots: report.hotspots,
                    bugspot: report.bugspot,
                    cpd: report.cpd
                }
            });
        }, function(err) {
            console.error(err);
            res.status(500);
            res.render('error', {
                repo: {
                    name: repoName,
                }
            });
        });
    });

    app.post('/', function(req, res) {
        var name = req.body.name;
        res.redirect(301, name);
    });
};
