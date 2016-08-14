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

  });

}());
