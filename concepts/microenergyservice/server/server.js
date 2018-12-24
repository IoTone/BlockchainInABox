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

var ns = CONFIG["smarthome_config"].nem_mciroenergy_mosaic_namespace;
var mosaic = CONFIG["smarthome_config"].nem_microenergy_mosaic_name;

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
            // console.log(date.toLocaleString()+': ' + JSON.stringify(res) +'');
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
            //
            // Filter out any messages intended for the server, nem_microenergy_server_address
            // And parse out message type from the payload
            //
            /*
            {
                "meta": {
                    "innerHash": {},
                    "id": 0,
                    "hash": {
                        "data": "cf3564f31fab7b6748f761e5c6bdc0f7b5b7920b8008dda5fa6e1bb2aa844c5b"
                    },
                    "height": 1950085
                },
                "transaction": {
                    "timeStamp": 118040949,
                    "amount": 1000000,
                    "signature": "f2d2b8c5ee9cd469bdcec94c82b8c4ad1e8cddce8fc06ba54b1367c3d605a2718cc0242a87dbcf781b7d69d4468cd87812e60fc22e414956060766665539590f",
                    "fee": 100000,
                    "recipient": "NBD7U6AIHFL7J2SOFKGF7WIPYK7D6SON7R7MNPSC",
                    "mosaics": [{
                        "quantity": 1000000,
                        "mosaicId": {
                            "namespaceId": "microenergy",
                            "name": "ns_demo_mfp"
                        }
                    }],
                    "type": 257,
                    "deadline": 118127349,
                    "message": {
                        "payload": "7b2274797065223a202274657374222c2022666f6f223a20317d",
                        "type": 1
                    },
                    "version": 1744830466,
                    "signer": "c880e3a8f1578f3f726fe06f44ef4f9330ba98f6cc5f9f5c88d7dac70387fc1f"
                }
            }
            */
           if (res.transaction) {
                // Check the mosaic
                var mosaics = res.transaction.mosaics;
                if (mosaics && mosaics[0].mosaicId.namespaceId === ns && mosaics[0].mosaicId.name === mosaic) {
                    var transmsg_payload = res.transaction.message.payload;
                    if (res.transaction.recipient === usesrvraddr) {
                        // We've received a Microenergy transaction from a user
                        // Parse out the message
                        var qty = mosaics[0].quantity;
                        try {
                            var microenergy_msg = JSON.parse(nemSdk.utils.format.hexToUtf8(transmsg_payload));
                            if (microenergy_msg && microenergy_msg.type === "use") {
                                //
                                // Handle smart home use type message
                                //
                                // data format: ["service id", timestamp, units, {payload}]
                                console.log("mosaic qty: " + qty + ", handling use type microenergy message: ", microenergy_msg);
                            }
                        } catch(err) {
                            console.error("Failure to parse incoming microenergy message");
                        }
                    } else {
                        // We sent out a transaction
                    }
                    
                   //
                   // If we are the recipient, then we can finalize the lighting change
                   //
                }
           }
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
