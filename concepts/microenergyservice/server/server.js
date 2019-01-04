// Load nem-browser library
var nemSdk = require("nem-sdk").default;
let huejay = require('huejay');
var CONFIG = require('./config.json');

var huebridges = [];

// see: https://github.com/sqmk/huejay#clientuserscreate---create-user
var hue_username = CONFIG["smarthome_config"].hue_username;
var hue_client;

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
                        var qty = mosaics[0].quantity/1000000.0;
                        try {
                            var microenergy_msg = JSON.parse(nemSdk.utils.format.hexToUtf8(transmsg_payload));
                            console.log("mosaic qty: " + qty + ", handling use type microenergy message: ", microenergy_msg);
                            if (microenergy_msg && microenergy_msg.type === "use") {
                                //
                                // Handle smart home use type message
                                //
                                // data format: ["service id", timestamp, units, {payload}]
                                // console.log("handling use time of " + + " for service id:  " + );
                                var utilization_time_in_millis = compute_microenergy_use_time_in_millis(qty, CONFIG["smarthome_config"].nem_microenergy_rate_plan, 0);
                                console.log("Activating service(s) for " + utilization_time_in_millis + "ms");
                                hueCmd(CONFIG.smarthome_config["smarthome_services_udm"].udm_devices[0].udm_key, "udm_capability_x:OnOff:_", [1]);
                                setTimeout(function() {
                                    hueCmd(CONFIG.smarthome_config["smarthome_services_udm"].udm_devices[0].udm_key, "udm_capability_x:OnOff:_", [0]);
                                }, utilization_time_in_millis);
                            }
                        } catch(err) {
                            console.error("Error handling incoming microenergy message, reason:", err);
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

/**
 * microenergy_units: the number of mosaic units sent
 * rate_plan: the rate plan used to compute cost/utlization time
 * energy_savings_factor: a value less than 1, used to compute discounted utilization time, wih 1 meaning 100% efficiency
 * and 0 meaning 0% efficiency.  By efficiency, we mean the % of time we cut from utilization.  So a 75% efficient (0.75) would
 * mean we are cutting 75% of the time computed, using less or consuming less.  A value of 0 would not factor into the 
 * utilization time computed.  The idea is that a "green" setting might improve efficiency through reduction of time used.
 * 
 * returns: number of milliseconds of utilization
 */
function compute_microenergy_use_time_in_millis(microenergy_units, rate_plan, energy_savings_factor) {
    if (!microenergy_units) {
        return 0;
    } else if (microenergy_units <= 0) {
        return 0;
    } else {
        if (!rate_plan) {
            rate_plan = "A";
        }

        if (!energy_savings_factor) {
            energy_savings_factor = 0;
        }

        var rate_factor = CONFIG["smarthome_config"].nem_microenergy_rate_plans[rate_plan];

        var utlization_time = rate_factor*microenergy_units;

        if (energy_savings_factor > 0) {
            return (utlization_time-(utlization_time*energy_savings_factor));
        } else {
            return utlization_time;
        }
        
    }
}

//
// Hue Specific Functions
//
function kickstart() {
    huejay.discover({ strategy: 'upnp' })
        .then(bridges => {
            for (let bridge of bridges) {
                huebridges.push(bridge.ip);
                console.log(`Id: ${bridge.id}, IP: ${bridge.ip}`);
            }
            if (huebridges.length > 0) {
                console.log("About to startup Hue Client");
                hueStartup();
            } else {
                console.error("Unable to startup hue discovery, retry");
                kickstart();
            }
        })
        .catch(error => {
            console.log(`An error occurred: ${error.message}`);
        });
}

function hueStartup() {
    console.log("Startup " + huebridges);
    hue_client = new huejay.Client({
        host: huebridges[0], // XXX Always assume only one
        port: 80, // Optional
        username: hue_username, // Optional
        timeout: 15000, // Optional, timeout in milliseconds (15000 is the default)
    });

    // Perform a reset
    /*
    "smarthome_services_udm": {
        "udm_version":"0.9.1",
        "udm_devices": [
            {
                "udm_key": "0",
    */
    setTimeout(function() {
        hueCmd(CONFIG.smarthome_config["smarthome_services_udm"].udm_devices[0].udm_key, "udm_capability_x:OnOff:_", [0]);
    }, 10000);
    
}

function hueCmd(udm_device_id, udm_capability, data) {
    /**
     * For example, if we get a message to change hue level:
     * 00: 2 udm_capability_value_not_applicable_x 1:udm_capability_x:Hue:_ 69
     * Assume some things:
     *
     * - 00: is always going to be the UDM Request command, so we can assume that it's a valid UDM request
     * command
     *
     * NOTE: The code below will fail if incoming messages are malformed.
     */
    try {
        udm_value = data[0];

        //
        // Now, a massive switch statement or if-else can work here
        // Typically we'd always want to double check if the value has changed at all
        // before performing any update
        //
        if (udm_capability === "udm_capability_x:Hue:_") {
            //
            // It's changing the hue, but we have to know the format of the incoming value
            // It will be a HEX value, between 0-255, so we need to convert it for our purposes
            // to whatever HUE is expecting.
            //
            // The incoming HUE value will be using the HSLA color model
            // We want to convert it to our color
            // See: http://stackoverflow.com/a/22564849/796514
            // Convert the Hex value to a number, scale to be 0-360
            // and then multiply by 182.04
            // XXX Double check my math
            var scaled_value = udm_value;

            hue_client.lights.getAll()
                .then(lights => {
                    lights.map(light => {
                    light.hue = scaled_value;
                    light.saturation = parseInt((scaled_value/100)*250);
                    light.brightness = parseInt((scaled_value/100)*250);
                    hue_client.lights.save(light)

                    .then(light => {
                        console.log(`Updated light [${light.id}]`);
                        })
                    })
                    // light.name = 'New light name';
                    // light.brightness = 254;
                    // light.hue = scaled_value;
                    // // light.saturation = 254;
                    // return client.lights.save(light);
                })
                // .then(light => {
                //     console.log(`Updated light [${light.id}]`);
                // })
                .catch(error => {
                    console.log('Something went wrong');
                    console.log(error.stack);
                });
        } else if (udm_capability === "udm_capability_x:OnOff:_") {

            var light_state;

            if (udm_value === 1) {
            light_state = true;
            } else if (udm_value === 0) {
            light_state = false;
            }

            hue_client.lights.getAll()
                .then(lights => {
                lights.map(light => {
                    light.on = light_state;
                    hue_client.lights.save(light)

                    .then(light => {
                        console.log(`Updated light [${light.id}]`);
                    })
                })
                    // light.name = 'New light name';
                    // light.brightness = 254;
                    // light.hue = scaled_value;
                    // // light.saturation = 254;
                    // return client.lights.save(light);
                })

        } else {
            console.error("Unhandled capability " + udm_capability + ", ignoring");
        }
    } catch (err) {
        console.error("Something bad happend on inbox message, reason:", err);
    }
}

kickstart();