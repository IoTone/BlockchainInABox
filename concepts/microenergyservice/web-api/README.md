# Overview

A simple web-api utilizing AWS API Gateway and AWS Lambda, used to handle a simple proxy for a NEM Mosaic Microenergy user's smart home.  The model is to deploy this and it acts as a proxy to a wallet/account on behalf of the Smart Phone application.  Because of some complexity in getting a decent NEM api running on iOS and Android, it is simpler to take this approach. 

NOTE: The original example is based on the claudia web-api example.  It has been modified to include basic wallet loading
and mosaic transactions.  Much of the original example has been removed.

## Setup

NOTE: These instructions from Claudia.js are modified slightly for the demo.  Be sure to read through everything.

A simple example demonstrating how to create and configure a Web REST API connected to a Lambda function with Node.js and Claudia.js. To try it out, first [set up the credentials](https://github.com/claudiajs/claudia/blob/master/getting_started.md#configuring-access-credentials), then:

1. Make a copy of config.json.tpl and sae as config.json.  You will need to modify the configuration for your demonstration use 
of the Microenergy mosaic and addresses.
1.  export AWS_PROFILE=claudia (assuming you have an IAM role setup and configured in .aws/configuration with the label, claudia.)
1. run `npm install` to grab the dependencies
1. run `npm start` to set up the lambda project under the default name on AWS 
1. Check out the API ID in `claudia.json` (the previous step creates the file)
1. Open https://API_ID.execute-api.us-east-1.amazonaws.com/latest/greet?name=Mike in a browser (replace API_ID with the API ID from `claudia.json`)

Check out [web.js](web.js) to see how the paths are set up. For more information, see the [Claudia Api Builder](https://github.com/claudiajs/claudia-api-builder) documentation.

When a version is not provided for the create or update command (as in this case, check out the [package.json](package.json) scripts section), Claudia will automatically create a stage called `latest` for the API, and deploy that using the `$LATEST` Lambda function version. That's where the `/latest/` part of the URL comes from. If a version is provided with the deployment, then an API gateway stage will be created for that name, and connected to the appropriate Lambda version alias. This makes it easy to run several Lambda and API versions at the same time, for development, testing, production etc.

Claudia assigns a generic input processing template to all requests, that just dumps all the available parameters (headers, query string and stage variables) into a JSON object, available to your request handler. You can see the entire request object passed from Api Gateway to Lambda using the /echo path (https://API_ID.execute-api.us-east-1.amazonaws.com/latest/echo?name=Mike).

## Testing

Just run `npm test`.  You can also try thsi out using curl.

Just validate the setup:

- curl -X POST https://APP_ID.execute-api.us-west-2.amazonaws.com/latest/echo

Another dummy test:

- curl -X GET https://APP_ID.execute-api.us-west-2.amazonaws.com/latest/greet?name=Bilbo

Sending use of lighting 

-  curl -X POST -d use=1 https://APP_ID.execute-api.us-west-2.amazonaws.com/latest/use

## Performance

Ideally the lambda package is as small as possible.  We've added a large-ish library and that may affect the initial cold start time.

For example, without the large libraries, 

```
$ time curl -X GET https://APP_ID.execute-api.us-west-2.amazonaws.com/latest/greet?name=Bilbo
"Bilbo is really impeccable"
real    0m0.992s
user    0m0.000s
sys     0m0.031s
```

With the large library, cold start:

```
$ time curl -X GET https://ky2pd7dln4.execute-api.us-west-2.amazonaws.com/latest/greet?name=Bilbo
"Bilbo is really dandy"
real    0m1.266s
user    0m0.031s
sys     0m0.015s
```