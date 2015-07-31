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

function hotspots(repoPath) {
    console.log('Analyzing git hotspots ' + path.resolve(repoPath));
    return exec('git log --pretty=format: --name-only | sort | uniq -c | sort -rg', { cwd: path.resolve(repoPath) }).then(function(stdout) {
        var gitOutput = stdout[0];
        return gitOutput.split('\n').map(function(line) {
            var columns = line.trim().split(' ');
            return {
                modifications: columns[0],
                path: columns[1]
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
        .then(hotspots)
        .fin(function() {
            console.log('Cleaning up ' + dirPath);
            rmdir(dirPath);
        });
    });
};
