var request = require('request');
var libxml = require('libxmljs');
var fs = require('fs');

var es_host = 'http://localhost:9200';
var docIndex = 'grdests1';
var docType = 'doc';
function makeDictionary (search){
  var keyd = {};
  for (var i=0;i<search.hits.hits.length;i++){
    var item = search.hits.hits[i];
    keyd[item.highlight.grdests[0]] = item._id;
  }
  return keyd;
}
function updateDocument(searchResult, xml){
  var searchRes = JSON.parse(searchResult);
  if(searchRes.hits.total =="0"){
    console.log("no hits");
    return;
  }
  var searchLinks = makeDictionary(searchRes);
  var linksX = xml.find('//a[@class="Jump"]');
  for(var i=0; i<linksX.length; i++){
      var link = linksX[i].attr('href').value();
      if(link){
        // lookup the link in the searchResult
        var nylink = searchLinks[link];
        //replace the link in the xml
        linksX[i].attr({'href':nylink})

      }
    }
  return xml.toString(false);
}

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
    var searchDests = Object.keys(searchFor);
   var searcRequest =  {
    "size": searchDests.length,
    "query":{
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
        doc =  updateDocument(body, xml);
       //var saved = fs.writeFileSync( file + '.modded', doc, 'utf8');
     
        callback(doc);
    });

    
}
