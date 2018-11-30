var nemlib = require('nem-library');

var NEMLibrary = require('nem-library').NEMLibrary;
var NetworkTypes = require('nem-library').NetworkTypes;
var CONFIG = require('./config.json');
var BrainWallet = require("nem-library").BrainWallet;
var BrainPassword = require("nem-library").BrainPassword;
var argv = require('yargs').argv
var fs = require('fs');
var nemSdk = require("nem-sdk").default;
var walletLoad = fs.readFileSync("./wallet.wlt");

if (CONFIG.nem_net === "mainnet") {
    NEMLibrary.bootstrap(NetworkTypes.MAIN_NET);
} else if (CONFIG.nem_net === "testnet") {
    NEMLibrary.bootstrap(NetworkTypes.TEST_NET);
} else if (CONFIG.nem_net === "mijinnet") {
    NEMLibrary.bootstrap(NetworkTypes.MIJIN_NET);
} else {
    // Default to main
    NEMLibrary.bootstrap(NetworkTypes.MAIN_NET);
}

var decodedArray = walletLoad.toString('utf8');

var wallet;

try {
    wallet = BrainWallet.readFromWLT(decodedArray);
    console.log(wallet);
} catch(error) {
    console.error(error);
}

/*

var decodedArray = walletLoad.toString('utf8');
var decodedWordArray = nemSdk.crypto.js.enc.Utf8.parse(JSON.stringify(newbrainWallet));

// Create a common object holding key
// var common = nem.model.objects.create("common")("", "Private key");

// Create a mosaic transfer from Address A to Address B

// Create a common object
var common = nem.model.objects.create("common")("walletPassword/passphrase", "");

// Get the wallet account to decrypt
var walletAccount = wallet.accounts[index];

// Decrypt account private key 
nem.crypto.helpers.passwordToPrivatekey(common, walletAccount, wallet.algo);

// The common object now has a private key
console.log(common)
*/