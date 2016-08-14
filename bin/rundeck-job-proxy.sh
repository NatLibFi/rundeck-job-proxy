#!/usr/bin/env node
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

if (process.argv.length < 3) {
  console.log('USAGE: rundeck-job-proxy <CONFIGURATION_FILE>\n\n' + "Proxy server for Rundeck job executions. Converts the request's JSON payload to job arguments\n');
} else {
  require('../lib/main')(JSON.parse(process.argv[2]));
}
