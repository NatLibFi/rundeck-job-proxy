#!/usr/bin/env node

if (process.argv.length < 3) {
  console.log('USAGE: rundeck-job-proxy <CONFIGURATION_FILE>\n\n' + 'A proxy server for converting JSON payloads to Rundeck job arguments\n');
} else {
  require('../lib/main')(JSON.parse(process.argv[2]));
}
