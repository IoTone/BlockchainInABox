/*global require, module*/
var ApiBuilder = require('claudia-api-builder'),
	api = new ApiBuilder(),
	fs = require('fs'),
	superb = require('superb'),
	util = require('util');
var CONFIG = require('./config.json');
var nemSdk = require("nem-sdk").default;
var walletPriv = require('./wallet.json');
var querystring = require('querystring');

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
	var nemnet;
	var nemnode;

	console.log("body post:", request.body);

	// The body should be sent as json, although it looks like right now it's a string
	var reqbody = querystring.parse(request.body);
	var req_address = reqbody.address;

	if (req_address) {
		console.log("Ignoring request address");
	}

	var req_units = reqbody.units;

	if (!req_units) {
		req_units = 1; // Default to 1
		console.log("No units provided, using default of 1 microenergy unit");
	}
	 
	var req_id = reqbody.id;

	if (req_id) {
		console.log("request id = ", req_id);
	}

	if (CONFIG["nem_net_config"].net === "mainnet") {
		nemnet = nemSdk.model.network.data.mainnet;
		nemnode = nemSdk.model.nodes.defaultMainnet;
	} else if (CONFIG["nem_net_config"].net === "testnet") {
		nemnet = nemSdk.model.network.data.testnet;
		nemnode = nemSdk.model.nodes.defaultTestnet;
	} else if (CONFIG["nem_net_config"].net === "mijinnet") {
		nemnet = nemSdk.model.network.data.mijin;
		nemnode = nemSdk.model.nodes.defaultMijin;
	} else {
		// Default to main
		nemnet = nemSdk.model.network.data.mainnet;
		nemnode = nemSdk.model.nodes.defaultMainnet;
	}

	console.log("nemnet:", nemnet);

	// Create an NIS endpoint object
	var endpoint = nemSdk.model.objects.create("endpoint")(nemnode, nemSdk.model.nodes.defaultPort);

	// unlock privatekey
	var common = walletPriv;

	//
	// Create variable to store our mosaic definitions, needed to calculate fees properly (already contains xem definition)
	var mosaicDefinitionMetaDataPair = nemSdk.model.objects.get("mosaicDefinitionMetaDataPair");

	var microenergymsg = {
		"type": "use",
		"data": [new Date(), "microenergy-web-api", "ces2019demo", "1.0.0"]
	}
	// Create an un-prepared mosaic transfer transaction object (use same object as transfer tansaction)
	var transferTransaction = nemSdk.model.objects.create("transferTransaction")(CONFIG.smarthome_config.nem_microenergy_server_address, 1, JSON.stringify(microenergymsg));

	console.log("owner address:", CONFIG.smarthome_config.nem_microenergy_owner_address);

	// Create a mosaic attachment object
	// var mosaicAttachment2 = nemSdk.model.objects.create("mosaicAttachment")("nem", "xem", 1000000);

	// Push attachment into transaction mosaics
	// transferTransaction.mosaics.push(mosaicAttachment2);

	var microenergy_units = req_units*1000000;
	console.log("prepare microenergy transaction of: ", microenergy_units);
	// Create the mosaic attachment
	var mosaicAttachment = nemSdk.model.objects.create("mosaicAttachment")(CONFIG.smarthome_config.nem_mciroenergy_mosaic_namespace, CONFIG.smarthome_config.nem_microenergy_mosaic_name, microenergy_units); // Send 1, assuming divisability of 6 digits
	// 100 nw.fiat.eur (divisibility is 2 for this mosaic)

	// Push attachment into transaction mosaics
	transferTransaction.mosaics.push(mosaicAttachment);

	// console.log("transferTransaction:", transferTransaction);
	// Need mosaic definition of nw.fiat:eur to calculate adequate fees, so we get it from network.
	// Otherwise you can simply take the mosaic definition from api manually (http://bob.nem.ninja/docs/#retrieving-mosaic-definitions) 
	// and put it into mosaicDefinitionMetaDataPair model (objects.js) next to nem:xem (be careful to respect object structure)
	return nemSdk.com.requests.namespace.mosaicDefinitions(endpoint, mosaicAttachment.mosaicId.namespaceId).then(function(res) {
		// Look for the mosaic definition(s) we want in the request response (Could use ["eur", "usd"] to return eur and usd mosaicDefinitionMetaDataPairs)
		var neededDefinition = nemSdk.utils.helpers.searchMosaicDefinitionArray(res.data, [CONFIG.smarthome_config.nem_microenergy_mosaic_name]);
		
		// Get full name of mosaic to use as object key
		var fullMosaicName  = nemSdk.utils.format.mosaicIdToName(mosaicAttachment.mosaicId);

		// Check if the mosaic was found
		if(undefined === neededDefinition[fullMosaicName]) return console.error("Mosaic not found !");

		// console.log(neededDefinition);
		// Set eur mosaic definition into mosaicDefinitionMetaDataPair
		mosaicDefinitionMetaDataPair[fullMosaicName] = {};
		mosaicDefinitionMetaDataPair[fullMosaicName].mosaicDefinition = neededDefinition[fullMosaicName];
		// ★ See: https://github.com/QuantumMechanics/NEM-sdk/issues/36#issuecomment-373915795
		// If we want to get the correct supply for a mutable Mosiac, this is necessary
		/*
		nemSdk.com.requests.mosaic.supply(endpoint, fullMosaicName).then(function(res) {
			console.log("SUPPLY:", res.supply);
			mosaicDefinitionMetaDataPair[fullMosaicName].supply = res.supply;
			// Prepare the transfer transaction object
			var transactionEntity = nem.model.transactions.prepare("mosaicTransferTransaction")(common, transferTransaction, mosaicDefinitionMetaDataPair, nem.model.network.data.testnet.id);

			// Serialize transfer transaction and announce
			nem.model.transactions.send(common, transactionEntity, endpoint);
		}, function(err) {
			console.error(err);
		});
		*/

		mosaicDefinitionMetaDataPair[fullMosaicName].supply = neededDefinition[fullMosaicName].properties[1].value;
		console.log("supply: ", mosaicDefinitionMetaDataPair[fullMosaicName].supply);
		// console.log(mosaicDefinitionMetaDataPair);
		// Prepare the transfer transaction object
		var transactionEntity = nemSdk.model.transactions.prepare("mosaicTransferTransaction")(common, transferTransaction, mosaicDefinitionMetaDataPair, nemnet.id);
		
		if (isNaN(transactionEntity.fee)) {
			console.log("Mosaic Transaction Fee is NaN, manually set a minimum fee");
			// var totalFee = nemSdk.model.fees.calculateMosaics(1, mosaicDefinitionMetaDataPair, transferTransaction.mosaics);
			var attachedMosaics = transferTransaction.mosaics;
			var totalFee = 100000; // XXX This is a hack
			console.log("calculated totalFee:", totalFee);
			transactionEntity.fee = totalFee;
		} else {
			console.log("Mosaic Transaction Fee is:", transactionEntity.fee);
		}
		console.log(transactionEntity);
		// XXX Why is the transferTransaction missing a fee???
		// Serialize transfer transaction and announce
		
		return nemSdk.model.transactions.send(common, transactionEntity, endpoint).then(function(res) {
			console.log("transaction sent:", res);
			return res;
		});
		// console.log("sent transaction, result:", result);
	}, 
	function(err) {
		console.error(err);
		return err;
	});
	// return request.body;
}, {success: 200});

//
// Microenergy Utility Methods
// 
// TODO

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
