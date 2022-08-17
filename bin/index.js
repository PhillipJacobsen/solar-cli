#! /usr/bin/env node
const package = require("../package.json");
const isIPFS = require("is-ipfs")   // used for verifying valid IPFS hash
const nodeIP = package.nodeIP;      // retrieve ip address of relay node from package.json
const network = package.network;    // retrieve network type (mainnet or testnet) from package.json
const chalk = require("chalk");
const infoColor = chalk.green;
const resultColor = chalk.bgGreen;
const errorColor = chalk.bold.bgRed;
const yargs = require("yargs");

// import Solar and ARK SDK libraries

// "@solar-network/crypto": "^4.0.0-next.0",
const Crypto = require("@solar-network/crypto");    // https://www.npmjs.com/package/@solar-network/crypto
const Client = require("@arkecosystem/client");     // https://www.npmjs.com/package/@arkecosystem/client
const Identities = Crypto.Identities;
const Managers = Crypto.Managers;
const Utils = Crypto.Utils;
const Transactions = Crypto.Transactions;
const Connection = Client.Connection;
const client = new Connection(nodeIP);


async function connectRelay() {
    console.log(infoColor("Opening", network, "connection to relay:", nodeIP));

    Managers.configManager.setFromPreset(network);   //set the network (testnet or mainnet)
    try {
        const blockchain = await client.get("blockchain");
        Managers.configManager.setHeight(blockchain.body.data.block.height);
        return true

    } catch (err) {
        console.log(errorColor(err));
        console.log(errorColor("Cannot connect to relay node"));
        return false
    }
    // const blockchain = await client.get("blockchain").catch(handleError);
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
            console.log(infoColor("Retrieving relay node status"));

            if (await connectRelay()) {
                try {
                    const response = await client.api("node").status();
                    console.log(resultColor("%s"), response.body.data);
                } catch (err) {
                    console.log(errorColor(err));
                    console.log(errorColor("Cannot retrieve node status"))
                }
            } else {

            }
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

            if (await connectRelay()) {
                try {
                    const peers = await client.api("peers").all();
                    //console.log(peers.body.data);
                    console.log(JSON.stringify(peers.body, null, 4))
                } catch (err) {
                    console.log(errorColor(err));
                    console.log(errorColor("Cannot retrieve peer list"))
                }
            } else {

            }
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
            console.log(infoColor("Retrieving Nonce from wallet %s"), argv.adr);

            if (await connectRelay()) {
                try {
                    const wallet = await client.api("wallets").get(argv.adr);
                    const nonce = wallet.body.data.nonce;
                    console.log(resultColor("Nonce: %s"), nonce);
                } catch (err) {
                    console.log(errorColor(err));
                    console.log(errorColor("Cannot retrieve nonce"))
                }
            } else {

            }

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
            console.log(infoColor("Retrieving Balance from wallet %s"), argv.adr);

            if (await connectRelay()) {
                try {
                    const wallet = await client.api("wallets").get(argv.adr);
                    const balance = wallet.body.data.balance;
                    console.log(resultColor("balance: %s"), balance / 100000000);
                } catch (err) {
                    console.log(errorColor(err));
                    console.log(errorColor("Cannot retrieve balance"))
                }
            } else {
            }
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
        describe: "Send transaction with optional Memo message",
        builder: {
            adr: {
                describe: "Recipient's Address",
                demandOption: true,
                type: "string"
            },
            amt: {
                describe: "Amount of coins to send",
                demandOption: true,
                type: "string"
            },
            fee: {
                describe: "Transaction Fee",
                demandOption: true,
                type: "string"
            },
            passphrase: {
                describe: "Your Private Passphrase(12 words)",
                demandOption: true,
                type: "string"
            },
            memo: {
                describe: "Message to include with transaction(optional)",
                demandOption: false,
                type: "string"
            },

        },
        async handler(argv) {

            if (!(await connectRelay())) {
                return
            }

            const passphrase = argv.passphrase;
            const senderWalletAddress = Identities.Address.fromPassphrase(passphrase);
            const recipientWalletAddress = argv.adr;
            const amount = argv.amt;

            // Step 1: Retrieve the nonce of the sender wallet and increment
            let senderNonce;
            try {
                const senderWallet = await client.api("wallets").get(senderWalletAddress);
                senderNonce = Utils.BigNumber.make(senderWallet.body.data.nonce).plus(1);
            } catch (err) {
                console.log(errorColor(err));
                console.log(errorColor("Cannot retrieve nonce"))
            }

            let transaction = {};

            // Step 2: Create and Sign the transaction
            if ('memo' in argv) {
                //   console.log("Memo exists");
                transaction = Transactions.BuilderFactory.transfer()
                    .nonce(senderNonce.toFixed())
                    .recipientId(recipientWalletAddress)
                    .amount(amount)
                    .fee(argv.fee)
                    .memo(argv.memo)
                    .sign(passphrase);
            } else {
                //    console.log("Memo does not exist");
                transaction = Transactions.BuilderFactory.transfer()
                    .nonce(senderNonce.toFixed())
                    .recipientId(recipientWalletAddress)
                    .amount(amount)
                    .fee(argv.fee)
                    .sign(passphrase);
            }

            // Step 3: Broadcast the transaction
            console.log(infoColor("Sending transaction..."));
            const broadcastResponse = await client.api("transactions").create({ transactions: [transaction.build().toJson()] });
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




    /* 
    Command: Send IPFS transaction
    */
    yargs.command({
        command: "tx-ipfs",
        describe: "Send IPFS transaction with optional Memo message",
        builder: {
            hash: {
                describe: "IPFS Hash",
                demandOption: true,
                type: "string"
            },
            fee: {
                describe: "Transaction Fee",
                demandOption: true,
                type: "string"
            },
            passphrase: {
                describe: "Your Private Passphrase(12 words)",
                demandOption: true,
                type: "string"
            },
            memo: {
                describe: "Message to include with transaction(optional)",
                demandOption: false,
                type: "string"
            },

        },
        async handler(argv) {

            if (!(await connectRelay())) {
                return
            }
            const passphrase = argv.passphrase;
            const senderWalletAddress = Identities.Address.fromPassphrase(passphrase);
            const ipfsHash = argv.hash;

            // verify if Hash is valid
            if (!(isIPFS.cid(ipfsHash))) {
                console.log(errorColor("Not a valid IPFS hash"));
                return
            }

            // Step 1: Retrieve the nonce of the sender wallet and increment
            let senderNonce;
            try {
                const senderWallet = await client.api("wallets").get(senderWalletAddress);
                senderNonce = Utils.BigNumber.make(senderWallet.body.data.nonce).plus(1);
            } catch (err) {
                console.log(errorColor(err));
                console.log(errorColor("Cannot retrieve nonce"))
            }

            let transaction = {};

            // Step 2: Create and Sign the transaction
            if ('memo' in argv) {
                //console.log("Memo exists");
                transaction = Transactions.BuilderFactory.ipfs()
                    .nonce(senderNonce.toFixed())
                    .ipfsAsset(ipfsHash)
                    .fee(argv.fee)
                    .memo(argv.memo)
                    .sign(passphrase);
            } else {
                // console.log("Memo does not exist");
                transaction = Transactions.BuilderFactory.ipfs()
                    .nonce(senderNonce.toFixed())
                    .ipfsAsset(ipfsHash)
                    .fee(argv.fee)
                    .sign(passphrase);
            }

            // Step 3: Broadcast the transaction
            console.log(infoColor("Sending transaction..."));
            const broadcastResponse = await client.api("transactions").create({ transactions: [transaction.build().toJson()] });
            // console.log(JSON.stringify(broadcastResponse.body, null, 4))
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





   /* 
    Command: Vote 
    */
    yargs.command({
        command: "vote",
        describe: "Send a vote transaction",
        builder: {
            delegate: {
                describe: "'JSON encoded Delegate Vote Asset'",
                demandOption: true,
                type: "string"
            },
            fee: {
                describe: "Transaction Fee",
                demandOption: true,
                type: "string"
            },
            passphrase: {
                describe: "Your Private Passphrase(12 words)",
                demandOption: true,
                type: "string"
            },
            memo: {
                describe: "Message to include with transaction(optional)",
                demandOption: false,
                type: "string"
            },

        },
        async handler(argv) {

            if (!(await connectRelay())) {
                return
            }
            const passphrase = argv.passphrase;
            const senderWalletAddress = Identities.Address.fromPassphrase(passphrase);
            let delegate = argv.delegate;
            console.log(resultColor(delegate));
            delegate = delegate.replace(/(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9]+)(['"])?:/g, '$1"$3":');      //create proper json that was stripped away by commmand line preprocessor

            // Step 1: Retrieve the nonce of the sender wallet and increment
            let senderNonce;
            try {
                const senderWallet = await client.api("wallets").get(senderWalletAddress);
                senderNonce = Utils.BigNumber.make(senderWallet.body.data.nonce).plus(1);
            } catch (err) {
                console.log(errorColor(err));
                console.log(errorColor("Cannot retrieve nonce"))
            }

            let transaction = {};

// Step 2: Create and Sign the transaction
            if ('memo' in argv) {
                //console.log("Memo exists");
                transaction = Transactions.BuilderFactory.vote()
                    .nonce(senderNonce.toFixed())
                    .votesAsset(JSON.parse(delegate))       
                    //.votesAsset({"goose": 0.01, "pnwdrew": 30.00, "friendsoflittleyus": 69.99})  
                    //.votesAsset({"})    cancel vote
                    .fee(argv.fee)
                    .memo(argv.memo)
                    .sign(passphrase);
            } else {
                // console.log("memo does not exist");
                transaction = Transactions.BuilderFactory.vote()
                    .nonce(senderNonce.toFixed())
                    .votesAsset(JSON.parse(delegate))       
                    .fee(argv.fee)
                    .sign(passphrase);
            }

            // Step 3: Broadcast the transaction
            console.log(infoColor("Sending transaction..."));
            const broadcastResponse = await client.api("transactions").create({ transactions: [transaction.build().toJson()] });
            // console.log(JSON.stringify(broadcastResponse.body, null, 4))
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



    process.on("uncaughtException", (err) => {
        console.log(errorColor("UncaughtException %s"), err);
    })


    yargs.parse()
})();
