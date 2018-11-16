var nemlib = require('nem-library');

var NEMLibrary = require('nem-library').NEMLibrary;
var NetworkTypes = require('nem-library').NetworkTypes;
var CONFIG = require('./config.json');
var BrainWallet = require("nem-library").BrainWallet;
var BrainPassword = require("nem-library").BrainPassword;
var argv = require('yargs').argv

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

const newbrainPassword =  new BrainPassword(brainpasswordinput)
const newbrainWallet = BrainWallet.create("brain wallet", newbrainPassword);

var acct = newbrainWallet.open(newbrainPassword);
console.log("============Wallet Setup==========");
console.log("Save the information generated here to a secure piece of paper.  Do not share publicly");
console.log("New wallet account created:", acct.address);
console.log("Private Key Begin\n", acct.privateKey);
console.log("Public Key Begin\n", acct.publicKey);
console.log("Brainpassword\n", newbrainPassword);
