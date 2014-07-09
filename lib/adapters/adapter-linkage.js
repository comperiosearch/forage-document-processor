var request = require('request');
var libxml = require('libxmljs');

var es_host = 'http://localhost:9200';
var docIndex = 'grdests';
var docType = 'doc';

exports.parse = function(file, html, callback) {
    var doc = {};
    var xml = libxml.parseXmlString(html);
    var linksX = xml.find('//a[@class="Jump"]');
    if(linksX.length ==0){
      return;
    }
    var searchFor ={};

    for(var i=0; i<linksX.length; i++){
      var link = linksX[i].attr('href').value();
      if(link){
        searchFor[link] = 1;
      }
    }
    var searcRequest = 

{
    "query":{
        "terms": {
           "grdests": Object.keys(searchFor)
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
  console.log(JSON.stringify(searcRequest));
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
        console.log(body);
        callback(doc);
    });

    
}
