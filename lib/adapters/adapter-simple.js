var request = require('request');
var libxml = require('libxmljs');

var es_host = 'http://localhost:9200';
var docIndex = 'grdests';
var docType = 'doc';

exports.parse = function(file, html, callback) {
    var doc = {};
    var xml = libxml.parseXmlString(html);
    var grdests = xml.find('//meta[@name="grdests"]')[0].attr('content').value();
    if (grdests) {
        grdestsPlt = grdests.split(';');
        doc['grdests'] = grdestsPlt;
    }
    var titleX = xml.find('//title');
    if (titleX && titleX.length > 0) {
        doc['title'] = titleX[0].text();
    }
    doc['path'] = file;
    var fileparts = file.split(/\/|\\\\/);
    doc['source'] = fileparts[fileparts.length - 2];
    var id = fileparts[fileparts.length - 1].replace('.htm', '');
    doc['id'] = id;


    request({
        uri: es_host + '/' + docIndex + '/' + docType + '/' + doc['id'],
        method: 'POST',
        form: JSON.stringify(doc),
        headers: {
            'Content-Type': 'application/json'
        }

    }, function(error, response, body) {
        if (error) {
            console.error(' AN ERROR ' + error);
        }
        console.log(body);
    });

    callback(doc);
}
