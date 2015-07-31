'use strict';
var path = require('path');
var Q = require('q');
var exec = Q.denodeify(require('child_process').exec);
var execFile = Q.denodeify(require('child_process').execFile);
var rmdir = Q.denodeify(require('rimraf'));
var temp = require('temp');
var mkdtemp = Q.denodeify(temp.mkdir);

// Automatically track and cleanup files at exit
temp.track();

function clone(dirPath, repo) {
    var cloneUrl = 'https://github.com/' + repo + '.git';
    console.log('Cloning ' + cloneUrl + ' to ' + path.resolve(dirPath));
    return execFile('git', ['clone', '-q', cloneUrl], { cwd: dirPath });
}

function findDefaultBranch(repoPath) {
        console.log('Looking for default branch' + path.resolve(repoPath));
    return exec('git rev-parse --abbrev-ref HEAD', { cwd: path.resolve(repoPath) }).then(function(stdout) {
        return stdout[0].trim()
    });
}

function parseBugspotLine(line) {
    var re = /(\d\.\d{4}) - (.*)/;
    var match = re.exec(line);
    if(match) {
        return {
            score : match[1],
            path: match[2]
        }
    }
}

function bugspot(repoName, repoPath, defaultBranch) {
    console.log('Analyzing future bugs ' + path.resolve(repoPath));
    return exec('bugspots .', { cwd: repoPath }).then(function(stdout) {
        var output = stdout[0];
        var lines = output.split('\n');
        var predictions = lines.map(parseBugspotLine).filter(function(r) {
            return r !== undefined;
        }).map(function(prediction) {
            prediction.url = 'https://github.com/' + repoName + '/commits/' + defaultBranch + '/' + prediction.path;
            return prediction;
        });
        return predictions.slice(0,10);
    }, function(err) {
        console.error(err);
    });
}


function hotspots(repoName, repoPath, defaultBranch) {
    console.log('Analyzing git hotspots ' + path.resolve(repoPath));
    return exec('git log --pretty=format: --name-only | sort | uniq -c | sort -rg | head -n 10', { cwd: path.resolve(repoPath) }).then(function(stdout) {
        var gitOutput = stdout[0];
        return gitOutput.split('\n').map(function(line) {
            var columns = line.trim().split(' ');
            return {
                modifications: columns[0],
                path: columns[1],
                url: 'https://github.com/' + repoName + '/commits/' + defaultBranch + '/' + columns[1]
            };
        }).filter(function(fileReport) {
            return fileReport.modifications && fileReport.path;
        });
    });
}

exports.analyze = function analyze(repo) {
    return mkdtemp('detectivegit').then(function(dirPath) {
        return clone(dirPath, repo).then(function() {
            var repoName = repo.split('/')[1];
            var repoPath = path.join(dirPath, repoName);
            return repoPath;
        })
        .then(function(repoPath) {
            return findDefaultBranch(repoPath).then(function(defaultBranch) {
                return Q.all([
                    hotspots(repo, repoPath, defaultBranch),
                    bugspot(repo, repoPath, defaultBranch)
                ]).then(function(results) {
                    return {
                        hotspotReport: results[0],
                        bugspotReport: results[1]
                    };
                });
            });
        })
        .fin(function() {
            console.log('Cleaning up ' + dirPath);
            rmdir(dirPath);
        });
    });
};
