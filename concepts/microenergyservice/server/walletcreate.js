var nemlib = require('nem-library');

var NEMLibrary = require('nem-library').NEMLibrary;
var NetworkTypes = require('nem-library').NetworkTypes;
var CONFIG = require('./config.json');
var BrainWallet = require("nem-library").BrainWallet;
var BrainPassword = require("nem-library").BrainPassword;
var argv = require('yargs').argv
var fs = require('fs');
var nemSdk = require("nem-sdk").default;

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
var brainpasswordinput = "swatch matcha gas caffe java why cheeze wine pugs italy north seven binary naan workaholics";
if (argv.brainpassword) {
    brainpasswordinput = argv.brainpassword;
}

const newbrainPassword =  new BrainPassword(brainpasswordinput);

const newbrainWallet = BrainWallet.create("brain wallet", newbrainPassword);
var acct = newbrainWallet.open(newbrainPassword);

if (argv.json) {
    var walletobj = {};
    walletobj.privateKey = acct.privateKey;
    walletobj.publicKey = acct.publicKey;
    walletobj.brainpassword = newbrainPassword;
    walletobj.address = acct.address;
    fs.writeFileSync("./wallet.json", new Buffer(JSON.stringify(walletobj)));
    // console.log(JSON.stringify(walletobj));
} else {
    console.log("============Wallet Setup==========");
    console.log("Save the information generated here to a secure piece of paper.  Do not share publicly");
    console.log("New wallet account created:", acct.address);
    console.log("Private Key Begin\n", acct.privateKey);
    console.log("Public Key Begin\n", acct.publicKey);
    console.log("Brainpassword\n", newbrainPassword);
}
// https://github.com/QuantumMechanics/NEM-sdk#94---create-wallet-files
// Create a wallet file encoded from the brain
// Convert stringified wallet object to word array
var wordArray = nemSdk.crypto.js.enc.Utf8.parse(JSON.stringify(newbrainWallet));
console.log("wordArray:", wordArray);
// Word array to base64
var base64wordarray = nemSdk.crypto.js.enc.Base64.stringify(wordArray);

// Write out wallet
fs.writeFileSync("./wallet.wlt", new Buffer(JSON.stringify(base64wordarray)));

