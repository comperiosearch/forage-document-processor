var request = require('request');
var libxml = require('libxmljs');
var parser = require('xml2json');

var es_host = 'http://localhost:9200';
var docIndex = 'grd';
var docType = 'doc';

exports.parse = function(file, html, callback) {
    var doc = {};
    var xml = libxml.parseXmlString(html);
    var metas = xml.find('//meta');

    for (var i = 0; i < metas.length; i++) {
        var meta = metas[i];
        var name = meta.attr('name').value();
        var value = meta.attr('content').value();
        if (value.indexOf(';') > -1) {
            value = value.split(';');
        }
        doc[name] = value;
    }
    var titleX = xml.find('//title');
    if (titleX && titleX.length > 0) {
        doc['title'] = titleX[0].text();
    }
    doc['id'] = doc['grdocumentname'];

    var body = xml.find('//body')[0];
    doc['body'] = body.text().replace(/\r\n|\n|\s+|\t|"|'/g, ' ');

    var headings = [];
    for (var g = 1; g < 8; g++) {
        var h1 = xml.find('//h' + g);
        headings.push(h1.map(function(ex) {
            return ex.text().trim()
        }).join(' '));
    }
    doc['headings'] = headings.join(' ');
    if(!doc['pagerank']){
        doc['pagerank'] = 0;
    }
    //console.log(body.toString().length);
    //var parsebody = parser.toJson(body.toString());
    //doc['body'] = parsebody;
//    console.log(doc);
    request({
        uri: es_host + '/' + docIndex + '/' + docType + '/' + doc['id'],
        method: 'POST',
        form: JSON.stringify(doc),
        headers: {
            'Content-Type': 'application/json;utf-8'
        }

    }, function(error, response, body) {
        if (error) {
            console.error(' AN ERROR ' + error);
        }
        //   console.log(body);
    });

    callback();
}
