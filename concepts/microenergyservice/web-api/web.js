/*global require, module*/
var ApiBuilder = require('claudia-api-builder'),
	api = new ApiBuilder(),
	fs = require('fs'),
	superb = require('superb'),
	util = require('util');
var CONFIG = require('./config.json');

module.exports = api;

//
// Microenergy Routes
//

/**
 * use .post to handle a post; or .delete, .patch, .head, .put
 * 
 * request body params:
 * - address (of the wallet owning the mosaic)
 * - units (of the Microenergy Mosaic to use)
 * 
 * The destination NEM address is hardcoded in the configuration.
 */
api.post('/use', function (request) {
	'use strict';
	return request.body;
}, {success: 200});

//
// These are the legacy routes from the web-api demo.  Leave a few in functional for testing
//

// just return the result value for synchronous processing
/*
api.get('/hello', function () {
	'use strict';
	return 'hello world';
});
*/

// pass some arguments using the query string or headers to this
// method and see that they're all in the request object
api.get('/echo', function (request) {
	'use strict';
	return request;
});

// use request.queryString for query arguments
api.get('/greet', function (request) {
	'use strict';
	return request.queryString.name + ' is really ' + superb.random();
});

// use {} for dynamic path parameters

/*
api.get('/people/{name}', function (request) {
	'use strict';
	return request.pathParams.name + ' is ' + superb.random();
});
*/

// Return a promise for async processing
/*
api.get('/packagejson', function () {
	'use strict';
	var read = util.promisify(fs.readFile);
	return read('./package.json')
		.then(JSON.parse)
		.then(function (val) {
			return val;
		});
});
*/

// use .post to handle a post; or .delete, .patch, .head, .put
api.post('/echo', function (request) {
	'use strict';
	return request;
});
