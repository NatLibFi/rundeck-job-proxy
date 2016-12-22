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

  var chai = require('chai'),
  http = require('http'),
  url = require('url'),
  mock_fs = require('mock-fs'),
  createProxy = require('../lib/main'),
  expect = chai.expect;
  
  describe('main', function() {
    
    var server_proxy, server_backend;
    
    function runTest(doneCallback, testCallback, body, options, url_arg)
    {

      server_backend = http.createServer(function(request, response) {
        
        var body = '';

        request
          .on('data', function(chunk) {
            body += chunk;
          })
          .on('end', function() {
            try {

              testCallback(request, body);
              response.end();
              doneCallback();
              
            } catch (error) {
              response.end();
              doneCallback(error);
            }            
          });
          
      }).listen(1338);

      server_proxy = createProxy(options);

      http.request(Object.assign(url.parse(url_arg ? url_arg : 'http://localhost:1337/foo?job=foobar'), {
        method: 'POST'
      })).end(body);
      
    }
    
    afterEach(function(done) {

        mock_fs.restore();

      if (server_proxy) {

        server_proxy.close(function() {
          server_backend.close(function() {
            done();
          });
        });  

      } else {
        done();
      }

    });

    it('Should not do mapping', function(done) {
      runTest(done, function(request, body) {
        
        expect(request.url).to.equal('/api/14/job/foobar/executions?');        
        expect(body).to.eql(JSON.stringify({
          argString: ''
        }));
        
      }, JSON.stringify({
        foo: 'bar'
      }), {
        backend: 'http://localhost:1338',
        map: {}
      });            
    });

    it('Should use default configuration and fail to connect backend server', function(done) {

      server_proxy = createProxy().on('error', function(error) {

        server_proxy = undefined;

        try {

          expect(error).to.be.an('error').and.to.have.property('message', 'connect ECONNREFUSED 127.0.0.1:4440');         
          done();

        } catch (error_catch) {
          done(error_catch);
        }

      });

      http.request(Object.assign(url.parse('http://localhost:1337/foo?job=foobar'), {
        method: 'POST'
      })).end('{}');

    });
    
    it('Should read configuration from a file and not do mapping', function(done) {     

      mock_fs({
        'conf.json': JSON.stringify({
          backend: 'http://localhost:1338',
          map: {}
        })
      });
      
      runTest(done, function(request, body) {

        expect(request.url).to.equal('/api/14/job/foobar/executions?');        
        expect(body).to.eql(JSON.stringify({
          argString: ''
        }));

      }, JSON.stringify({
        foo: 'bar'
      }), 'conf.json');

    });

    it('Should do mapping', function(done) {     
      runTest(done, function(request, body) {

        expect(request.url).to.equal('/api/14/job/foobar/executions?');
        expect(body).to.eql(JSON.stringify({
          argString: '-foo "fubar" '
        }));

      }, JSON.stringify({
        foo: {
          bar: 'fubar'
        }
      }), {        
        backend: 'http://localhost:1338',
        map: {
          foo: ['foo', 'bar']
        }
      });
    });

    it('Should do mapping for some properties', function(done) {     
      runTest(done, function(request, body) {

        expect(request.url).to.equal('/api/14/job/foobar/executions?authtoken=foobar&');
        expect(body).to.eql(JSON.stringify({
          argString: '-foo "fubar" '
        }));

      }, JSON.stringify({
        foo: {
          bar: 'fubar'
        }
      }), {        
        backend: 'http://localhost:1338',
        map: {
          foo: ['foo', 'bar'],
          bar: ['fu']
        }
      }, 'http://localhost:1337/foo?job=foobar&authtoken=foobar');
    });

    it('Should not call backend because the request was filtered out', function(done) {
      
      server_backend = http.createServer(function(request, response) {       
        request
          .on('data', function(chunk) {
            done(new Error('Unexpected data event: '+chunk));
          })
          .on('error', function(error) {
            done(new Error('Unexpected error event: '+chunk));
          })
          .on('end', function() {
            done(new Error('Unexpected end event: '+chunk));
          });
      }).listen(1338);

      server_proxy = createProxy({
        backend: 'http://localhost:1338',
        map: {},
        filter: {
          fu: 'foo'
        }
      });
      
      http.request(Object.assign(url.parse('http://localhost:1337/foo?job=foobar'), {
        method: 'POST'
      }))
        .on('response', function(response) {

          var body = '';
          
          response
            .on('data', function(chunk) {
              body += chunk;
            })
            .on('end', function() {
              expect(response.statusCode).to.equal(400);
              expect(body).to.equal('Payload did not pass filter');
              done();
            })
            .on('error', done);
              
          
        })
        .end(JSON.stringify({
          foo: 'bar',
          fu: 'foo'
        }));

    });
    
  });

}());
