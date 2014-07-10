forage-document-processor
=========================
A somewhat  modified fork of the forage-document-processor.
Supports handling directories recursively. 
adapter-simple.js analyses documents and  stores link info into elasticsearch. 
adapter-linkage.js reads documents and fetches info from elasticseaarch and modifies links. 


```
  Usage: forage-document-processor [options]

  Options:

    -h, --help                                   output usage information
    -V, --version                                output the version number
    -f, --fetchdirectory <fetchdirectory>        specify the fetch directory, defaults to crawl/fetch/ (MUST END WITH SLASH /)
    -d, --documentdirectory <documentdirectory>  specify the document directory, defaults to crawl/doc/ (MUST END WITH SLASH /)
    -a, --adapter <adapter>                      specify the adapter, for example adapter-simple.js
```

[![NPM](https://nodei.co/npm/forage-document-processor.png?stars&downloads)](https://nodei.co/npm/forage-document-processor/)

[![NPM](https://nodei.co/npm-dl/forage-document-processor.png)](https://nodei.co/npm/forage-document-processor/)
