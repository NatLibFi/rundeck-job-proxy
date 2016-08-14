(function() {

  'use strict';

  var http = require('http'),
  url = require('url'),
  querystring = require('querystring'),
  fs = require('fs'),
  DEFAULT_OPTIONS = {
    port: 1337,
    backend: 'http://localhost:4440',    
    version: '14',
    map: {}
  };

  module.exports = function(options)
  {

    options = typeof options === 'string' ? JSON.parse(fs.readFileSync(options, {
      encoding: 'utf8'
    })) : options;

    options = Object.assign(JSON.parse(JSON.stringify(DEFAULT_OPTIONS)), typeof options === 'object' ? options : {});    

    return http.createServer(function(request, response) {

      var body = '',
      self = this;

      try {
        
        request
          .on('data', function(chunk) {
            body += chunk;
          })
          .on('end', function() {

            var query = querystring.parse(url.parse(request.url).query),
            obj = JSON.parse(body);

            http.request(Object.assign(url.parse(options.backend + '/api/' + options.version + '/job/' +  query.job + '/executions' + Object.keys(query).reduce(function(result, key) {        
              
              return result + (key === 'job' ? '' : key + '=' + query[key] + '&');
              
            }, '?')), {
              method: 'POST'
            }))
              .on('response', function() {
                response.end();
              })
              .on('error', function(error) {
                self.emit('error', error);
                self.close();
              })
              .end(JSON.stringify({
                argString: Object.keys(options.map).reduce(function(result, name_option) {
                  
                  var key, value,
                  context = obj,
                  keys = options.map[name_option].slice();
                  
                  while (key = keys.shift() /* jshint -W084 */) {

                    if (context.hasOwnProperty(key)) {
                      
                      context = context[key];

                      if (keys.length === 0) {
                        value = context;
                      }
                      
                    } else {
                      break;
                    }
                                                           
                  }
                  
                  return result + (value ? '-' + name_option + ' "' + value + '" ' : '');
                  
                }, '')
              }));

          });

      } catch (error) {
        /* istanbul ignore next: Cannot be covered reasonably */
        console.log(error);
      }

    }).listen(options.port);

  };

}());
