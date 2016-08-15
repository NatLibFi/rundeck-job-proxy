/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Proxy server for Rundeck job executions. Converts the request's JSON payload to job arguments
 *
 * Copyright (c) 2016 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of rundeck-job-proxy
 *
 * rundeck-job-proxy is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *  
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *  
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 **/

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

      console.log('Started Rundeck job proxy server');

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
