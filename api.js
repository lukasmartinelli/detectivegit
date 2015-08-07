/*eslint new-cap:0 */
'use strict';
var Q = require('q');
var analyze = require('./analyzer');

module.exports = function(app, cache) {
    function getCachedReport(repoName) {
        var getCache = Q.ninvoke(cache, 'get', repoName);

        return getCache.then(function(val) {
            if(val) {
                return Q(val);
            } else {
                return analyze(repoName).then(function(report) {
                    console.log('Caching report for ' + repoName);
                    cache.set(repoName, report, 300, function(err) {
                        if(err) {
                            console.error(err);
                        }
                    });
                    return report;
                });
            }
        });

    }

    app.get('/', function(req, res) {
        res.render('index', {});
    });

    app.get('/:owner/', function(req, res) {
        res.status(404);
        res.render('error', {
            repo: {
                name: req.params.owner
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
                    cpd: report.cpd.slice(0, 10)
                }
            });
        }, function(err) {
            console.error(err);
            res.status(500);
            res.render('error', {
                repo: {
                    name: repoName
                }
            });
        });
    });

    app.post('/', function(req, res) {
        var name = req.body.name;
        res.redirect(301, name);
    });
};
