// Load nem-browser library
var nemSdk = require("nem-sdk").default;

var CONFIG = require('./config.json');

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
console.log(nemnode);

// Create an NIS endpoint object
var endpoint = nemSdk.model.objects.create("endpoint")(nemnode, nemSdk.model.nodes.websocketPort);
console.log(endpoint);
// Address to subscribe
var usesrvraddr = CONFIG.smarthome_config["nem_microenergy_server_address"];

// Create a connector object
var connector = nemSdk.com.websockets.connector.create(endpoint, usesrvraddr);

// Set start date of the monitor
var date = new Date();

// Show event
console.log(date.toLocaleString() +': Starting monitor...');

// Try to establish a connection
connect(connector);

// Connect using connector
function connect(connector){
    return connector.connect().then(function() {
    	// Set time
    	date = new Date();

        // If we are here, we are connected
    	console.log(date.toLocaleString()+': Connected to: '+ connector.endpoint.host);
    	
        // Show event
    	console.log( date.toLocaleString()+': Subscribing to errors');

        // Subscribe to errors channel
        nemSdk.com.websockets.subscribe.errors(connector, function(res){
            // Set time
            date = new Date();
            // Show event
            console.log(date.toLocaleString()+': Received error');
            // Show data
            console.log(date.toLocaleString()+': ' + JSON.stringify(res));
        });

        // Show event
    	console.log(date.toLocaleString()+': Subscribing to new blocks');

        // Subscribe to new blocks channel
        nemSdk.com.websockets.subscribe.chain.blocks(connector, function(res){
            // Set time
            date = new Date();
            // Show event
            console.log(date.toLocaleString()+': Received a new block');
            // Show data
            console.log(date.toLocaleString()+': ' + JSON.stringify(res) +'');
        });

        // Show event
    	console.log(date.toLocaleString()+': Subscribing to recent transactions');

        // Subscribe to recent transactions channel
        nemSdk.com.websockets.subscribe.account.transactions.recent(connector, function(res){
            // Set time
            date = new Date();
            // Show event
            console.log(date.toLocaleString()+': Received recent transactions');
            // Show data
            console.log(date.toLocaleString()+': ' + JSON.stringify(res));
        });

        // Show event
    	console.log(date.toLocaleString()+': Subscribing to account data of '+ connector.address);

        // Subscribe to account data channel
        nemSdk.com.websockets.subscribe.account.data(connector, function(res) {
            // Set time
            date = new Date();
            // Show event
            console.log(date.toLocaleString()+': Received account data');
            // Show data
            console.log(date.toLocaleString()+': ' + JSON.stringify(res));
        });

        // Show event
    	console.log(date.toLocaleString()+': Subscribing to unconfirmed transactions of '+ connector.address);

        // Subscribe to unconfirmed transactions channel
        nemSdk.com.websockets.subscribe.account.transactions.unconfirmed(connector, function(res) {
            // Set time
            date = new Date();
            // Show event
            console.log(date.toLocaleString()+': Received unconfirmed transaction');
            // Show data
            console.log(date.toLocaleString()+': ' + JSON.stringify(res));
        });

        // Show event
    	console.log(date.toLocaleString()+': Subscribing to confirmed transactions of '+ connector.address);

        // Subscribe to confirmed transactions channel
        nemSdk.com.websockets.subscribe.account.transactions.confirmed(connector, function(res) {
            // Set time
            date = new Date();
            // Show event
            console.log(date.toLocaleString()+': Received confirmed transaction');
            // Show data
            console.log(date.toLocaleString()+': ' + JSON.stringify(res));
        });
        
        // Show event
    	console.log(date.toLocaleString()+': Requesting account data of '+ connector.address);

        // Request account data
        nemSdk.com.websockets.requests.account.data(connector);

        // Show event
    	console.log(date.toLocaleString()+': Requesting recent transactions of '+ connector.address);

        // Request recent transactions
        nemSdk.com.websockets.requests.account.transactions.recent(connector);

    }, function(err) {
        // Set time
        date = new Date();
        // Show event
        console.log(date.toLocaleString()+': An error occured');
        // Show data
        console.log(date.toLocaleString()+': ' + JSON.stringify(err));
        // Try to reconnect
        reconnect();
    });
}

function reconnect() {
    // Replace endpoint object
    // XXX Why would they do it this way specifically to connect to a different service endpoint?
    // endpoint = nemSdk.model.objects.create("endpoint")("http://bob.nemSdk.ninja", 7778);
    endpoint = nemSdk.model.objects.create("endpoint")(nemnode,  nemSdk.model.nodes.websocketPort);

    // Replace connector
    connector = nemSdk.com.websockets.connector.create(endpoint, usesrvraddr);
    // Set time
    date = new Date();
    // Show event
    console.log(date.toLocaleString()+': Trying to connect to: '+ endpoint.host);
    // Try to establish a connection
    connect(connector);
}
