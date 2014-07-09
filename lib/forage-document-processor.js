var fs = require('fs');
var urllib = require('url');
var async = require('async');
var program = require('commander');
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


// the task to perform

// create a queue object with concurrency 2
var q = async.queue(function(task, callback) {
    console.log('hello ' + task);
    processFile(task, callback);
    //callback();
}, 8);


// assign a callback
q.drain = function() {
    console.log('all items have been processed');
}

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
                    scan(filePath, function(err, results) {
                        if (err) {
                            return next(err);
                        }
                        next();

                    })
                } else if (stat.isFile()) {

                    q.push(filePath, function() {
                        console.log('running finished with ' + filePath);
                    });
                    next();
                }
            });
        });
    })
};

function processFile(file, callback) {
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
            console.log('.');
            callback();
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
