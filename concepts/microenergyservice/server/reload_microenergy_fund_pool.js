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
var nemnode;

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
var microenergy_units = 1;

if (argv.units) {
    microenergy_units = argv.units;
}

console.log("nemnet:", nemnet);

// Create an NIS endpoint object
var endpoint = nemSdk.model.objects.create("endpoint")(nemnode, nemSdk.model.nodes.defaultPort);


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

var reloadmsg = {
    "type": "reload",
    "data": [1,"fish and chips", new Date()]
}
// Create an un-prepared mosaic transfer transaction object (use same object as transfer tansaction)
var transferTransaction = nemSdk.model.objects.create("transferTransaction")(CONFIG.smarthome_config.nem_microenergy_owner_address, 1, JSON.stringify(reloadmsg));

console.log("owner address:", CONFIG.smarthome_config.nem_microenergy_owner_address);

// Create a mosaic attachment object
// var mosaicAttachment2 = nemSdk.model.objects.create("mosaicAttachment")("nem", "xem", 1000000);

// Push attachment into transaction mosaics
// transferTransaction.mosaics.push(mosaicAttachment2);

// Create the mosaic attachment
var mosaicAttachment = nemSdk.model.objects.create("mosaicAttachment")(CONFIG.smarthome_config.nem_mciroenergy_mosaic_namespace, CONFIG.smarthome_config.nem_microenergy_mosaic_name, microenergy_units*1000000); // Send 1, assuming divisability of 6 digits
// 100 nw.fiat.eur (divisibility is 2 for this mosaic)

// Push attachment into transaction mosaics
transferTransaction.mosaics.push(mosaicAttachment);

// console.log("transferTransaction:", transferTransaction);
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
    
    var result = nemSdk.model.transactions.send(common, transactionEntity, endpoint).then(function(res) {
        console.log(res);
    });
    console.log("sent transaction, result:", result);
}, 
function(err) {
	console.error(err);
});