// var nemlib = require('nem-library');

var NEMLibrary = require('nem-library').NEMLibrary;
var NetworkTypes = require('nem-library').NetworkTypes;
var CONFIG = require('./config.json');
var BrainWallet = require("nem-library").BrainWallet;
var BrainPassword = require("nem-library").BrainPassword;
var argv = require('yargs').argv
var fs = require('fs');
var nemSdk = require("nem-sdk").default;
var walletPriv = require('./wallet.json');
var walletLoad = fs.readFileSync("./wallet.wlt");
var nemnet;

if (CONFIG.nem_net === "mainnet") {
    NEMLibrary.bootstrap(NetworkTypes.MAIN_NET);
    nemnet = nemSdk.model.network.data.mainnet;
} else if (CONFIG.nem_net === "testnet") {
    NEMLibrary.bootstrap(NetworkTypes.TEST_NET);
    nemnet = nemSdk.model.network.data.testnet;
} else if (CONFIG.nem_net === "mijinnet") {
    NEMLibrary.bootstrap(NetworkTypes.MIJIN_NET);
    nemnet = nemSdk.model.network.data.mijin;
} else {
    // Default to main
    NEMLibrary.bootstrap(NetworkTypes.MAIN_NET);
    nemnet = nemSdk.model.network.data.mainnet;
}

console.log("nemnet:", nemnet);

// Create an NIS endpoint object
var endpoint = nemSdk.model.objects.create("endpoint")(nemSdk.model.nodes.defaultMainnet, nemSdk.model.nodes.defaultPort);


var decodedArray = walletLoad.toString('utf8');

var wallet;

try {
    wallet = BrainWallet.readFromWLT(decodedArray);
    console.log(wallet);
} catch(error) {
    console.error(error);
}

// unlock privatekey
var common = walletPriv; // wallet.unlockPrivateKey(walletPriv.brainpassword);

//
// Create variable to store our mosaic definitions, needed to calculate fees properly (already contains xem definition)
var mosaicDefinitionMetaDataPair = nemSdk.model.objects.get("mosaicDefinitionMetaDataPair");

// Create an un-prepared mosaic transfer transaction object (use same object as transfer tansaction)
var transferTransaction = nemSdk.model.objects.create("transferTransaction")(CONFIG.smarthome_config.nem_microenergy_owner_address, 1, "Hello");

console.log("owner address:", CONFIG.smarthome_config.nem_microenergy_owner_address);

// Create the mosaic attachment
var mosaicAttachment = nemSdk.model.objects.create("mosaicAttachment")(CONFIG.smarthome_config.nem_mciroenergy_mosaic_namespace, CONFIG.smarthome_config.nem_microenergy_mosaic_name, 1000000); // 100 nw.fiat.eur (divisibility is 2 for this mosaic)

// Push attachment into transaction mosaics
transferTransaction.mosaics.push(mosaicAttachment);

// Need mosaic definition of nw.fiat:eur to calculate adequate fees, so we get it from network.
// Otherwise you can simply take the mosaic definition from api manually (http://bob.nem.ninja/docs/#retrieving-mosaic-definitions) 
// and put it into mosaicDefinitionMetaDataPair model (objects.js) next to nem:xem (be careful to respect object structure)
nemSdk.com.requests.namespace.mosaicDefinitions(endpoint, mosaicAttachment.mosaicId.namespaceId).then(function(res) {
	// Look for the mosaic definition(s) we want in the request response (Could use ["eur", "usd"] to return eur and usd mosaicDefinitionMetaDataPairs)
	var neededDefinition = nemSdk.utils.helpers.searchMosaicDefinitionArray(res.data, [CONFIG.smarthome_config.nem_microenergy_mosaic_name]);
	
	// Get full name of mosaic to use as object key
	var fullMosaicName  = nemSdk.utils.format.mosaicIdToName(mosaicAttachment.mosaicId);

	// Check if the mosaic was found
	if(undefined === neededDefinition[fullMosaicName]) return console.error("Mosaic not found !");

    
	// Set eur mosaic definition into mosaicDefinitionMetaDataPair
	mosaicDefinitionMetaDataPair[fullMosaicName] = {};
	mosaicDefinitionMetaDataPair[fullMosaicName].mosaicDefinition = neededDefinition[fullMosaicName];
    console.log(mosaicDefinitionMetaDataPair);
	// Prepare the transfer transaction object
	var transactionEntity = nemSdk.model.transactions.prepare("mosaicTransferTransaction")(common, transferTransaction, mosaicDefinitionMetaDataPair, nemnet.id);
    console.log(transactionEntity);
	// Serialize transfer transaction and announce
    var result = nemSdk.model.transactions.send(common, transactionEntity, endpoint).then(function(res) {
        console.log(res);
    });
    console.log("sent transaction, result:", result);
}, 
function(err) {
	console.error(err);
});