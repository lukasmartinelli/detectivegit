'use strict';
var path = require('path');
var Q = require('q');
var exec = Q.denodeify(require('child_process').exec);
var execFile = Q.denodeify(require('child_process').execFile);
var execFileOldschool = require('child_process').execFile;
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
    console.log('Looking for default branch' + repoPath);
    var options = { cwd: repoPath };
    var cmd = 'git rev-parse --abbrev-ref HEAD';
    return exec(cmd, options).then(function(stdout) {
        return stdout[0].trim();
    }, function(err) {
        console.error(err);
        return 'master';
    });
}

function parseBugspotLine(line) {
    var re = /(\d\.\d{4}) - (.*)/;
    var match = re.exec(line);
    if(match) {
        return {
            score: match[1],
            path: match[2]
        };
    }
}

function cpd(repoName, repoPath, defaultBranch, language) {
    console.log('Code duplication for ' + language + ' in ' + repoPath);
    var deferred = Q.defer();
    var args = ['--minimum-tokens', '20', '--language', language, '--files',  repoPath, '--exclude', 'node_modules', '--format', 'csv'];
    execFileOldschool('/usr/bin/cpd', args, { cwd: repoPath }, function(err, stdout, stderr) {
        if(err && err.code !== 4) {
            q.reject(err);
        }
        var output = stdout.split('\n').slice(1);
        var results = output.map(function(line) {
            var columns = line.split(',');

            if(columns.length > 3) {
                var lineCount = parseInt(columns[0]);
                var tokenCount = parseInt(columns[1]);
                var occurrences = parseInt(columns[2]);

                var duplicationFiles = [];
                for(var i = 1; i < 2 * occurrences; i+=2) {
                    var lineNumber = parseInt(columns[2 + i]);
                    var lineTo = lineNumber + lineCount;
                    var fileName = columns[2 + i+1].replace(repoPath + '/', '');
                    duplicationFiles.push( {
                        lineNumber: lineNumber,
                        fileName: fileName,
                        lineFrom: lineNumber,
                        lineTo: lineTo,
                        url: 'https://github.com/' + repoName + '/blob/' + defaultBranch + '/' + fileName + '#L' + lineNumber + '-' + 'L' + lineTo
                    });
                }

                return {
                    lineCount: lineCount,
                    tokenCount: tokenCount,
                    duplicationFiles: duplicationFiles
                }
            }
        }).filter(function(r) {
            return r !== undefined;
        });
        deferred.resolve(results);

    });
    return deferred.promise;
}

function bugspot(repoName, repoPath, defaultBranch) {
    console.log('Analyzing future bugs ' + repoPath);
    return exec('bugspots .', { cwd: repoPath }).then(function(stdout) {
        var output = stdout[0];
        var lines = output.split('\n');
        var predictions = lines.map(parseBugspotLine).filter(function(r) {
            return r !== undefined;
        }).filter(function(r) {
            return r.score !== '0.0000';
        }).map(function(prediction) {
            prediction.url = 'https://github.com/' + repoName + '/commits/' + defaultBranch + '/' + prediction.path;
            return prediction;
        });
        return predictions;
    }, function(err) {
        console.error(err);
    });
}


function hotspots(repoName, repoPath, defaultBranch) {
    console.log('Analyzing git hotspots ' + repoPath);
    var cmd = 'git log --pretty=format: --name-only | sort | uniq -c | sort -rg';
    return exec(cmd, { cwd: repoPath }).then(function(stdout) {
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
        }).filter(function(fileReport) {
            return fileReport.modifications > 1;
        });
    });
}

module.exports = function analyze(repo) {
    return mkdtemp('detectivegit').then(function(dirPath) {
        return clone(dirPath, repo).then(function() {
            var repoName = repo.split('/')[1];
            var repoPath = path.join(dirPath, repoName);
            return path.resolve(repoPath);
        })
        .then(function(repoPath) {
            return findDefaultBranch(repoPath).then(function(defaultBranch) {
                return Q.all([
                    hotspots(repo, repoPath, defaultBranch),
                    bugspot(repo, repoPath, defaultBranch),
                    cpd(repo, repoPath, defaultBranch, 'ecmascript'),
                    cpd(repo, repoPath, defaultBranch, 'java'),
                    cpd(repo, repoPath, defaultBranch, 'cs'),
                    cpd(repo, repoPath, defaultBranch, 'cpp'),
                    cpd(repo, repoPath, defaultBranch, 'ruby'),
                    cpd(repo, repoPath, defaultBranch, 'go'),
                    cpd(repo, repoPath, defaultBranch, 'php')
                ]).then(function(results) {
                    return {
                        hotspots: results[0],
                        bugspot: results[1],
                        cpd: results[2].concat(results[3], results[3],
                             results[4], results[5], results[6], results[7],
                             results[8]).sort(function(a,b) {
                            return a.lineCount - b.lineCount;
                        }).reverse()
                    };
                });
            });
        })
        .catch(function(err) {
            console.error(err);
        })
        .fin(function() {
            console.log('Cleaning up ' + dirPath);
            rmdir(dirPath);
        });
    });
};
