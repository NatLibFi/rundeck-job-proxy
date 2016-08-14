# Rundeck job proxy [![Build Status](https://travis-ci.org/NatLibFi/rundeck-job-proxy.svg)](https://travis-ci.org/NatLibFi/rundeck-job-proxy) [![Test Coverage](https://codeclimate.com/github/NatLibFi/rundeck-job-proxy/badges/coverage.svg)](https://codeclimate.com/github/NatLibFi/rundeck-job-proxy/coverage)

Proxy server for Rundeck job executions. Converts the request's JSON payload to job arguments

## Usage

To start the server run:
```sh
rundeck-job-proxy$ bin/rundeck-job-proxy.sh config.json
```

Calling the server with a URL parameter **job** will reroute to `<BACKEND_URL>/api/<VERSION>/executions/<JOB>`

For configuration options, see [Configuration](#Configuration).

To create a system startup script use [pm2](http://pm2.keymetrics.io/). Start the server and run `pm2 startup`

### nginx
```
# Rundeck
        location / {
                proxy_pass http://localhost:4440;
        }

# Rundeck job proxy
        location /run-job/ {
                proxy_pass http://localhost:1337;
        }
```

## Configuration

Following configuration options are available:

- **port**: Proxy server port. Defaults to _1337_.
- **version**: Rundeck API version to use. Defaults to _14_.
- **backend**: Rundeck server URL. Defaults to _http://localhost:4440_.
- **map**: A mapping of JSON payload properties to job options. Property names represents the option name. The values are arrays which represent the property hierarchy of the mapped value. Defaults to _{}_.

### Example configuration
```js
{
  "port": 1337,
  "version": "14"
  "backend": "http://localhost:4440",
  "map": {
    "foo": ["foo", "bar"]
  }
}
```

### For example payload
```js
{
  "foo": {
    "bar": "fubar"
  }
}
```

### Of URL
```
https://rundeck.foo.bar/api/14/executions?job=foo&authtoken=bar
```

### Becomes
```
https://rundeck.foo.bar/api/14/executions/foo?authtoken=bar
```

### And payload
```js
{
  "argString": "-foo \"fubar\""
}
```

## Development 

Clone the sources and install the package using `npm`:

```sh
npm install
```

Run the following NPM script to lint, test and check coverage of the code:

```javascript

npm run check

```

## License and copyright

Copyright (c) 2016 **University Of Helsinki (The National Library Of Finland)**

This project's source code is licensed under the terms of **GNU Affero General Public License Version 3** or any later version.
