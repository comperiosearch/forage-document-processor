var request = require('request');
var libxml = require('libxmljs');
var fs = require('fs');
var async = require('async');

var es_host = 'http://localhost:9200';
var docIndex = 'grdests1';
var docType = 'doc';
var chunkSize = 10;


exports.parse = function(file, html, callback) {

    var keyd = {};
    var xml = null;

    function getsearchQuery(searchDests) {
        var searcRequest = {
                "size": searchDests.length,
                "query": {
                    "terms": {
                        "grdests": searchDests
                    }
                },
                "highlight": {
                    "pre_tags": [""],
                    "post_tags": [""],
                    "fields": {
                        "grdests": {}
                    }
                },
                "fields": ["highlight.grdests", "source"]
            }
            //console.log(JSON.stringify(searcRequest));
        return JSON.stringify(searcRequest);
    }


    //adds links to the global keyd variabl
    function addToDictionary(search) {

        for (var i = 0; i < search.hits.hits.length; i++) {
            var item = search.hits.hits[i];
            for (var j = 0; j < item.highlight.grdests.length; j++) {
                keyd[item.highlight.grdests[j]] = '/' + item.fields.source + '/' + item._id;
            }
        }
    }

    //updates the document. called after all calbacks finished
    function updateDocument() {

        var linksX = xml.find('//a[@class="Jump"]');
        var found = [];
        var notFound = [];
        for (var i = 0; i < linksX.length; i++) {
            var link = linksX[i].attr('href').value();
            if (link) {
                // lookup the link in the searchResult
                var nylink = keyd[link];
                if (nylink) {
                    //replace the link in the xml
                    linksX[i].attr({
                        'href': nylink + '.htm#' + link
                    })
                    found.push(nylink);
                } else {
                    linksX[i].attr({
                        'href': '#' + link
                    });
                    notFound.push(link);
                }

            }
        }
        //console.log("link not found for " + notFound.join(','));
        //console.log("link  found for " + found.join(','));
        console.log("link not found for " + notFound.length);
        console.log("link  found for " + found.length);
        return xml.toString(false);
    }


    var q = async.queue(function(links, callback) {
        //console.log('links to proc ' + links.links.length);
        var searchRequest = getsearchQuery(links.links);
        request({
            uri: es_host + '/' + docIndex + '/' + docType + '/_search',
            method: 'POST',
            form: searchRequest,
            headers: {
                'Content-Type': 'application/json'
            }

        }, function(error, response, body) {
            if (error) {
                console.error(' AN ERROR ' + error);
            }
        //    console.log(body);
            var searchRes = JSON.parse(body);
            if (!searchRes || !searchRes.hits || searchRes.hits.total == "0") {
                console.log("no hits");
                callback();
                return;
            }
          //  console.log(searchRes.hits.total + 'hits found');
            addToDictionary(searchRes);
            callback();
        });



    });

    xml = libxml.parseXmlString(html);
    var grlinks = xml.find('//meta[@name="grlinks"]')[0].attr('content').value();
    if (!grlinks) {
        return;
    }
    var searchDests = grlinks.split(';');
    console.log("nr. lnks " + searchDests.length);
    for (var i = 0; i < searchDests.length; i = i + chunkSize) {
        var linkstoProcess = searchDests.slice(i, i + chunkSize);
        //console.log('queue up search for links from ' + i + ' chunk ' + chunkSize);
        //console.log(linkstoProcess);
        q.push({links:linkstoProcess}, function() {
            //console.log('chunk done');
        });
    }

    q.drain = function() {
        console.log('drained');
        if (q.length() == 0) {
            var doc = updateDocument();
            callback(doc)
        } else {
            console.log('not empty queye');
        }
    }

}
