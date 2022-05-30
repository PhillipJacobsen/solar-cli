#! /usr/bin/env node
const package = require("../package.json");
const nodeIP = package.nodeIP;      // retrieve ip address of relay node from package.json
const network = package.network;    // retrieve network type (mainnet or testnet) from package.json
const chalk = require("chalk");
const infoColor = chalk.green;
const resultColor = chalk.bgGreen;
const errorColor = chalk.bold.bgRed;
const yargs = require("yargs");

// import Solar and ARK SDK libraries
const Crypto = require("@solar-network/crypto");
const Client = require("@arkecosystem/client");
const Identities = Crypto.Identities;
const Managers = Crypto.Managers;
const Utils = Crypto.Utils;
const Transactions = Crypto.Transactions;
const Connection = Client.Connection;
const client = new Connection(nodeIP);


async function connectRelay() {
    console.log(infoColor("Opening", network, "connection to relay:", nodeIP));
    Managers.configManager.setFromPreset(network);   //set the network (testnet or mainnet)
    const blockchain = await client.get("blockchain");
    Managers.configManager.setHeight(blockchain.body.data.block.height);
    // get current blockchain height
    // const blockchain = await client.get("blockchain");
    // const bridgechainHeight = blockchain.body.data.block.height;
}

(async () => {

    // customize yargs 
    yargs.scriptName("solar-cli")   // without this then --help shows filename [command] instead of app name
        .demandCommand(1)           // require at least 1 command
        .strict()                   // show help menu when invalid command


    yargs.updateStrings({
        "Options:": chalk.green("Options:")
    })

    yargs.updateStrings({
        "Commands:": chalk.green("Commands:")
    })



    /* 
     Command: Get Status of Relay node
    */
    yargs.command({
        command: "relay",
        describe: "Get status of relay node used for accessing blockchain",
        async handler(argv) {
            connectRelay()
            console.log(infoColor("Retrieving relay node status"));
            const response = await client.api("node").status();
            console.log(resultColor("%s"), response.body.data);
        }
    }
    )


    /* 
    Command: Validate an address
    */
    yargs.command({
        command: "validate",
        describe: "Validate a wallet address",
        builder: {
            adr: {
                describe: "Address",
                demandOption: true,
                type: "string"
            }
        },
        handler(argv) {
            console.log(infoColor("Validating address: %s"), argv.adr);
            if (Identities.Address.validate(argv.adr)) {
                console.log(resultColor("Address is valid"));
            } else {
                console.log(resultColor("Address is not valid"));
            }
        }
    })


    /* 
    Command: Get Peers
    */
    yargs.command({
        command: "peers",
        describe: "Get list of peers",
        builder: {
            page: {
                describe: "Page number",
                demandOption: false,
                type: "string"
            }
        },
        async handler(argv) {
            console.log(infoColor("Retrieving Peers"));
            const peers = await client.api("peers").all();
            console.log(peers.body.data);
        }
    }
    )


    /* 
    Command: Get Nonce
    */
    yargs.command({
        command: "nonce",
        describe: "Get nonce of wallet",
        builder: {
            adr: {
                describe: "Address",
                demandOption: true,
                type: "string"
            }
        },
        async handler(argv) {
            connectRelay()
            console.log(infoColor("Retrieving Nonce from wallet %s"), argv.adr);
            const wallet = await client.api("wallets").get(argv.adr);
            const nonce = wallet.body.data.nonce;
            console.log(resultColor("Nonce: %s"), nonce);
        }
    }
    )


    /* 
    Command: Get Balance
    */
    yargs.command({
        command: "balance",
        describe: "Get balance of wallet",
        builder: {
            adr: {
                describe: "Address",
                demandOption: true,
                type: "string"
            }
        },
        async handler(argv) {
            connectRelay()
            console.log(infoColor("Retrieving Balance from wallet %s"), argv.adr);
            const wallet = await client.api("wallets").get(argv.adr);
            const balance = wallet.body.data.balance;
            console.log(resultColor("balance: %s"), balance / 100000000);
        }
    }
    )


    /* 
 Command: Sign message
    */
    yargs.command({
        command: "sign",
        describe: "Sign message using Schnorr algorithm",
        builder: {
            msg: {
                describe: "Message to be signed",
                demandOption: true,
                type: "string"
            },
            passphrase: {
                describe: "Your Private Passphrase(12 words)",
                demandOption: true,
                type: "string"
            },
        },
        handler(argv) {
            console.log(infoColor("Signing message"));
            const message = argv.msg;
            const passphrase = argv.passphrase;
            const keys = Identities.Keys.fromPassphrase(passphrase);
            const hash = Crypto.Crypto.HashAlgorithms.sha256(message);
            const signature = Crypto.Crypto.Hash.signSchnorr(hash, keys);
            const publicKey = Identities.PublicKey.fromPassphrase(passphrase);
            const signed = {
                message,
                signature,
                publicKey
            };
            console.log(signed);
        }
    }
    )


    /* 
 Command: Verify message signature
    */
    yargs.command({
        command: "verify",
        describe: "Verify Signature using Schnorr algorithm",
        builder: {
            msg: {
                describe: "Message that was signed",
                demandOption: true,
                type: "string"
            },
            publicKey: {
                describe: "Public key of sender",
                demandOption: true,
                type: "string"
            },
            signature: {
                describe: "Message Signature",
                demandOption: true,
                type: "string"
            },
        },
        handler(argv) {
            console.log(infoColor("Verifying message"));
            const message = argv.msg;
            const publicKey = argv.publicKey;
            const signature = argv.signature;
            const hash = Crypto.Crypto.HashAlgorithms.sha256(message);
            const verify = Crypto.Crypto.Hash.verifySchnorr(
                hash,
                signature,
                publicKey
            );

            if (verify) {
                console.log(resultColor("Signature is verified"));
            } else {
                console.log(errorColor("Signature is invalid"));
            }
        }
    }
    )


    /* 
    Command: Send transaction
    */
    yargs.command({
        command: "tx",
        describe: "Send transaction with optional smartbridge message",
        builder: {
            adr: {
                describe: "Recipient's Address",
                demandOption: true,
                type: "string"
            },
            passphrase: {
                describe: "Your Private Passphrase(12 words)",
                demandOption: true,
                type: "string"
            },
            smartbridge: {
                describe: "Message to include with transaction(optional)",
                demandOption: false,
                type: "string"
            },

        },
        async handler(argv) {
            connectRelay();

            const passphrase = argv.passphrase;
            const senderWalletAddress = Identities.Address.fromPassphrase(passphrase);
            const recipientWalletAddress = argv.adr;

            // Step 1: Retrieve the nonce of the sender wallet and increment
            const senderWallet = await client.api("wallets").get(senderWalletAddress);
            const senderNonce = Utils.BigNumber.make(senderWallet.body.data.nonce).plus(1);
            let transaction = {};

            // Step 2: Create and Sign the transaction
            if ('smartbridge' in argv) {
                console.log("smartbridge exists");
                transaction = Transactions.BuilderFactory.transfer()
                    .version(3)
                    .nonce(senderNonce.toFixed())
                    .recipientId(recipientWalletAddress)
                    .amount(1)
                    .fee(3000000)
                    .vendorField(argv.smartbridge)
                    .sign(passphrase);
            } else {
                console.log("smartbridge does not exist");
                transaction = Transactions.BuilderFactory.transfer()
                    .version(3)
                    .nonce(senderNonce.toFixed())
                    .recipientId(recipientWalletAddress)
                    .amount(1)
                    .fee(3000000)
                    .sign(passphrase);
            }

            // Step 3: Broadcast the transaction
            console.log(infoColor("Sending transaction..."));
            const broadcastResponse = await client.api("transactions").create({ transactions: [transaction.build().toJson()] });
            //console.log(broadcastResponse);
            //console.log(JSON.stringify(broadcastResponse.body.data, null, 4))
            if (broadcastResponse.status == 200) {
                const accept = broadcastResponse.body.data.accept;
                if (!(accept.length === 0)) {
                    const txid = broadcastResponse.body.data.accept[0];
                    console.log(resultColor("Transaction ID: %s"), txid);
                } else {
                    var invalidID = broadcastResponse.body.data.invalid[0];
                    var errormessage = broadcastResponse.body.errors[invalidID].message;
                    console.log(errorColor("Error Message: %s"), errormessage);
                }
            } else {
                console.log(errorColor("Error sending. Status code: %s"), broadcastResponse.status);
            }
        }
    }
    )




    yargs.parse()
})();
