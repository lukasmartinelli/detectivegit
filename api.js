'use strict';
var hotspots = require('./hotspots');

module.exports = function(app) {
    app.get('/', function(req, res) {
        res.format({
            html: function() {
                res.sendFile('index.html', {root: './public'});
            },
            json: function() {
                return res.json({});
            }
        });
    });

    app.get('/:owner/:repo', function(req, res) {
        var fullName = req.params.owner + '/' + req.params.repo;
        console.log('Status for ' + fullName + ' requested');

        repo.analyze(fullName).then(function(lines) {
           res.json(lines);
        }, function(err) {
            console.log('Could not find repo ' + fullName);
            res.status(404);
            res.send(err.message);
        });
    });
};
