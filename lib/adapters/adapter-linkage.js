var request = require('request');
var libxml = require('libxmljs');
var fs = require('fs');

var es_host = 'http://localhost:9200';
var docIndex = 'grdests1';
var docType = 'doc';

function makeDictionary(search) {
    var keyd = {};
    for (var i = 0; i < search.hits.hits.length; i++) {
        var item = search.hits.hits[i];
        for (var j = 0; j < item.highlight.grdests.length; j++) {
            keyd[item.highlight.grdests[j]] = '/' + item._source.source + '/' + item._id;
        }

        // console.log(keyd);
    }
    return keyd;
}

function updateDocument(searchResult, xml) {
    var searchRes = JSON.parse(searchResult);
    if (searchRes.hits.total == "0") {
        console.log("no hits");
        return;
    }
    var searchLinks = makeDictionary(searchRes);
    var linksX = xml.find('//a[@class="Jump"]');
    var found = [];
    var notFound = [];
    for (var i = 0; i < linksX.length; i++) {
        var link = linksX[i].attr('href').value();
        if (link) {
            // lookup the link in the searchResult
            var nylink = searchLinks[link];
            if (nylink) {
                //replace the link in the xml
                linksX[i].attr({
                    'href': nylink + '#' + link
                })
                found.push(nylink);
            } else {

                notFound.push(link);
            }

        }
    }
    //console.log("link not found for " + notFound.join(','));
    //console.log("link  found for " + found.join(','));
    return xml.toString(false);
}

exports.parse = function(file, html, callback) {
    var doc = {};
    var xml = libxml.parseXmlString(html);
    //var linksX = xml.find('//a[@class="Jump"]');
    var grlinks = xml.find('//meta[@name="grlinks"]')[0].attr('content').value();
    if (!grlinks) {
        return;
    }
    var searchDests = grlinks.split(';');
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
        //  console.log(JSON.stringify(searcRequest));
    request({
        uri: es_host + '/' + docIndex + '/' + docType + '/_search',
        method: 'POST',
        form: JSON.stringify(searcRequest),
        headers: {
            'Content-Type': 'application/json'
        }

    }, function(error, response, body) {
        if (error) {
            console.error(' AN ERROR ' + error);
        }
        doc = updateDocument(body, xml);
        callback(doc);
    });


}
