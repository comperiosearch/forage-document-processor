var libxml = require('libxmljs');

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
    callback(doc);
}
