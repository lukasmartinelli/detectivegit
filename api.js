'use strict';
var Q = require('q');
var analyze = require('./analyzer');
var cache = require('memory-cache');

function getCachedReport(repoName) {
    var cachedReport = cache.get(repoName);

    if(cachedReport) {
        return Q(cachedReport);
    }

    return analyze(repoName).then(function(report) {
        console.log('Caching report for ' + repoName);
        cache.put(repoName, report, 300 * 1000);
        return report;
    });
}

module.exports = function(app) {
    app.get('/', function(req, res) {
        res.render('index', {});
    });

    app.get('/:owner/', function(req, res) {
        res.status(404);
        res.render('error', {
            repo: {
                name: req.params.owner,
            }
        });
    });

    app.get('/:owner/:repo', function(req, res) {
        var repoName = req.params.owner + '/' + req.params.repo;

        getCachedReport(repoName).then(function(report) {
            res.status(200);
            res.render('index', {
                repo: {
                    name: repoName,
                    url: 'https://github.com/' + repoName,
                    hotspots: report.hotspots.slice(0, 10),
                    bugspot: report.bugspot.slice(0, 10),
                    cpd: report.cpd.slice(0,10)
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
