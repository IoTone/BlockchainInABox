// var nem = require('nem-library');
var NEMLibrary = require('nem-library').NEMLibrary;
var NetworkTypes = require('nem-library').NetworkTypes;
var CONFIG = require('./config.json');
var BrainWallet = require("nem-library").BrainWallet;
var BrainPassword = require("nem-library").BrainPassword;
var argv = require('yargs').argv
var fs = require('fs');
var nemSdk = require("nem-sdk").default;
var usens = CONFIG.smarthome_config["nem_mciroenergy_mosaic_namespace"];
var usemosaic = CONFIG.smarthome_config["nem_microenergy_mosaic_name"];
var usesrvraddr = CONFIG.smarthome_config["nem_microenergy_server_address"];
var usesmoaicowner = CONFIG.smarthome_config["nem_microenergy_owner_address"];
// var walletLoad = fs.readFileSync("./wallet.wlt");

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
// Create an NIS endpoint object
var endpoint = nemSdk.model.objects.create("endpoint")(nemnode, nemSdk.model.nodes.defaultPort);

// Get namespace info
nemSdk.com.requests.namespace.info(endpoint, usens).then(function(res) {
	console.log("\nNamespace info:");
	console.log(res);
}, function(err) {
	console.error(err);
});

// Get mosaic definitions of a namespace or sub-namespace
nemSdk.com.requests.namespace.mosaicDefinitions(endpoint, usens).then(function(res) {
	console.log("\nMosaic definitions:");
    // console.log(res);
    if (! res.data.error) {
        res.data.forEach(function(mosaic) {
            console.log("meta: ", mosaic.meta);
            console.log("mosaic: ", mosaic.mosaic);
        });
    } else {
        console.error(res.data);
    }
}, function(err) {
	console.error(err);
});

// Get namespaces owned by account
nemSdk.com.requests.account.namespaces.owned(endpoint, usesmoaicowner).then(function(res) {
	console.log("\nNamespaces of account:");
	console.log(res);
}, function(err) {
	console.error(err);
});

nemSdk.com.requests.account.transactions.all(endpoint, usesrvraddr).then(function(res) {
	console.log("\nAll transactions of the account:");
    // console.log(res);
    if (! res.data.error) {
        res.data.forEach(function(transaction) {
            console.log("meta: ", transaction.meta);
            console.log("transaction: ", transaction.transaction);
        });
    } else {
        console.error(res.data);
    }
}, function(err) {
	console.error(err);
});
