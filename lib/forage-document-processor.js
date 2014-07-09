var fs = require('fs');
var cheerio = require('cheerio');
var urllib = require('url');
var request = require('request');
var async = require('async');
var program = require('commander');

var es_host = 'http://localhost:9200';
var docIndex = 'grdests';
var docType = 'doc';
var asyncLimit = 10; // number of parrallel tasks

program
    .version('0.2.3')
    .option('-f, --fetchdirectory <fetchdirectory>', 'specify the fetch directory,' + ' defaults to crawl/fetch/ (MUST END WITH SLASH /)',
        String, 'fetch/')
    .option('-d, --documentdirectory <documentdirectory>', 'specify the document directory,' + ' defaults to crawl/doc/ (MUST END WITH SLASH /)',
        String, 'doc/')
    .option('-a, --adapter <adapter>', 'specify the adapter, for example adapter-simple.js',
        String, 'adapter-simple.js')
    .parse(process.argv);

var adapter = require('./adapters/' + program.adapter);
var fetchdir = program.fetchdirectory;
var docdir = program.documentdirectory;

// code borrowed from http://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search

var scan = function(dir, suffix, callback) {
    fs.readdir(dir, function(err, files) {
        var returnFiles = 0;

        async.eachLimit(files, asyncLimit, function(file, next) {
            var filePath = dir + '/' + file;
            fs.stat(filePath, function(err, stat) {
                if (err) {
                    return next(err);
                }
                if (stat.isDirectory()) {
                    scan(filePath, suffix, function(err, results) {
                        if (err) {
                            return next(err);
                        }
                        returnFiles += results;
                        next();

                    })
                } else if (stat.isFile()) {
                    if (file.indexOf(suffix, file.length - suffix.length) !== -1) {

                        processFile(filePath);
                    }
                    returnFiles += 1;
                    next();
                }
            });
        }, function(err) {
            callback(err, returnFiles);
        });
    });
};

function processFile(file) {
    fs.readFile(file, function(err, data) {
        if (err) {
            console.log(err, file);
            return;
        }
        var html = data.toString();
        if (!html) {
            console.log('weirdness');
            return;
        }
        adapter.parse(file, html, function(batch) {

            request({
                uri: es_host + '/' + docIndex + '/' + docType+ '/' + batch['id'],
                method: 'POST',
                form: JSON.stringify(batch),
                headers: {
                    'Content-Type': 'application/json'
                }

            }, function(error, response, body) {
                if (error) {
                    console.error(' AN ERROR ' + error);
                }
                console.log(body);
            });
        });

    });

}
var start = new Date();
scan(fetchdir, '.htm', function(err, results) {
    console.log('omg I got results ' + results);
    console.log(err);
    var end = new Date() - start;
    console.info("Execution time: %ds", end / 1000);
    console.info("docs pr. second:  " + results / (end / 1000));
})
