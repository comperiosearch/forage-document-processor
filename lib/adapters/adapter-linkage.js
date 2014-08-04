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

        }
        //console.log(JSON.stringify(searcRequest));
        return searcRequest;
        
    }


    //adds links to the global keyd variabl
    function addToDictionary(search, keyd) {

        for (var i = 0; i < search.hits.hits.length; i++) {
            var item = search.hits.hits[i];
            for (var j = 0; j < item.highlight.grdests.length; j++) {
                keyd[item.highlight.grdests[j]] = '/' + item._source.source + '/' + item._id;
            }
        }
        console.log(Object.keys(keyd).length + ' keys in keyd');
        return keyd;
    }

    function getKeyd() {
        return keyd;
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
        console.log("link not found for " + notFound.join(','));
        console.log("link  found for " + found.join(','));
        return xml.toString(false);
    }


    var q = async.queue(function(task, callback) {
        
            var searchRequest = task();
            request({
            uri: es_host + '/' + docIndex + '/' + docType + '/_search',
            method: 'POST',
            form: JSON.stringify(searchRequest),
            headers: {
                'Content-Type': 'application/json'
            }

        }, function(error, response, body) {
            if (error) {
                console.error(' AN ERROR ' + error);
            }
            var searchRes = JSON.parse(body);
            if (!searchRes || !searchRes.hits || searchRes.hits.total == "0") {
                console.log("no hits");
                return;
            }
            console.log(searchRes.hits.total + 'hits found');
            keyd = addToDictionary(searchRes, keyd);
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
        var linkstoProcess = searchDests.slice(i, chunkSize);
        console.log('queue up search for links from ' + i + ' chunk ' + chunkSize);
        q.push(function() {
            return getsearchQuery(linkstoProcess);
        }, function() {
            console.log('chunk done');
        });
    }

    q.drain = function() {
        console.log('drained');
        console.log(q.length());
        if(q.length() ==0){
           var doc = updateDocument();
            callback(doc)
        }
    }

}
