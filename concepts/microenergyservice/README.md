# Overview

The Microenergy Service concept shows off ideas discussed in issue #2 : https://github.com/IoTone/BlockchainInABox/issues/2

## Architecture

Imagine a world where every home has a budget assigned to each inhabitant. Let's say the budget is X Kw/H per person. To use something like lighting, a TV, washer (anything that has a temporary use model) the user as a NEM pool they are allocated at the start of every day. This budget, let's say for arguments sake, is 10NEM. That has roughly a $1 value in the real world. This budget goes into a smart contract pool assigned to the user's account/wallet. The funds get released from the budget pool assigned to the inhabitant back to the house account/wallet pool, upon request by the user to use a specific appliance or energy consuming device. In our real world example, we will limit this use model to a lamp. We can assume a light uses Y amount of Kw/H and this can be done in a way that the user requests how long they need the lighting for, not how much NEM to spend. So if the user says 10 minutes, lighting stays on for 10 minutes, and the amount of the daily energy meter rate is pegged to in terms of NEM is deducted, prorated for 10 minutes instead of an entire hour. The user never actually gets to receive the funds directly. This is a clever trick in the smart contract. The budget pool is created by the power company from the user's own paid services every month. To encourage conservation, the pools exist to force home inhabitants to think about energy use. By saving their surplus gets rewarded by some method, one could imagine lower rates as an easy one (i.e. lower consumption === better discounts on the daily energy meter rate peg, meaning a user can pick a time to use more later.

Because the same pool of NEM funds just moves back and forth inside the smart contract for the user and the house, it more or less "conserves" and doesn't cost much to operate. The net savings should exceed the cost of network fees. (Actual research in this topic should prove out if this is true or not). The energy company in theory would replenish the daily house's energy budget pool to keep the level steady. Should the price of NEM fluctuate during a day, it shouldn't matter because the metered rate change will simply change.

There should be a web api to enable publication of the total energy consumed per user, blockchain verifiable transactions, and the current metered rate, as well as a summary of fees paid.

Larger goals:

    We want to show the user of smart contracts in a practical, non-abstract way
    We want to use NEM to show off it's power
    We want to learn more about cost of network fees in practice, and practicality of using smart contracts
    We want to encourage green energy approaches to solve problems, and this is a novel way to get participation in conservation. It may be possible to apply these concepts to businesses, coperative IoT services, etc.


## Setup

- Node.js 8.x
- A network
- NEM (you'll need access to a namespace and a mosaic).  All of this is configurable
- do npm install

For the first run, set up a wallet:
- node walletcreate.js
- Optionally, you should provide a brainwallet as input to ensure a secure and unique wallet id:
node walletcreate.s --brainpassword="all my great passwords are in my brain wallet including this should be at least twelve random words"
